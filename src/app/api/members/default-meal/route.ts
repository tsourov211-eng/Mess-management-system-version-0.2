import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeErrorResponse } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { breakfast, lunch, dinner } = body;

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        defaultBreakfast: Math.max(0, Math.min(10, Number(breakfast) || 0)),
        defaultLunch: Math.max(0, Math.min(10, Number(lunch) || 0)),
        defaultDinner: Math.max(0, Math.min(10, Number(dinner) || 0)),
      },
    });

    return NextResponse.json(
      { success: true, message: "Default meals updated successfully!" },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to update default meals");
  }
}