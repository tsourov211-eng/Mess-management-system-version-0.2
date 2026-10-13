import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  calculateMealRate, 
  calculateFixedCostPerMember, 
  calculateMemberSummary, 
  getMonthDateRange,
  calculateFunds,
  round1,
  round2,
  ensureTodayBazaarNotice,
  ensureTodayMealLogs,
  calculateConsumedMeals,
  getDhakaTodayStartAndEnd,
  syncUserGuestMeals,
  reconcileLegacyNotices
} from "@/lib/calculations";
import { safeErrorResponse } from "@/lib/security";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure today's bazaar duty announcement notice is created / updated
    await ensureTodayBazaarNotice(prisma);

    // Reconcile any legacy notices that were created without userId
    await reconcileLegacyNotices(prisma);

    // Ensure today's meal logs exist for all active mess members
    await ensureTodayMealLogs(prisma);

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Dynamic month boundaries & keys
    const { 
      year: targetYear, 
      month: targetMonth, 
      dateFilter, 
      allMonthKeys, 
      monthName 
    } = getMonthDateRange(yearParam, monthParam);

    // Ensure approved guest meals are synchronized for active month
    await syncUserGuestMeals(prisma, user.id, dateFilter);

    // Parallelize all 12 independent database queries for lightning-fast performance
    const [
      depositAgg,
      userMealDepositAgg,
      userMeals,
      expenseAgg,
      allMeals,
      monthlyExpenseConfig,
      allDepositsAgg,
      allMealDepositsAgg,
      allFoodExpensesAgg,
      recentMeals,
      dbNotices,
      userGuestRequests,
    ] = await Promise.all([
      // 1. User total approved deposits for the active month
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          status: "Approved",
          date: dateFilter,
        },
      }),
      // 2. User approved meal fund deposits for the active month
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          status: "Approved",
          date: dateFilter,
          OR: [
            { category: "Meal Fund" },
            { category: null },
            { category: "" },
          ],
        },
      }),
      // 3. User meals for the active month
      prisma.mealLog.findMany({
        where: { userId: user.id, date: dateFilter },
        select: { date: true, breakfast: true, lunch: true, dinner: true, guest: true },
      }),
      // 4. Mess total food expenses for active month
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: "Approved", date: dateFilter },
      }),
      // 5. Mess total meals for active month
      prisma.mealLog.findMany({
        where: { date: dateFilter },
        select: { date: true, breakfast: true, lunch: true, dinner: true, guest: true },
      }),
      // 6. Monthly Fixed Overhead Config
      prisma.monthlyExpense.findFirst({
        where: { month: { in: allMonthKeys } },
      }),
      // 7. Mess-wide all-time approved deposits
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { status: "Approved" },
      }),
      // 8. Mess-wide all-time approved meal deposits
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: {
          status: "Approved",
          OR: [
            { category: "Meal Fund" },
            { category: null },
            { category: "" },
          ],
        },
      }),
      // 9. Mess-wide all-time approved food expenses
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: "Approved" },
      }),
      // 10. User recent meals (last 7 days)
      prisma.mealLog.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 7,
      }),
      // 11. Notice board (only global notices OR personal notices for this user)
      prisma.notice.findMany({
        where: { 
          isActive: true,
          id: { notIn: user.clearedNotices || [] },
          OR: [
            { userId: user.id },
            { userId: null },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      // 12. User guest meal requests
      prisma.guestMealRequest.findMany({
        where: { 
          userId: user.id,
          id: { notIn: user.clearedNotices || [] }
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    // Financial calculations
    const totalDeposit = depositAgg._sum.amount || 0;
    const userMealDeposit = userMealDepositAgg._sum.amount || 0;
    const userOverheadDeposit = Math.max(0, totalDeposit - userMealDeposit);

    const { todayStart, todayEnd, dhaka: dhakaNow } = getDhakaTodayStartAndEnd();
    const dhakaUtcToday = new Date(Date.UTC(dhakaNow.year, dhakaNow.month - 1, dhakaNow.day, 0, 0, 0, 0));

    // Guarantee today's meal is represented if user visits during active month
    if (targetMonth === dhakaNow.month && targetYear === dhakaNow.year) {
      const hasTodayInUserMeals = userMeals.some((m) => {
        const d = new Date(m.date);
        return d.getTime() >= todayStart.getTime() && d.getTime() < todayEnd.getTime();
      });
      if (!hasTodayInUserMeals) {
        userMeals.push({
          date: dhakaUtcToday,
          breakfast: user.defaultBreakfast ?? 0.5,
          lunch: user.defaultLunch ?? 1.0,
          dinner: user.defaultDinner ?? 1.0,
          guest: 0,
        });
      }
    }

    // Accurately compute consumed meals based on Dhaka meal cutoff times
    const totalMeals = round1(
      userMeals.reduce(
        (acc, meal) => acc + calculateConsumedMeals(meal, dhakaNow, { todayStart, todayEnd }),
        0
      )
    );

    const totalMessExpense = expenseAgg._sum.amount || 0;
    const totalMessMeals = round1(
      allMeals.reduce(
        (acc, meal) => acc + calculateConsumedMeals(meal, dhakaNow, { todayStart, todayEnd }),
        0
      )
    );

    // Live Meal Rate (0.00 fallback on 0 meals)
    const liveMealRate = calculateMealRate(totalMessExpense, totalMessMeals);

    // Fixed overhead
    const fixedCostPerMember = calculateFixedCostPerMember(monthlyExpenseConfig);

    // Strict Segregated Funds
    const allTotalDeposits = allDepositsAgg._sum.amount || 0;
    const allMealDeposits = allMealDepositsAgg._sum.amount || 0;
    const allFoodExpenses = allFoodExpensesAgg._sum.amount || 0;
    const funds = calculateFunds({
      totalApprovedDeposits: allTotalDeposits,
      totalMealDeposits: allMealDeposits,
      totalFoodExpenses: allFoodExpenses,
    });

    // Member Financial Summary
    const summary = calculateMemberSummary({
      userId: user.id,
      name: user.name || "Member",
      role: user.role,
      totalDeposit,
      totalMeals,
      mealRate: liveMealRate,
      fixedCost: fixedCostPerMember,
    });

    // Filter notices: Only global announcements OR personal notifications specifically for this user
    const filteredDbNotices = dbNotices.filter((n) => {
      const isPersonal =
        n.userId != null ||
        n.type === "guest_meal" ||
        n.type === "payment" ||
        n.title?.toLowerCase().includes("guest meal") ||
        n.description?.toLowerCase().includes("your request for");

      if (isPersonal) {
        return n.userId === user.id;
      }
      return true;
    });

    // Format notices & guest meal notices (avoid duplicates if real notice exists)
    const guestNotices = userGuestRequests
      .filter((g) => {
        const dateObj = new Date(g.date);
        const dStr1 = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const dStr2 = dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
        const hasDbNotice = filteredDbNotices.some((n) =>
          n.type === "guest_meal" &&
          (n.description?.includes(dStr1) || n.description?.includes(dStr2))
        );
        return !hasDbNotice;
      })
      .map((g) => {
        const gDate = new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
        const statusTitle = g.status === "Approved" 
          ? "Your guest meal request approved." 
          : (g.status === "Rejected" ? "Your guest meal request rejected." : "Your guest meal request pending.");
        return {
          id: `guest_${g.id}`,
          title: statusTitle,
          description: `${g.guests} guest meal${g.guests > 1 ? "s" : ""} on ${gDate} (${g.mealType}).`,
          type: "guest_meal",
          status: g.status,
          createdAt: g.updatedAt || g.createdAt,
        };
      });

    const notices = [...filteredDbNotices, ...guestNotices].sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return NextResponse.json({
      stats: {
        totalDeposit: summary.totalDeposit,
        userMealDeposit: round2(userMealDeposit),
        userOverheadDeposit: round2(userOverheadDeposit),
        totalMeals: summary.totalMeals,
        mealCost: summary.mealCost,
        fixedCost: summary.fixedCost,
        totalCost: summary.totalCost,
        currentBalance: summary.balance,
        isPositive: summary.isPositive,
        balanceFormatted: summary.balanceFormatted,
        liveMealRate,
        mealFund: funds.mealFund,
        messFund: funds.messFund,
        totalFund: funds.totalFund,
        period: {
          month: targetMonth,
          year: targetYear,
          monthName,
        },
      },
      monthlyOverheadConfig: monthlyExpenseConfig ? {
        seatRent: monthlyExpenseConfig.seatRent || 0,
        electricityGas: monthlyExpenseConfig.electricityGas || 0,
        internet: monthlyExpenseConfig.internet || 0,
        maid: monthlyExpenseConfig.maid || 0,
        additional: monthlyExpenseConfig.additional || 0,
        mealCharge: monthlyExpenseConfig.mealCharge || 0,
      } : null,
      recentMeals,
      notices,
      defaultMeals: {
        breakfast: user.defaultBreakfast || 0,
        lunch: user.defaultLunch || 0,
        dinner: user.defaultDinner || 0,
      },
    });
  } catch (error) {
    return safeErrorResponse(error, "Failed to fetch dashboard data");
  }
}