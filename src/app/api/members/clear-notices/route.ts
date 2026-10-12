import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeErrorResponse } from "@/lib/security";

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

    const body = await req.json().catch(() => ({}));
    const noticeId = body?.noticeId;

    if (noticeId) {
      // Dismiss single notice (handles both normal notices and guest_<id>)
      const cleanId = String(noticeId).replace(/^guest_/, "");
      const currentCleared = user.clearedNotices || [];

      if (!currentCleared.includes(cleanId)) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            clearedNotices: {
              push: cleanId,
            },
          },
        });
      }
      return NextResponse.json({ success: true, message: "Notice dismissed successfully" });
    }

    // Dismiss all active notices and guest meal request notifications
    const notices = await prisma.notice.findMany({
      where: { 
        isActive: true,
        id: { notIn: user.clearedNotices || [] }
      },
      select: { id: true }
    });

    const userGuestRequests = await prisma.guestMealRequest.findMany({
      where: {
        userId: user.id,
        id: { notIn: user.clearedNotices || [] }
      },
      select: { id: true }
    });

    const newNoticeIds = [
      ...notices.map(n => n.id),
      ...userGuestRequests.map(g => g.id),
    ].filter(id => !(user.clearedNotices || []).includes(id));

    if (newNoticeIds.length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          clearedNotices: {
            push: newNoticeIds
          }
        }
      });
    }

    return NextResponse.json({ success: true, message: "All notices cleared successfully" });
  } catch (error) {
    return safeErrorResponse(error, "Failed to clear notices");
  }
}
