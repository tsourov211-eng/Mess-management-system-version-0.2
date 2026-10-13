import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  calculateMealRate, 
  calculateFixedCostPerMember, 
  calculateMemberSummary, 
  formatMonthKey 
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

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const now = new Date();
    const targetYear = yearParam ? parseInt(yearParam) : now.getFullYear();
    const targetMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const dateFilter = { gte: startOfMonth, lt: endOfMonth };

    // 1. 💡 Total Deposit for the current month
    const depositAgg = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: {
        userId: user.id,
        status: "Approved",
        date: dateFilter,
      },
    });
    const totalDeposit = depositAgg._sum.amount || 0;

    // 2. User's total meals for the current month
    const userMeals = await prisma.mealLog.findMany({
      where: { userId: user.id, date: dateFilter },
    });
    const totalMeals = userMeals.reduce(
      (acc, meal) => acc + meal.breakfast + meal.lunch + meal.dinner + meal.guest,
      0
    );

    // 3. Mess total food expenses for the current month
    const expenseAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { status: "Approved", date: dateFilter },
    });
    const totalMessExpense = expenseAgg._sum.amount || 0;

    // 4. Mess total meals for the current month
    const allMeals = await prisma.mealLog.findMany({
      where: { date: dateFilter },
    });
    const totalMessMeals = allMeals.reduce(
      (acc, meal) => acc + meal.breakfast + meal.lunch + meal.dinner + meal.guest,
      0
    );

    // 5. Calculate Live Meal Rate (0.00 fallback if 0 meals)
    const liveMealRate = calculateMealRate(totalMessExpense, totalMessMeals);

    // 6. Monthly Fixed Overhead
    const monthKey = formatMonthKey(startOfMonth);
    const isoMonthKey = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
    const monthlyExpenseConfig = await prisma.monthlyExpense.findFirst({
      where: {
        OR: [
          { month: monthKey },
          { month: isoMonthKey }
        ]
      },
    });
    const fixedCostPerMember = calculateFixedCostPerMember(monthlyExpenseConfig);

    // 7. Separate Funds:
    // Mess-wide Meal Fund = Approved Meal Deposits - Approved Food Expenses
    const allMealDepositsAgg = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: {
        status: "Approved",
        OR: [
          { category: "Meal Fund" },
          { category: null },
          { category: "" },
        ],
      },
    });
    const allMealDeposits = allMealDepositsAgg._sum.amount || 0;

    const allFoodExpensesAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { status: "Approved" },
    });
    const allFoodExpenses = allFoodExpensesAgg._sum.amount || 0;
    const mealFund = Math.round((allMealDeposits - allFoodExpenses) * 100) / 100;

    // Mess-wide Overhead / Mess Fund = Approved Overhead Deposits
    const allOverheadDepositsAgg = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: {
        status: "Approved",
        NOT: [
          { category: "Meal Fund" },
        ],
      },
    });
    const messFund = Math.round((allOverheadDepositsAgg._sum.amount || 0) * 100) / 100;

    // Member's own deposit breakdown for active month
    const userMealDepositAgg = await prisma.deposit.aggregate({
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
    });
    const userMealDeposit = userMealDepositAgg._sum.amount || 0;
    const userOverheadDeposit = Math.max(0, totalDeposit - userMealDeposit);

    // 8. Member Financial Summary
    const summary = calculateMemberSummary({
      userId: user.id,
      name: user.name || "Member",
      role: user.role,
      totalDeposit,
      totalMeals,
      mealRate: liveMealRate,
      fixedCost: fixedCostPerMember,
    });

    // 9. Recent Meals (Last 7 days)
    const recentMeals = await prisma.mealLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 7,
    });

    // 10. Notice Board (Exclude cleared notices & include user's guest meal requests)
    const dbNotices = await prisma.notice.findMany({
      where: { 
        isActive: true,
        id: { notIn: user.clearedNotices || [] }
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const userGuestRequests = await prisma.guestMealRequest.findMany({
      where: { 
        userId: user.id,
        id: { notIn: user.clearedNotices || [] }
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    const guestNotices = userGuestRequests.map((g) => {
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

    const notices = [...dbNotices, ...guestNotices].sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return NextResponse.json({
      stats: {
        totalDeposit: summary.totalDeposit,
        userMealDeposit: Math.round(userMealDeposit * 100) / 100,
        userOverheadDeposit: Math.round(userOverheadDeposit * 100) / 100,
        totalMeals: summary.totalMeals,
        mealCost: summary.mealCost,
        fixedCost: summary.fixedCost,
        totalCost: summary.totalCost,
        currentBalance: summary.balance,
        isPositive: summary.isPositive,
        balanceFormatted: summary.balanceFormatted,
        liveMealRate,
        mealFund,
        messFund,
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