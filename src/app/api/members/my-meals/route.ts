import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from "@/lib/rate-limit";
import { safeErrorResponse, sanitizeInput } from "@/lib/security";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // Determine today's meal status
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const todaysMeal = await prisma.mealLog.findFirst({
      where: {
        userId: user.id, // Strictly scoped to session (Anti-IDOR)
        date: { gte: today, lt: tomorrow },
      },
    });

    const todayStatus = {
      breakfast: todaysMeal && todaysMeal.breakfast > 0 ? "ON" : "OFF",
      lunch: todaysMeal && todaysMeal.lunch > 0 ? "ON" : "OFF",
      dinner: todaysMeal && todaysMeal.dinner > 0 ? "ON" : "OFF",
    };

    // Determine tomorrow's meal plan (saved or default)
    const tomorrowsMeal = await prisma.mealLog.findFirst({
      where: {
        userId: user.id,
        date: { gte: tomorrow, lt: dayAfterTomorrow },
      },
    });

    const tomorrowPlan = {
      breakfast: tomorrowsMeal ? tomorrowsMeal.breakfast : (user.defaultBreakfast ?? 0.5),
      lunch: tomorrowsMeal ? tomorrowsMeal.lunch : (user.defaultLunch ?? 1.0),
      dinner: tomorrowsMeal ? tomorrowsMeal.dinner : (user.defaultDinner ?? 1.0),
      guest: tomorrowsMeal ? tomorrowsMeal.guest : 0,
    };

    // Fetch monthly meal history
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    const endOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));

    const monthlyMeals = await prisma.mealLog.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { date: "desc" },
    });

    // Fetch user's previous guest meal requests
    const guestRequests = await prisma.guestMealRequest.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(
      { success: true, todayStatus, tomorrowPlan, guestRequests, monthlyMeals },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to fetch meal history");
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const clientId = getClientIdentifier(req, "toggle-today-meal");
    const rateCheck = checkRateLimit(clientId, 30, 60 * 1000);
    if (!rateCheck.success) {
      return rateLimitExceededResponse(rateCheck.resetAt);
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { meal, enabled } = body; // meal: "breakfast" | "lunch" | "dinner", enabled: boolean

    if (!meal || typeof enabled !== "boolean") {
      return NextResponse.json({ success: false, error: "Meal type and status are required" }, { status: 400 });
    }

    const validMeals = ["breakfast", "lunch", "dinner"];
    if (!validMeals.includes(meal)) {
      return NextResponse.json({ success: false, error: "Invalid meal type" }, { status: 400 });
    }

    // Cutoff time validation
    const now = new Date();
    const currentHour = now.getHours();

    if (meal === "breakfast" && currentHour >= 8) {
      return NextResponse.json({ success: false, error: "Breakfast cutoff time (8:00 AM) has passed for today" }, { status: 400 });
    }
    if (meal === "lunch" && currentHour >= 12) {
      return NextResponse.json({ success: false, error: "Lunch cutoff time (12:00 PM) has passed for today" }, { status: 400 });
    }
    if (meal === "dinner" && currentHour >= 21) {
      return NextResponse.json({ success: false, error: "Dinner cutoff time (9:00 PM) has passed for today" }, { status: 400 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const defaultVal = meal === "breakfast" ? (user.defaultBreakfast ?? 0.5) : (meal === "lunch" ? (user.defaultLunch ?? 1.0) : (user.defaultDinner ?? 1.0));
    const newVal = enabled ? (defaultVal > 0 ? defaultVal : 1.0) : 0;

    const updatedLog = await prisma.mealLog.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        [meal]: newVal,
      },
      create: {
        userId: user.id,
        date: today,
        breakfast: meal === "breakfast" ? newVal : (user.defaultBreakfast ?? 0.5),
        lunch: meal === "lunch" ? newVal : (user.defaultLunch ?? 1.0),
        dinner: meal === "dinner" ? newVal : (user.defaultDinner ?? 1.0),
        guest: 0,
      },
    });

    const todayStatus = {
      breakfast: updatedLog.breakfast > 0 ? "ON" : "OFF",
      lunch: updatedLog.lunch > 0 ? "ON" : "OFF",
      dinner: updatedLog.dinner > 0 ? "ON" : "OFF",
    };

    return NextResponse.json({ success: true, todayStatus, mealLog: updatedLog }, { status: 200 });
  } catch (error) {
    return safeErrorResponse(error, "Failed to toggle today meal");
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting: 30 requests per minute
    const clientId = getClientIdentifier(req, "guest-meal");
    const rateCheck = checkRateLimit(clientId, 30, 60 * 1000);
    if (!rateCheck.success) {
      return rateLimitExceededResponse(rateCheck.resetAt);
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { date, mealType, guests, note } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
    }

    const reqDate = new Date(date);
    if (isNaN(reqDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid date format" }, { status: 400 });
    }
    reqDate.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    // 1. Prevent requesting for past dates or closed months
    if (reqDate < todayStart) {
      return NextResponse.json(
        { success: false, error: "Cannot request guest meals for past dates or locked periods" },
        { status: 400 }
      );
    }

    const validGuests = Math.max(1, Math.min(50, Math.round(Number(guests) || 1)));
    const cleanMealType = sanitizeInput(mealType) || "LUNCH";
    const cleanNote = note ? sanitizeInput(note).slice(0, 500) : null;

    // 2. Daily cutoff enforcement
    if (reqDate.getTime() === todayStart.getTime()) {
      const currentHour = now.getHours();
      const normMeal = cleanMealType.toUpperCase();
      if (normMeal.includes("BREAKFAST") && currentHour >= 8) {
        return NextResponse.json({ success: false, error: "Breakfast cutoff time (8:00 AM) has passed for today" }, { status: 400 });
      }
      if (normMeal.includes("LUNCH") && currentHour >= 12) {
        return NextResponse.json({ success: false, error: "Lunch cutoff time (12:00 PM) has passed for today" }, { status: 400 });
      }
      if (normMeal.includes("DINNER") && currentHour >= 21) {
        return NextResponse.json({ success: false, error: "Dinner cutoff time (9:00 PM) has passed for today" }, { status: 400 });
      }
      if ((normMeal.includes("ALL") || normMeal.includes("BOTH")) && currentHour >= 12) {
        return NextResponse.json({ success: false, error: "Cutoff time has passed for all-day guest meals today" }, { status: 400 });
      }
    }

    const newRequest = await prisma.guestMealRequest.create({
      data: {
        userId: user.id, // Strictly scoped to session (Anti-IDOR)
        date: reqDate,
        mealType: cleanMealType,
        guests: validGuests,
        note: cleanNote,
        status: "Pending",
      },
    });

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error) {
    return safeErrorResponse(error, "Failed to create guest meal request");
  }
}