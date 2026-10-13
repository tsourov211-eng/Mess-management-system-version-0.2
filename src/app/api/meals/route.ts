import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateMealRate, getDhakaTodayStartAndEnd, getMonthDateRange, round1 } from "@/lib/calculations";
import { SaveMealsSchema } from "@/lib/validations";
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from "@/lib/rate-limit";
import { safeErrorResponse } from "@/lib/security";

// 1. GET request to fetch members and meal list for a specific date
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // e.g.: 2026-09-19

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Dhaka-aware Today's date filter
    const { todayStart, todayEnd } = getDhakaTodayStartAndEnd();
    const todayDateFilter = { gte: todayStart, lt: todayEnd };

    // Month date filter
    const { dateFilter: monthDateFilter } = getMonthDateRange();

    // Fetch active members, daily logs, today stats, and month stats in parallel
    const [
      users,
      mealLogs,
      todayMeals,
      todayExpenses,
      monthExpenses,
      monthMeals,
    ] = await Promise.all([
      // Fetch all active members
      prisma.user.findMany({
        where: { role: { not: "pending" } },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          defaultBreakfast: true,
          defaultLunch: true,
          defaultDinner: true,
        },
      }),
      // Fetch meal logs for that specific day
      prisma.mealLog.findMany({
        where: {
          date: {
            gte: targetDate,
            lt: nextDate,
          },
        },
      }),
      // Today meals
      prisma.mealLog.findMany({
        where: { date: todayDateFilter },
        select: { breakfast: true, lunch: true, dinner: true, guest: true },
      }),
      // Today bazaar expenses
      prisma.expense.findMany({
        where: { date: todayDateFilter, status: "Approved" },
        select: { amount: true },
      }),
      // Month food expenses
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: "Approved", date: monthDateFilter },
      }),
      // Month meals
      prisma.mealLog.findMany({
        where: { date: monthDateFilter },
        select: { breakfast: true, lunch: true, dinner: true, guest: true },
      }),
    ]);

    const mealMap = new Map();
    mealLogs.forEach((log) => {
      mealMap.set(log.userId, log);
    });

    // Set meal for each user (log if exists, otherwise default)
    const membersWithMeals = users.map((user) => {
      const existingLog = mealMap.get(user.id);
      return {
        userId: user.id,
        name: user.name || "Member",
        role: user.role,
        image: user.image,
        breakfast: existingLog ? existingLog.breakfast : user.defaultBreakfast ?? 0.5,
        lunch: existingLog ? existingLog.lunch : user.defaultLunch ?? 1.0,
        dinner: existingLog ? existingLog.dinner : user.defaultDinner ?? 1.0,
        guest: existingLog ? existingLog.guest : 0,
      };
    });

    const totalMealsToday = todayMeals.reduce(
      (acc, m) => acc + (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0) + (m.guest || 0),
      0
    );

    const todayBazaar = todayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    const totalMonthMeals = monthMeals.reduce(
      (acc, m) => acc + (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0) + (m.guest || 0),
      0
    );
    const liveMealRate = calculateMealRate(monthExpenses._sum.amount || 0, totalMonthMeals);

    return NextResponse.json(
      {
        date: targetDate.toISOString().split("T")[0],
        members: membersWithMeals,
        stats: {
          totalMealsToday: Math.round(totalMealsToday * 10) / 10,
          currentMealRate: liveMealRate,
          todayBazaar: Math.round(todayBazaar),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Meals GET Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch meal data!" },
      { status: 500 }
    );
  }
}

// 2. POST request to save or update meals (single or batch)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1. Rate Limiting: 30 meal mutation requests per minute
    const clientId = getClientIdentifier(req, "meals-mutation");
    const rateCheck = checkRateLimit(clientId, 30, 60 * 1000);
    if (!rateCheck.success) {
      return rateLimitExceededResponse(rateCheck.resetAt);
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const isPrivileged = currentUser.role === "admin" || currentUser.role === "manager";

    const body = await req.json();
    const parsed = SaveMealsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid meal entry data" },
        { status: 400 }
      );
    }

    const { date, meals, userId, breakfast, lunch, dinner, guest } = parsed.data;

    const mealDate = new Date(date);
    mealDate.setUTCHours(0, 0, 0, 0);

    // If batch entry is submitted
    if (Array.isArray(meals) && meals.length > 0) {
      if (!isPrivileged) {
        const forbidden = meals.some((m) => m.userId !== currentUser.id);
        if (forbidden) {
          return NextResponse.json(
            { success: false, error: "Members can only submit their own meal counts!" },
            { status: 403 }
          );
        }
      }

      const operations = meals.map((m) => {
        return prisma.mealLog.upsert({
          where: {
            userId_date: {
              userId: m.userId,
              date: mealDate,
            },
          },
          update: {
            breakfast: Number(m.breakfast) || 0,
            lunch: Number(m.lunch) || 0,
            dinner: Number(m.dinner) || 0,
            guest: Number(m.guest) || 0,
          },
          create: {
            userId: m.userId,
            date: mealDate,
            breakfast: Number(m.breakfast) || 0,
            lunch: Number(m.lunch) || 0,
            dinner: Number(m.dinner) || 0,
            guest: Number(m.guest) || 0,
          },
        });
      });

      // Wrap in ACID transaction
      await prisma.$transaction(operations);

      return NextResponse.json(
        { success: true, message: "All meal data saved successfully!" },
        { status: 200 }
      );
    }

    // Single entry processing
    const targetUserId = userId || currentUser.id;

    if (!isPrivileged && targetUserId !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: "Members can only submit their own meal counts!" },
        { status: 403 }
      );
    }

    const savedMeal = await prisma.mealLog.upsert({
      where: {
        userId_date: {
          userId: targetUserId,
          date: mealDate,
        },
      },
      update: {
        breakfast: Number(breakfast) || 0,
        lunch: Number(lunch) || 0,
        dinner: Number(dinner) || 0,
        guest: Number(guest) || 0,
      },
      create: {
        userId: targetUserId,
        date: mealDate,
        breakfast: Number(breakfast) || 0,
        lunch: Number(lunch) || 0,
        dinner: Number(dinner) || 0,
        guest: Number(guest) || 0,
      },
    });

    return NextResponse.json(
      { success: true, message: "Meal data saved successfully!", meal: savedMeal },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to save meal data");
  }
}