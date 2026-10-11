import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput, safeErrorResponse } from "@/lib/security";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        deposits: { where: { status: "Approved" } },
        meals: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const totalDeposit = user.deposits.reduce((acc, curr) => acc + curr.amount, 0);
    const totalMeals = user.meals.reduce(
      (acc, meal) => acc + meal.breakfast + meal.lunch + meal.dinner + meal.guest,
      0
    );

    return NextResponse.json(
      {
        success: true,
        profile: {
          name: user.name,
          email: user.email,
          role: user.role,
          messName: user.messName || "Amader Mess",
          phone: user.phone || "",
          address: user.address || "",
          image: user.image,
          defaultBreakfast: user.defaultBreakfast,
          defaultLunch: user.defaultLunch,
          defaultDinner: user.defaultDinner,
        },
        stats: {
          totalDeposit,
          totalMeals,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to load profile");
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, address, messName, defaultBreakfast, defaultLunch, defaultDinner } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = sanitizeInput(name);
    if (messName) dataToUpdate.messName = sanitizeInput(messName);
    if (phone !== undefined) dataToUpdate.phone = sanitizeInput(phone);
    if (address !== undefined) dataToUpdate.address = sanitizeInput(address);
    if (body.image !== undefined) dataToUpdate.image = body.image;
    if (defaultBreakfast !== undefined) {
      dataToUpdate.defaultBreakfast = Math.max(0, Math.min(10, Number(defaultBreakfast) || 0));
    }
    if (defaultLunch !== undefined) {
      dataToUpdate.defaultLunch = Math.max(0, Math.min(10, Number(defaultLunch) || 0));
    }
    if (defaultDinner !== undefined) {
      dataToUpdate.defaultDinner = Math.max(0, Math.min(10, Number(defaultDinner) || 0));
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: dataToUpdate,
    });

    return NextResponse.json(
      { success: true, message: "Profile updated successfully", data: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to update profile");
  }
}