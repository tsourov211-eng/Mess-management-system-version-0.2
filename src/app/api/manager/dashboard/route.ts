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
      select: { role: true },
    });
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return NextResponse.json({ success: false, error: "Forbidden: Manager access required" }, { status: 403 });
    }

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

    return NextResponse.json(
      {
        pendingDeposits,
        pendingExpenses,
        pendingBazaarSchedules,
        pendingGuestMeals,
        stats: {
          totalMealsToday: Math.round(totalMealsToday * 10) / 10,
          totalBazaarToday: Math.round(totalBazaarToday),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to load manager dashboard");
  }
}