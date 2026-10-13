import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from "@/lib/rate-limit";
import { safeErrorResponse, sanitizeInput } from "@/lib/security";
import { getDhakaDate, getMonthDateRange } from "@/lib/calculations";

function getDhakaHour(): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      hour: "numeric",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === "hour");
    return hourPart ? parseInt(hourPart.value, 10) : new Date().getHours();
  } catch {
    return new Date().getHours();
  }
}

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

    // Determine today and tomorrow strictly in Dhaka time
    const dhaka = getDhakaDate();
    const today = new Date(Date.UTC(dhaka.year, dhaka.month - 1, dhaka.day, 0, 0, 0, 0));
    const tomorrow = new Date(Date.UTC(dhaka.year, dhaka.month - 1, dhaka.day + 1, 0, 0, 0, 0));
    const dayAfterTomorrow = new Date(Date.UTC(dhaka.year, dhaka.month - 1, dhaka.day + 2, 0, 0, 0, 0));

    // Dynamic month boundaries for monthly meal history
    const { dateFilter: monthDateFilter } = getMonthDateRange(year, month);

    // Run all 5 independent queries in parallel
    const [
      todaysMeal,
      tomorrowsMeal,
      tomorrowsGuestReqs,
      monthlyMeals,
      guestRequests,
    ] = await Promise.all([
      // 1. Today's meal log
      prisma.mealLog.findFirst({
        where: {
          userId: user.id,
          date: { gte: today, lt: tomorrow },
        },
      }),
      // 2. Tomorrow's meal log
      prisma.mealLog.findFirst({
        where: {
          userId: user.id,
          date: { gte: tomorrow, lt: dayAfterTomorrow },
        },
      }),
      // 3. Tomorrow's guest requests
      prisma.guestMealRequest.findMany({
        where: {
          userId: user.id,
          date: { gte: tomorrow, lt: dayAfterTomorrow },
          status: { in: ["Approved", "Pending"] },
        },
      }),
      // 4. Monthly meal history
      prisma.mealLog.findMany({
        where: {
          userId: user.id,
          date: monthDateFilter,
        },
        orderBy: { date: "desc" },
      }),
      // 5. User guest requests
      prisma.guestMealRequest.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
      }),
    ]);

    const isManagerOrAdmin = user.role === "manager" || user.role === "admin";
    const currentHour = dhaka.hour;

    const defaultB = user.defaultBreakfast ?? 0.5;
    const defaultL = user.defaultLunch ?? 1.0;
    const defaultD = user.defaultDinner ?? 1.0;

    const todayStatus = {
      breakfast: todaysMeal ? (todaysMeal.breakfast > 0 ? "ON" : "OFF") : (defaultB > 0 ? "ON" : "OFF"),
      lunch: todaysMeal ? (todaysMeal.lunch > 0 ? "ON" : "OFF") : (defaultL > 0 ? "ON" : "OFF"),
      dinner: todaysMeal ? (todaysMeal.dinner > 0 ? "ON" : "OFF") : (defaultD > 0 ? "ON" : "OFF"),
    };

    const todayCounts = {
      breakfast: todaysMeal ? todaysMeal.breakfast : (todayStatus.breakfast === "ON" ? defaultB : 0),
      lunch: todaysMeal ? todaysMeal.lunch : (todayStatus.lunch === "ON" ? defaultL : 0),
      dinner: todaysMeal ? todaysMeal.dinner : (todayStatus.dinner === "ON" ? defaultD : 0),
      guest: todaysMeal ? (todaysMeal.guest ?? 0) : 0,
    };

    const todayTotal = todayCounts.breakfast + todayCounts.lunch + todayCounts.dinner + todayCounts.guest;

    const cutoffs = {
      breakfast: {
        passed: currentHour >= 8,
        time: "8:00 AM",
      },
      lunch: {
        passed: currentHour >= 12,
        time: "12:00 PM",
      },
      dinner: {
        passed: currentHour >= 21,
        time: "9:00 PM",
      },
      isManagerOrAdmin,
    };

    const tomorrowGuestCountFromReqs = tomorrowsGuestReqs.reduce((sum, r) => sum + (r.guests || 0), 0);
    const resolvedTomorrowGuests = Math.max(tomorrowsMeal?.guest || 0, tomorrowGuestCountFromReqs);

    const tomorrowPlan = {
      breakfast: tomorrowsMeal ? tomorrowsMeal.breakfast : defaultB,
      lunch: tomorrowsMeal ? tomorrowsMeal.lunch : defaultL,
      dinner: tomorrowsMeal ? tomorrowsMeal.dinner : defaultD,
      guest: resolvedTomorrowGuests,
    };

    return NextResponse.json(
      { success: true, todayStatus, todayCounts, todayTotal, cutoffs, tomorrowPlan, guestRequests, monthlyMeals },
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

    // Cutoff time validation for today's meal personal toggles
    const isManagerOrAdmin = user.role === "manager" || user.role === "admin";
    const currentHour = getDhakaHour();

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

    const todayCounts = {
      breakfast: updatedLog.breakfast,
      lunch: updatedLog.lunch,
      dinner: updatedLog.dinner,
      guest: updatedLog.guest ?? 0,
    };

    const todayTotal = todayCounts.breakfast + todayCounts.lunch + todayCounts.dinner + todayCounts.guest;

    const cutoffs = {
      breakfast: {
        passed: currentHour >= 8,
        time: "8:00 AM",
      },
      lunch: {
        passed: currentHour >= 12,
        time: "12:00 PM",
      },
      dinner: {
        passed: currentHour >= 21,
        time: "9:00 PM",
      },
      isManagerOrAdmin,
    };

    return NextResponse.json({ success: true, todayStatus, todayCounts, todayTotal, cutoffs, mealLog: updatedLog }, { status: 200 });
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
      const currentHour = getDhakaHour();
      const normMeal = cleanMealType.toUpperCase();
      if (normMeal.includes("BREAKFAST") && currentHour >= 8) {
        return NextResponse.json({ success: false, error: "Breakfast cutoff time (8:00 AM) has passed for today" }, { status: 400 });
      }
      if (normMeal.includes("LUNCH") && currentHour >= 12) {
        return NextResponse.json({ success: false, error: "Lunch cutoff time (12:00 PM) has passed for today" }, { status: 400 });
      }
      if (normMeal.includes("DINNER") && !normMeal.includes("BREAKFAST") && !normMeal.includes("LUNCH") && currentHour >= 21) {
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