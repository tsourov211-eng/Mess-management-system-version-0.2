import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeInput, safeErrorResponse } from "@/lib/security";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "manager")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Manager or Admin privileges required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const body = await req.json();
    const { name, role, phone } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = sanitizeInput(name);
    // Only Admin can assign Admin role
    if (role && (currentUser.role === "admin" || role !== "admin")) {
      dataToUpdate.role = role;
    }
    if (phone !== undefined) dataToUpdate.phone = sanitizeInput(phone);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(
      { success: true, message: "Member info updated successfully!", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to update member info!");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only admins can remove members" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // ACID transaction to clean up member and related records
    await prisma.$transaction([
      prisma.mealLog.deleteMany({ where: { userId: id } }),
      prisma.deposit.deleteMany({ where: { userId: id } }),
      prisma.expense.deleteMany({ where: { userId: id } }),
      prisma.bazaarSchedule.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json(
      { success: true, message: "Member removed successfully!" },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to delete member!");
  }
}