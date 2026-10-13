import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  calculateMealRate, 
  calculateFixedCostPerMember, 
  calculateMemberSummary, 
  getMonthDateRange,
  round1,
  round2,
  ensureTodayMealLogs,
  calculateConsumedMeals,
  getDhakaTodayStartAndEnd
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
      select: { role: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure today's meal logs are populated for all active mess members
    await ensureTodayMealLogs(prisma);

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Dynamic month calculations
    const { 
      year: targetYear, 
      month: targetMonth, 
      dateFilter, 
      allMonthKeys, 
      monthName 
    } = getMonthDateRange(yearParam, monthParam);

    // Parallel bulk queries: eliminate N+1 query loop completely
    const [
      expenseAgg,
      allMeals,
      monthlyExpenseConfig,
      members,
      allMonthDeposits,
      allMonthExpenses,
    ] = await Promise.all([
      // 1. Mess bazaar food expenses this month
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { 
          status: "Approved",
          date: dateFilter
        },
      }),
      // 2. All meal logs this month
      prisma.mealLog.findMany({
        where: { date: dateFilter },
        select: { userId: true, date: true, breakfast: true, lunch: true, dinner: true, guest: true },
      }),
      // 3. Monthly overhead config
      prisma.monthlyExpense.findFirst({
        where: { month: { in: allMonthKeys } },
      }),
      // 4. All active mess members
      prisma.user.findMany({
        where: { 
          role: { not: "pending" }
        },
        select: {
          id: true,
          name: true,
          role: true,
        },
      }),
      // 5. All approved deposits for the month (single bulk query)
      prisma.deposit.findMany({
        where: {
          status: "Approved",
          date: dateFilter,
        },
        select: { userId: true, amount: true, category: true },
      }),
      // 6. All approved bazaar expenses for the month (single bulk query)
      prisma.expense.findMany({
        where: {
          status: "Approved",
          date: dateFilter,
        },
        select: { userId: true, amount: true },
      }),
    ]);

    const { todayStart, todayEnd, dhaka: dhakaNow } = getDhakaTodayStartAndEnd();

    const totalBazaarCost = expenseAgg._sum.amount || 0;
    const totalMealsConsumed = round1(
      allMeals.reduce(
        (acc, meal) => acc + calculateConsumedMeals(meal, dhakaNow, { todayStart, todayEnd }),
        0
      )
    );

    const liveMealRate = calculateMealRate(totalBazaarCost, totalMealsConsumed);
    const fixedCostPerMember = calculateFixedCostPerMember(monthlyExpenseConfig);

    // In-memory indexing for O(1) lookups per member
    const depositsByUser = new Map<string, number>();
    for (const dep of allMonthDeposits) {
      depositsByUser.set(dep.userId, (depositsByUser.get(dep.userId) || 0) + dep.amount);
    }

    const expensesByUser = new Map<string, number>();
    for (const exp of allMonthExpenses) {
      expensesByUser.set(exp.userId, (expensesByUser.get(exp.userId) || 0) + exp.amount);
    }

    const mealsByUser = new Map<string, number>();
    for (const m of allMeals) {
      const count = calculateConsumedMeals(m, dhakaNow, { todayStart, todayEnd });
      mealsByUser.set(m.userId, round1((mealsByUser.get(m.userId) || 0) + count));
    }

    let globalTotalDeposit = 0;

    // Calculate individual stats for each member in memory
    const memberReports = members.map((member) => {
      const depositAmount = depositsByUser.get(member.id) || 0;
      const bazaarAmount = expensesByUser.get(member.id) || 0;
      const mealsConsumed = mealsByUser.get(member.id) || 0;

      const summary = calculateMemberSummary({
        userId: member.id,
        name: member.name || "Unnamed",
        role: member.role,
        totalDeposit: depositAmount,
        totalMeals: mealsConsumed,
        mealRate: liveMealRate,
        fixedCost: fixedCostPerMember,
        actualSharedCost: 0,
      });

      globalTotalDeposit += depositAmount;

      return {
        id: member.id,
        name: member.name || "Unnamed",
        role: member.role,
        bazaarAmount: round2(bazaarAmount),
        depositAmount: round2(depositAmount),
        mealsConsumed: round1(mealsConsumed),
        mealCost: summary.mealCost,
        fixedCost: summary.fixedCost,
        totalCost: summary.totalCost,
        currentBalance: summary.balance,
        isPositive: summary.isPositive,
        balanceFormatted: summary.balanceFormatted,
      };
    });

    // Total cash deposits collected across all members
    const finalTotalDeposit = round2(globalTotalDeposit);

    // Current Cash Balance (Cash in Hand) = Total Cash Deposits - Total Actual Bazaar Paid
    const currentCashBalance = round2(finalTotalDeposit - totalBazaarCost);

    // Sort member reports by name
    memberReports.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      stats: {
        totalMembers: members.length,
        totalBazaarCost: round2(totalBazaarCost),
        totalDeposit: finalTotalDeposit,
        totalMealsConsumed: round1(totalMealsConsumed),
        fixedCostPerMember,
        currentBalance: currentCashBalance,
        liveMealRate,
      },
      memberReports,
      period: {
        month: targetMonth,
        year: targetYear,
        monthName,
      },
    });

  } catch (error) {
    return safeErrorResponse(error, "Failed to fetch reports data");
  }
}
