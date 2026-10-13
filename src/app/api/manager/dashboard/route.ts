import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMealRate } from "@/lib/calculations";
import { safeErrorResponse } from "@/lib/security";

export async function GET() {
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

    // Notices for manager
    const notices = await prisma.notice.findMany({
      where: {
        isActive: true,
        id: { notIn: user.clearedNotices || [] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // 1. Pending payment requests (Deposit)
    const pendingDeposits = await prisma.deposit.findMany({
      where: { status: "Pending" },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { date: "desc" },
    });

    // 2. Pending bazaar expenses (Expense)
    const pendingExpenses = await prisma.expense.findMany({
      where: { status: "Pending" },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { date: "desc" },
    });

    // 2.5 Pending bazaar schedules
    const pendingBazaarSchedules = await prisma.bazaarSchedule.findMany({
      where: { status: "pending" },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { date: "asc" },
    });

    // 2.7 Pending guest meal requests
    const pendingGuestMeals = await prisma.guestMealRequest.findMany({
      where: { status: "Pending" },
      include: { user: { select: { id: true, name: true, image: true, email: true } } },
      orderBy: { date: "asc" },
    });

    // 3. Total meals today
    const now = new Date();
    const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const localTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const utcTomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

    const todayStart = new Date(Math.min(localToday.getTime(), utcToday.getTime()));
    const todayEnd = new Date(Math.max(localTomorrow.getTime(), utcTomorrow.getTime()));
    const todayDateFilter = { gte: todayStart, lt: todayEnd };

    const todayMeals = await prisma.mealLog.findMany({
      where: { date: todayDateFilter },
    });
    const totalMealsToday = todayMeals.reduce(
      (acc, meal) =>
        acc + meal.breakfast + meal.lunch + meal.dinner + meal.guest,
      0
    );

    // 4. Today's bazaar expenses (which are Approved)
    const todayExpenses = await prisma.expense.findMany({
      where: { date: todayDateFilter, status: "Approved" },
    });
    const totalBazaarToday = todayExpenses.reduce(
      (acc, exp) => acc + exp.amount,
      0
    );

    // 5. Month-specific live meal rate calculation
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const dateFilter = { gte: startOfMonth, lt: endOfMonth };

    const monthExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { status: "Approved", date: dateFilter },
    });
    const monthMeals = await prisma.mealLog.findMany({
      where: { date: dateFilter },
    });
    const totalMonthMeals = monthMeals.reduce(
      (acc, m) => acc + m.breakfast + m.lunch + m.dinner + m.guest,
      0
    );
    const currentMealRate = calculateMealRate(monthExpenses._sum.amount || 0, totalMonthMeals);

    // 6. Market Duty for today
    const todayDuty = await prisma.bazaarSchedule.findFirst({
      where: { date: todayDateFilter },
      include: { user: { select: { name: true } } },
    });
    const marketDuty = todayDuty?.user?.name || "Unassigned";

    // 7. Separate Funds:
    // Meal Fund: Total Meal Deposits Collected - Total Actual Food Expenses Paid (Approved)
    const mealDepositAgg = await prisma.deposit.aggregate({
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
    const totalMealDeposits = mealDepositAgg._sum.amount || 0;

    const expenseAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { status: "Approved" },
    });
    const totalExpenses = expenseAgg._sum.amount || 0;

    const mealFund = Math.round((totalMealDeposits - totalExpenses) * 100) / 100;

    // Mess Fund: Total Overhead Deposits Collected (Seat Rent, Utilities, WiFi, Maid, Additional)
    const overheadDepositAgg = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: {
        status: "Approved",
        NOT: [
          { category: "Meal Fund" },
        ],
      },
    });
    const messFund = Math.round((overheadDepositAgg._sum.amount || 0) * 100) / 100;
    const totalFund = Math.round((mealFund + messFund) * 100) / 100;

    return NextResponse.json(
      {
        notices,
        pendingDeposits,
        pendingExpenses,
        pendingBazaarSchedules,
        pendingGuestMeals,
        stats: {
          totalMealsToday: Math.round(totalMealsToday * 10) / 10,
          totalBazaarToday: Math.round(totalBazaarToday),
          currentMealRate,
          liveMealRate: currentMealRate,
          marketDuty,
          mealFund,
          messFund,
          totalFund,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to load manager dashboard");
  }
}