import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ManagerActionSchema } from "@/lib/validations";
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from "@/lib/rate-limit";
import { safeErrorResponse } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 30 actions per minute
    const clientId = getClientIdentifier(req, "manager-action");
    const rateCheck = checkRateLimit(clientId, 30, 60 * 1000);
    if (!rateCheck.success) {
      return rateLimitExceededResponse(rateCheck.resetAt);
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { name: true, role: true },
    });
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return NextResponse.json({ success: false, error: "Forbidden: Manager or Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ManagerActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid action payload" },
        { status: 400 }
      );
    }

    const { id, type, action } = parsed.data;
    const newStatus = action === "Approve" ? "Approved" : "Rejected";

    if (type === "deposit") {
      await prisma.deposit.update({
        where: { id },
        data: { status: newStatus },
      });
    } else if (type === "expense") {
      await prisma.expense.update({
        where: { id },
        data: { status: newStatus },
      });
    } else if (type === "guestMeal") {
      const guestReq = await prisma.guestMealRequest.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!guestReq) {
        return NextResponse.json(
          { success: false, error: "Guest meal request not found" },
          { status: 404 }
        );
      }

      const managerName = user.name || session.user.name || "Manager";

      await prisma.$transaction(async (tx) => {
        // 1. Update guest meal request status
        await tx.guestMealRequest.update({
          where: { id },
          data: {
            status: newStatus,
            reviewedBy: managerName,
            reviewedAt: new Date(),
          },
        });

        // 2. Synchronize MealLog for the requesting member on that date
        const reqDate = new Date(guestReq.date);
        reqDate.setUTCHours(0, 0, 0, 0);
        const nextDate = new Date(reqDate);
        nextDate.setDate(nextDate.getDate() + 1);

        // Sum all approved guest meals for this user on this date
        const allApproved = await tx.guestMealRequest.findMany({
          where: {
            userId: guestReq.userId,
            date: { gte: reqDate, lt: nextDate },
            status: "Approved",
          },
        });

        const totalApprovedGuests = allApproved.reduce((acc, r) => acc + (r.guests || 0), 0);

        const existingMeal = await tx.mealLog.findFirst({
          where: {
            userId: guestReq.userId,
            date: { gte: reqDate, lt: nextDate },
          },
        });

        if (existingMeal) {
          await tx.mealLog.update({
            where: { id: existingMeal.id },
            data: { guest: totalApprovedGuests },
          });
        } else if (totalApprovedGuests > 0) {
          await tx.mealLog.create({
            data: {
              userId: guestReq.userId,
              date: reqDate,
              breakfast: guestReq.user.defaultBreakfast ?? 0.5,
              lunch: guestReq.user.defaultLunch ?? 1.0,
              dinner: guestReq.user.defaultDinner ?? 1.0,
              guest: totalApprovedGuests,
            },
          });
        }

        // 3. Create a notification notice for the member
        const dateFormatted = reqDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const noticeTitle = action === "Approve" ? "Guest Meal Approved" : "Guest Meal Rejected";
        const noticeDesc = action === "Approve"
          ? `Your request for ${guestReq.guests} guest meal(s) on ${dateFormatted} (${guestReq.mealType}) has been approved.`
          : `Your request for ${guestReq.guests} guest meal(s) on ${dateFormatted} (${guestReq.mealType}) has been rejected.`;

        await tx.notice.create({
          data: {
            title: noticeTitle,
            description: noticeDesc,
            type: action === "Approve" ? "info" : "warning",
            isActive: true,
          },
        });
      });
    }

    return NextResponse.json(
      { success: true, message: `Successfully ${newStatus.toLowerCase()} transaction` },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to perform approval action");
  }
}