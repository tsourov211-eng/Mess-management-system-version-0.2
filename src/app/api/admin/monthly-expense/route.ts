import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MonthlyExpenseSchema } from "@/lib/validations";
import { safeErrorResponse } from "@/lib/security";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    if (!month) {
      return NextResponse.json({ success: false, error: "Month parameter is required" }, { status: 400 });
    }

    const monthlyExpense = await prisma.monthlyExpense.findUnique({
      where: { month },
    });

    return NextResponse.json({ success: true, data: monthlyExpense || null }, { status: 200 });
  } catch (error) {
    return safeErrorResponse(error, "Failed to retrieve monthly expense configuration");
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = MonthlyExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid monthly expense configuration" },
        { status: 400 }
      );
    }

    const { month, seatRent, electricityGas, internet, maid, additional, mealCharge } = parsed.data;

    const total = 
      seatRent + 
      electricityGas + 
      internet + 
      maid + 
      additional + 
      mealCharge;

    const expense = await prisma.monthlyExpense.upsert({
      where: { month },
      update: {
        seatRent,
        electricityGas,
        internet,
        maid,
        additional,
        mealCharge,
      },
      create: {
        month,
        seatRent,
        electricityGas,
        internet,
        maid,
        additional,
        mealCharge,
      },
    });

    let noticeId: string | undefined;
    if (total > 0) {
      const notice = await prisma.notice.create({
        data: {
          title: `Monthly Expense Finalized for ${month}`,
          description: `The monthly overhead expense for ${month} has been configured. Room, Utilities, WiFi, Cook, and Additional charges have been calculated.`,
          type: "info",
          isActive: true,
        },
      });
      noticeId = notice.id;
    }

    return NextResponse.json({ success: true, data: expense, total, noticeId }, { status: 200 });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to configure monthly expense");
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    if (!month) {
      return NextResponse.json({ success: false, error: "Month parameter is required" }, { status: 400 });
    }

    await prisma.monthlyExpense.deleteMany({
      where: { month },
    });

    return NextResponse.json({ success: true, message: `Monthly expense for ${month} has been reset.` }, { status: 200 });
  } catch (error) {
    return safeErrorResponse(error, "Failed to reset monthly expense configuration");
  }
}
