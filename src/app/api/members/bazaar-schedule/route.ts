import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthDateRange } from "@/lib/calculations";

// 1. GET request to fetch user's and mess bazaar schedule
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // 1-12
    const year = searchParams.get("year");   // e.g. 2026

    const { dateFilter } = getMonthDateRange(year, month);

    // Fetch user schedules and mess-wide schedules in parallel
    const [mySchedules, allSchedules] = await Promise.all([
      // User's own bazaar schedule
      prisma.bazaarSchedule.findMany({
        where: {
          userId: user.id,
          date: dateFilter,
        },
        orderBy: { date: "asc" },
      }),
      // All mess members' bazaar schedule (to see others' dates on calendar)
      prisma.bazaarSchedule.findMany({
        where: {
          date: dateFilter,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    return NextResponse.json(
      { mySchedules, allSchedules },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bazaar Schedule GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bazaar schedules" },
      { status: 500 }
    );
  }
}

// 2. POST request for member to select and submit bazaar date
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { dates } = body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: "No dates provided" }, { status: 400 });
    }

    // Format dates, avoid duplicates, and reject already-approved dates
    const createdItems = [];
    const conflictDates: string[] = [];

    for (const dateStr of dates) {
      const [y, m, d] = dateStr.split("-").map(Number);
      const parsedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      
      const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

      // Check if this date already has an approved schedule from ANY user
      const approvedOnDate = await prisma.bazaarSchedule.findFirst({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          status: "approved",
        },
      });

      if (approvedOnDate) {
        conflictDates.push(dateStr);
        continue; // Skip — date already booked
      }

      // Check if user already has a schedule on this date
      const existing = await prisma.bazaarSchedule.findFirst({
        where: {
          userId: user.id,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (!existing) {
        createdItems.push({
          userId: user.id,
          date: parsedDate,
          status: "pending", // Will stay pending for manager's approval
        });
      }
    }

    // If ALL dates were conflicts, return an error
    if (createdItems.length === 0 && conflictDates.length > 0) {
      return NextResponse.json(
        { error: `The following dates are already booked: ${conflictDates.join(", ")}` },
        { status: 409 }
      );
    }

    if (createdItems.length > 0) {
      await prisma.bazaarSchedule.createMany({
        data: createdItems,
      });
    }

    return NextResponse.json(
      { 
        message: conflictDates.length > 0
          ? `${createdItems.length} date(s) submitted. Skipped already booked: ${conflictDates.join(", ")}`
          : "Bazaar dates submitted successfully for manager approval!",
        count: createdItems.length,
        conflicts: conflictDates,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving bazaar dates:", error);
    return NextResponse.json(
      { error: "Failed to submit bazaar dates" },
      { status: 500 }
    );
  }
}

// 3. PATCH request for manager to approve or reject bazaar schedule
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== "manager" && user.role !== "admin")) {
      return NextResponse.json({ error: "Only managers or admins can approve schedules" }, { status: 403 });
    }

    const body = await req.json();
    const { scheduleId, status } = body;

    if (!scheduleId || !["approved", "rejected", "done", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid scheduleId or status" }, { status: 400 });
    }

    const updated = await prisma.bazaarSchedule.update({
      where: { id: scheduleId },
      data: { status },
    });

    return NextResponse.json(
      { message: `Schedule updated to ${status}`, schedule: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bazaar Schedule PATCH Error:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}