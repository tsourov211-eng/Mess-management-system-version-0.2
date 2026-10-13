import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BazaarExpenseSchema } from "@/lib/validations";
import { getDhakaTodayStartAndEnd, ensureTodayBazaarNotice, updateBazaarNoticeStatus } from "@/lib/calculations";
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from "@/lib/rate-limit";
import { sanitizeInput, safeErrorResponse } from "@/lib/security";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure midnight / today notice is synchronized
    await ensureTodayBazaarNotice(prisma);

    // Dhaka-aware Today's date filter
    const { todayStart, todayEnd } = getDhakaTodayStartAndEnd();
    const todayDateFilter = { gte: todayStart, lt: todayEnd };

    // Parallelize all 5 database queries for maximum speed
    const [
      dbTodaySchedule,
      upcomingSchedules,
      todayExpenses,
      todayMealLogs,
      todayApprovedGuestMeals,
    ] = await Promise.all([
      // 1. Whose responsibility is it today
      prisma.bazaarSchedule.findFirst({
        where: { date: todayDateFilter },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      // 2. Upcoming bazaar schedule
      prisma.bazaarSchedule.findMany({
        where: { date: { gte: todayEnd } },
        orderBy: { date: "asc" },
        take: 5,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      // 3. Today's bazaar expense
      prisma.expense.findMany({
        where: { date: todayDateFilter },
        include: {
          user: { select: { name: true } },
        },
      }),
      // 4. Today's cooking meal logs
      prisma.mealLog.findMany({
        where: { date: todayDateFilter },
        include: { user: { select: { name: true } } },
      }),
      // 5. Approved guest meals for today
      prisma.guestMealRequest.findMany({
        where: {
          date: todayDateFilter,
          status: "Approved",
        },
        include: { user: { select: { name: true } } },
      }),
    ]);

    let todaySchedule = dbTodaySchedule;

    // If there is no schedule today, fallback to the first active user or manager's name
    if (!todaySchedule) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["manager", "admin", "member"] } },
        select: { id: true, name: true, email: true, phone: true },
      });

      if (defaultUser) {
        todaySchedule = {
          id: "today-default",
          userId: defaultUser.id,
          date: todayStart,
          status: "pending",
          user: defaultUser,
        };
      }
    }

    const todayTotal = todayExpenses
      .filter((e) => e.status !== "Rejected")
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    const breakfastMembers = todayMealLogs.filter((m) => (m.breakfast || 0) > 0).length;
    const lunchMembers = todayMealLogs.filter((m) => (m.lunch || 0) > 0).length;
    const dinnerMembers = todayMealLogs.filter((m) => (m.dinner || 0) > 0).length;

    let breakfastGuests = 0;
    let lunchGuests = 0;
    let dinnerGuests = 0;

    todayApprovedGuestMeals.forEach((g) => {
      const t = (g.mealType || "").toUpperCase();
      if (t.includes("BREAKFAST") || t.includes("ALL") || t.includes("BOTH")) {
        breakfastGuests += g.guests;
      }
      if (t.includes("LUNCH") || t.includes("ALL") || t.includes("BOTH")) {
        lunchGuests += g.guests;
      }
      if (t.includes("DINNER") || t.includes("ALL") || t.includes("BOTH")) {
        dinnerGuests += g.guests;
      }
    });

    const breakfastTotalHeads = breakfastMembers + breakfastGuests;
    const lunchTotalHeads = lunchMembers + lunchGuests;
    const dinnerTotalHeads = dinnerMembers + dinnerGuests;

    // In Amader Mess, breakfast is strictly 0.5 meals, while lunch and dinner are 1.0 meal each
    const breakfastMemberPortions = todayMealLogs.reduce((acc, m) => acc + (m.breakfast || 0), 0);
    const lunchMemberPortions = todayMealLogs.reduce((acc, m) => acc + (m.lunch || 0), 0);
    const dinnerMemberPortions = todayMealLogs.reduce((acc, m) => acc + (m.dinner || 0), 0);

    const breakfastMeals = Math.round((
      (todayMealLogs.length > 0 ? breakfastMemberPortions : (breakfastMembers * 0.5)) + (breakfastGuests * 0.5)
    ) * 10) / 10;
    const lunchMeals = Math.round((
      (todayMealLogs.length > 0 ? lunchMemberPortions : lunchMembers) + lunchGuests
    ) * 10) / 10;
    const dinnerMeals = Math.round((
      (todayMealLogs.length > 0 ? dinnerMemberPortions : dinnerMembers) + dinnerGuests
    ) * 10) / 10;

    const totalMealsToday = Math.round((breakfastMeals + lunchMeals + dinnerMeals) * 10) / 10;

    const totalMemberPortions = todayMealLogs.reduce(
      (acc, m) => acc + (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0),
      0
    );
    const totalApprovedGuestCount = todayApprovedGuestMeals.reduce(
      (acc, g) => acc + (g.guests || 0),
      0
    );
    const totalCookingHeads = Math.round((totalMemberPortions + totalApprovedGuestCount) * 10) / 10;

    return NextResponse.json(
      {
        todayAssigned: todaySchedule?.user || null,
        todayScheduleStatus: todaySchedule?.status || null,
        todayScheduleId: todaySchedule?.id || null,
        schedules: upcomingSchedules,
        todayExpenses,
        todayTotal,
        cookingHeadcount: {
          breakfast: { 
            members: breakfastMembers, 
            guests: breakfastGuests, 
            total: breakfastTotalHeads,
            meals: breakfastMeals,
          },
          lunch: { 
            members: lunchMembers, 
            guests: lunchGuests, 
            total: lunchTotalHeads,
            meals: lunchMeals,
          },
          dinner: { 
            members: dinnerMembers, 
            guests: dinnerGuests, 
            total: dinnerTotalHeads,
            meals: dinnerMeals,
          },
          totalMealsToday,
          totalCookingHeads,
          approvedGuestRequests: todayApprovedGuestMeals.map((g) => ({
            id: g.id,
            memberName: g.user.name || "Member",
            guests: g.guests,
            mealType: g.mealType,
            note: g.note || null,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bazaar GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bazaar data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1. Rate Limiting: 30 mutation requests per minute
    const clientId = getClientIdentifier(req, "bazaar-post");
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
    const parsed = BazaarExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid bazaar expense data" },
        { status: 400 }
      );
    }

    const { amount, description, date, userId } = parsed.data;

    // RBAC: If admin or manager submits, directly "Approved", if normal member then "Pending"
    const status = user.role === "admin" || user.role === "manager" ? "Approved" : "Pending";
    const expenseDate = date ? new Date(date) : new Date();

    // Anti-IDOR: Regular members cannot log expenses for others
    let targetUserId = user.id;
    if ((user.role === "admin" || user.role === "manager") && userId) {
      targetUserId = userId;
    }

    const newExpense = await prisma.expense.create({
      data: {
        userId: targetUserId,
        amount,
        description: sanitizeInput(description) || "Daily Bazaar",
        status,
        date: expenseDate,
      },
    });

    // If there is an approved bazaar schedule on this date for this user, mark it as done
    try {
      const { todayStart, todayEnd } = getDhakaTodayStartAndEnd(expenseDate);
      const existingSched = await prisma.bazaarSchedule.findFirst({
        where: {
          userId: targetUserId,
          date: { gte: todayStart, lt: todayEnd },
          status: "approved",
        },
        include: { user: { select: { id: true, name: true } } },
      });

      if (existingSched) {
        await prisma.bazaarSchedule.update({
          where: { id: existingSched.id },
          data: { status: "done" },
        });
        await updateBazaarNoticeStatus(prisma, existingSched, "done");
      }
    } catch (schedErr) {
      console.error("Error auto-completing bazaar schedule on expense submit:", schedErr);
    }

    return NextResponse.json(
      { success: true, message: "Bazaar expense submitted successfully!", expense: newExpense },
      { status: 201 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to submit bazaar expense");
  }
}
