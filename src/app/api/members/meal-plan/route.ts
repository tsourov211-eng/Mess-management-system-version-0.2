import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from "@/lib/rate-limit";
import { safeErrorResponse } from "@/lib/security";
import { round1 } from "@/lib/calculations";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting: 30 meal plan updates per minute
    const clientId = getClientIdentifier(req, "meal-plan");
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
    const { date, breakfast, lunch, dinner, guest } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
    }

    const mealDate = new Date(date);
    mealDate.setUTCHours(0, 0, 0, 0);

    const validBreakfast = Math.max(0, Math.min(10, Number(breakfast) || 0));
    const validLunch = Math.max(0, Math.min(10, Number(lunch) || 0));
    const validDinner = Math.max(0, Math.min(10, Number(dinner) || 0));
    const validGuest = Math.max(0, Math.min(50, round1(Number(guest) || 0)));

    const savedMeal = await prisma.mealLog.upsert({
      where: {
        userId_date: {
          userId: user.id, // Strictly scoped to session user (Anti-IDOR)
          date: mealDate,
        },
      },
      update: {
        breakfast: validBreakfast,
        lunch: validLunch,
        dinner: validDinner,
        guest: validGuest,
      },
      create: {
        userId: user.id,
        date: mealDate,
        breakfast: validBreakfast,
        lunch: validLunch,
        dinner: validDinner,
        guest: validGuest,
      },
    });

    return NextResponse.json(
      { success: true, message: "Meal plan saved successfully!", meal: savedMeal },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to save meal plan");
  }
}