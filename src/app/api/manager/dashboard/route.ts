import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  calculateMealRate, 
  getMonthDateRange, 
  getDhakaTodayStartAndEnd,
  calculateFunds,
  round1,
  round2,
  ensureTodayBazaarNotice,
  ensureTodayMealLogs,
  calculateConsumedMeals,
  reconcileLegacyNotices
} from "@/lib/calculations";
import { safeErrorResponse } from "@/lib/security";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, clearedNotices: true },
    });
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return NextResponse.json({ success: false, error: "Forbidden: Manager access required" }, { status: 403 });
    }

    // Ensure midnight / today notice is synchronized
    await ensureTodayBazaarNotice(prisma);

    // Reconcile any legacy notices that were created without userId
    await reconcileLegacyNotices(prisma);

    // Ensure today's meal logs are populated
    await ensureTodayMealLogs(prisma);

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Dynamic month date filter
    const { 
      year: targetYear, 
      month: targetMonth, 
      dateFilter, 
      monthName 
    } = getMonthDateRange(yearParam, monthParam);

    // Dhaka-aware Today's date filter
    const { todayStart, todayEnd } = getDhakaTodayStartAndEnd();
    const todayDateFilter = { gte: todayStart, lt: todayEnd };

    // Parallelize all 13 independent queries for maximum responsiveness
    const [
      dbNotices,
      pendingDeposits,
      pendingExpenses,
      pendingBazaarSchedules,
      pendingGuestMeals,
      todayMeals,
      todayExpenses,
      monthExpenses,
      monthMeals,
      todayDuty,
      allDepositsAgg,
      mealDepositAgg,
      expenseAgg,
    ] = await Promise.all([
      // 1. Notices for manager / admin (only global notices OR personal notices for this admin/manager)
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
      // 2. Pending payment requests (Deposit)
      prisma.deposit.findMany({
        where: { status: "Pending" },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { date: "desc" },
      }),
      // 3. Pending bazaar expenses (Expense)
      prisma.expense.findMany({
        where: { status: "Pending" },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { date: "desc" },
      }),
      // 4. Pending bazaar schedules
      prisma.bazaarSchedule.findMany({
        where: { status: "pending" },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { date: "asc" },
      }),
      // 5. Pending guest meal requests
      prisma.guestMealRequest.findMany({
        where: { status: "Pending" },
        include: { user: { select: { id: true, name: true, image: true, email: true } } },
        orderBy: { date: "asc" },
      }),
      // 6. Today meals
      prisma.mealLog.findMany({
        where: { date: todayDateFilter },
        select: { breakfast: true, lunch: true, dinner: true, guest: true },
      }),
      // 7. Today bazaar expenses (Approved)
      prisma.expense.findMany({
        where: { date: todayDateFilter, status: "Approved" },
        select: { amount: true },
      }),
      // 8. Month expenses (Approved)
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: "Approved", date: dateFilter },
      }),
      // 9. Month meals
      prisma.mealLog.findMany({
        where: { date: dateFilter },
        select: { date: true, breakfast: true, lunch: true, dinner: true, guest: true },
      }),
      // 10. Market Duty for today
      prisma.bazaarSchedule.findFirst({
        where: { date: todayDateFilter },
        include: { user: { select: { name: true } } },
      }),
      // 11. All approved deposits (all-time)
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { status: "Approved" },
      }),
      // 12. Approved meal fund deposits (all-time)
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
      // 13. Approved expenses (all-time)
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: "Approved" },
      }),
    ]);

    const { dhaka: dhakaNow } = getDhakaTodayStartAndEnd();

    // Today calculations
    const totalMealsToday = todayMeals.reduce(
      (acc, meal) => acc + (meal.breakfast || 0) + (meal.lunch || 0) + (meal.dinner || 0) + (meal.guest || 0),
      0
    );
    const totalBazaarToday = todayExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

    // Month calculations
    const totalMonthMeals = round1(
      monthMeals.reduce(
        (acc, m) => acc + calculateConsumedMeals(m, dhakaNow, { todayStart, todayEnd }),
        0
      )
    );
    const currentMealRate = calculateMealRate(monthExpenses._sum.amount || 0, totalMonthMeals);

    // Market Duty
    const marketDuty = todayDuty?.user?.name || "Unassigned";

    // Strict Segregated Funds
    const totalApprovedDeposits = allDepositsAgg._sum.amount || 0;
    const totalMealDeposits = mealDepositAgg._sum.amount || 0;
    const totalExpensesAllTime = expenseAgg._sum.amount || 0;
    const funds = calculateFunds({
      totalApprovedDeposits,
      totalMealDeposits,
      totalFoodExpenses: totalExpensesAllTime,
    });

    // Filter notices: Only global announcements OR personal notifications specifically for this user
    const filteredNotices = dbNotices.filter((n) => {
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

    return NextResponse.json(
      {
        notices: filteredNotices,
        pendingDeposits,
        pendingExpenses,
        pendingBazaarSchedules,
        pendingGuestMeals,
        stats: {
          totalMealsToday: round1(totalMealsToday),
          totalBazaarToday: Math.round(totalBazaarToday),
          currentMealRate,
          liveMealRate: currentMealRate,
          marketDuty,
          marketDutyStatus: todayDuty?.status || "pending",
          mealFund: funds.mealFund,
          messFund: funds.messFund,
          totalFund: funds.totalFund,
          period: {
            month: targetMonth,
            year: targetYear,
            monthName,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to load manager dashboard");
  }
}