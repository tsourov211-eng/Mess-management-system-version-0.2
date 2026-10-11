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
    // Check if user is logged in and is admin or manager
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    let startDate: Date;
    let endDate: Date;

    if (monthParam && yearParam) {
      const year = parseInt(yearParam);
      const month = parseInt(monthParam); // 1 to 12
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 1);
    } else {
      // Default to current month if no params provided
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Date filter for prisma
    const dateFilter = {
      gte: startDate,
      lt: endDate,
    };

    // 1. Fetch total mess expense (Bazaar) for the month
    const expenseAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { 
        status: "Approved",
        date: dateFilter
      },
    });
    const totalBazaarCost = expenseAgg._sum.amount || 0;

    // 2. Fetch total mess meals for the month
    const allMeals = await prisma.mealLog.findMany({
      where: { date: dateFilter }
    });
    const totalMealsConsumed = allMeals.reduce(
      (acc, meal) => acc + meal.breakfast + meal.lunch + meal.dinner + meal.guest,
      0
    );

    // 3. Calculate Live Meal Rate for the month (0.00 fallback if 0 meals)
    const liveMealRate = calculateMealRate(totalBazaarCost, totalMealsConsumed);

    // 4. Fetch Monthly Expense (Fixed Overheads) for the month
    const monthKey = formatMonthKey(startDate);
    const monthlyExpenseConfig = await prisma.monthlyExpense.findUnique({
      where: { month: monthKey },
    });
    const fixedCostPerMember = calculateFixedCostPerMember(monthlyExpenseConfig);

    // 5. Fetch all active members
    const members = await prisma.user.findMany({
      where: { 
        role: { not: "pending" }
      },
      select: {
        id: true,
        name: true,
        role: true,
      }
    });

    let globalTotalDeposit = 0;
    let globalCurrentBalance = 0;

    // Calculate individual stats for the month
    const memberReports = await Promise.all(members.map(async (member) => {
      // User's deposit for the month
      const userDepositAgg = await prisma.deposit.aggregate({
        _sum: { amount: true },
        where: {
          userId: member.id,
          status: "Approved",
          date: dateFilter
        }
      });
      const depositAmount = userDepositAgg._sum.amount || 0;

      // User's bazaar/expense for the month
      const userExpenseAgg = await prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          userId: member.id,
          status: "Approved",
          date: dateFilter
        }
      });
      const bazaarAmount = userExpenseAgg._sum.amount || 0;

      // User's meals for the month
      const userMealsLog = await prisma.mealLog.findMany({
        where: {
          userId: member.id,
          date: dateFilter
        }
      });
      const mealsConsumed = userMealsLog.reduce(
        (acc, meal) => acc + meal.breakfast + meal.lunch + meal.dinner + meal.guest,
        0
      );

      // Financial Summary using calculation engine
      const summary = calculateMemberSummary({
        userId: member.id,
        name: member.name || "Unnamed",
        role: member.role,
        totalDeposit: depositAmount,
        totalMeals: mealsConsumed,
        mealRate: liveMealRate,
        fixedCost: fixedCostPerMember,
      });

      globalTotalDeposit += depositAmount;
      globalCurrentBalance += summary.balance;

      return {
        id: member.id,
        name: member.name || "Unnamed",
        role: member.role,
        bazaarAmount: Math.round(bazaarAmount * 100) / 100,
        depositAmount: Math.round(depositAmount * 100) / 100,
        mealsConsumed: Math.round(mealsConsumed * 10) / 10,
        mealCost: summary.mealCost,
        fixedCost: summary.fixedCost,
        totalCost: summary.totalCost,
        currentBalance: summary.balance,
        isPositive: summary.isPositive,
        balanceFormatted: summary.balanceFormatted,
      };
    }));

    // Sort member reports by name
    memberReports.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      stats: {
        totalMembers: members.length,
        totalBazaarCost: Math.round(totalBazaarCost * 100) / 100,
        totalDeposit: Math.round(globalTotalDeposit * 100) / 100,
        totalMealsConsumed: Math.round(totalMealsConsumed * 10) / 10,
        fixedCostPerMember,
        currentBalance: Math.round(globalCurrentBalance * 100) / 100,
        liveMealRate,
      },
      memberReports,
      period: {
        month: monthParam ? parseInt(monthParam) : new Date().getMonth() + 1,
        year: yearParam ? parseInt(yearParam) : new Date().getFullYear(),
      }
    });

  } catch (error) {
    return safeErrorResponse(error, "Failed to fetch reports data");
  }
}
