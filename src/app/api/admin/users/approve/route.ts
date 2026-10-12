import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeErrorResponse } from "@/lib/security";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin-only privileges (only admin can approve/reject member requests)
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    if (action === "approve") {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: "member" },
      });
      return NextResponse.json({ success: true, message: "Member approved successfully", user: updatedUser }, { status: 200 });
    } else {
      const userToReject = await prisma.user.findUnique({ where: { id: userId } });
      if (userToReject?.email === "ourmess001@gmail.com" || userToReject?.role === "admin") {
        return NextResponse.json({ success: false, error: "Cannot delete the admin account" }, { status: 400 });
      }
      await prisma.user.delete({
        where: { id: userId },
      });
      return NextResponse.json({ success: true, message: "Member rejected successfully" }, { status: 200 });
    }
  } catch (error) {
    return safeErrorResponse(error, "Failed to process member approval");
  }
}
