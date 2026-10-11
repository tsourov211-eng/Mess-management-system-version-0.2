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

    // Get all active notices that are not already cleared
    const notices = await prisma.notice.findMany({
      where: { 
        isActive: true,
        id: { notIn: user.clearedNotices || [] }
      },
      select: { id: true }
    });

    const newNoticeIds = notices.map(n => n.id);

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

    return NextResponse.json({ success: true });
  } catch (error) {
    return safeErrorResponse(error, "Failed to clear notices");
  }
}
