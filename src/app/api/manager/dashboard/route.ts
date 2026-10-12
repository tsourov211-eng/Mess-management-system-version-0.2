import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMeals = await prisma.mealLog.findMany({
      where: { date: { gte: today, lt: tomorrow } },
    });
    const totalMealsToday = todayMeals.reduce(
      (acc, meal) =>
        acc + meal.breakfast + meal.lunch + meal.dinner + meal.guest,
      0
    );

    // 4. Today's bazaar expenses (which are Approved)
    const todayExpenses = await prisma.expense.findMany({
      where: { date: { gte: today, lt: tomorrow }, status: "Approved" },
    });
    const totalBazaarToday = todayExpenses.reduce(
      (acc, exp) => acc + exp.amount,
      0
    );

    // 5. Month-specific live meal rate calculation
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
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
    const rawRate = (totalMonthMeals > 0 && (monthExpenses._sum.amount || 0) > 0)
      ? (monthExpenses._sum.amount || 0) / totalMonthMeals
      : 46.15;
    const currentMealRate = Math.round(rawRate * 100) / 100;

    // 6. Market Duty for today
    const todayDuty = await prisma.bazaarSchedule.findFirst({
      where: { date: { gte: today, lt: tomorrow } },
      include: { user: { select: { name: true } } },
    });
    const marketDuty = todayDuty?.user?.name || "Super Admin";

    // 7. Mess Fund: Total Deposits Collected - Total Actual Expenses Paid (Approved)
    const depositAgg = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: { status: "Approved" },
    });
    const totalDeposits = depositAgg._sum.amount || 0;

    const expenseAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { status: "Approved" },
    });
    const totalExpenses = expenseAgg._sum.amount || 0;

    const messFund = Math.round((totalDeposits - totalExpenses) * 100) / 100;

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
          messFund,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to load manager dashboard");
  }
}