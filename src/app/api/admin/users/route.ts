import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { 
  calculateMealRate, 
  calculateFixedCostPerMember, 
  calculateMemberSummary, 
  formatMonthKey,
  getMonthDateRange,
  getDhakaTodayStartAndEnd,
  calculateFunds,
  round1,
  round2
} from "@/lib/calculations";
import { hashPassword, sanitizeInput, safeErrorResponse } from "@/lib/security";
import { AdminUpdateUserSchema, AdminCreateUserSchema } from "@/lib/validations";

// To fetch list of all users and dashboard stats
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Dynamic month calculation with UTC date boundaries & key resolution
    const { 
      year: targetYear, 
      month: targetMonth, 
      dateFilter, 
      allMonthKeys, 
      monthName 
    } = getMonthDateRange(yearParam, monthParam);

    // Dhaka-aware Today's date filter
    const { todayStart, todayEnd } = getDhakaTodayStartAndEnd();
    const todayDateFilter = { gte: todayStart, lt: todayEnd };

    // Parallelize all 10 independent database queries for maximum performance
    const [
      expenseAggThisMonth,
      expenseAggAllTime,
      monthMeals,
      monthlyExpenseConfig,
      depositAggThisMonth,
      depositAggAllTime,
      mealDepositAggAllTime,
      todayMeals,
      todayExpenses,
      users,
    ] = await Promise.all([
      // 1. Approved food expenses this month
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: "Approved", date: dateFilter },
      }),
      // 2. Approved food expenses all-time
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: "Approved" },
      }),
      // 3. All mess meals for the active month
      prisma.mealLog.findMany({
        where: { date: dateFilter },
        select: { breakfast: true, lunch: true, dinner: true, guest: true },
      }),
      // 4. Monthly fixed overhead config
      prisma.monthlyExpense.findFirst({
        where: { month: { in: allMonthKeys } },
      }),
      // 5. Total approved deposits this month
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { status: "Approved", date: dateFilter },
      }),
      // 6. Total approved deposits all-time
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { status: "Approved" },
      }),
      // 7. Approved meal fund deposits all-time
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: {
          status: "Approved",
          OR: [
            { category: "Meal Fund" },
            { category: null },
            { category: "" },
          ],
        },
      }),
      // 8. Today's meals
      prisma.mealLog.findMany({
        where: { date: todayDateFilter },
        select: { breakfast: true, lunch: true, dinner: true, guest: true },
      }),
      // 9. Today's approved bazaar expenses
      prisma.expense.findMany({
        where: { date: todayDateFilter, status: "Approved" },
        select: { amount: true },
      }),
      // 10. All users with active month approved deposits and meal logs
      prisma.user.findMany({
        orderBy: { role: "asc" },
        include: {
          deposits: {
            where: { status: "Approved", date: dateFilter },
            select: { amount: true, category: true },
          },
          meals: {
            where: { date: dateFilter },
            select: { breakfast: true, lunch: true, dinner: true, guest: true },
          },
        },
      }),
    ]);

    // Financial aggregation
    const totalFoodCostThisMonth = expenseAggThisMonth._sum.amount || 0;
    const totalFoodCostAllTime = expenseAggAllTime._sum.amount || 0;
    const totalDepositsThisMonth = depositAggThisMonth._sum.amount || 0;
    const totalDepositsAllTime = depositAggAllTime._sum.amount || 0;
    const totalMealDepositsAllTime = mealDepositAggAllTime._sum.amount || 0;

    // Total mess meals for the month
    const totalMessMealsThisMonth = monthMeals.reduce(
      (acc, m) => acc + (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0) + (m.guest || 0),
      0
    );

    // Live meal rate
    const liveMealRate = calculateMealRate(totalFoodCostThisMonth, totalMessMealsThisMonth);

    // Fixed overhead per member
    const fixedCostPerMember = calculateFixedCostPerMember(monthlyExpenseConfig);

    // Segregated Funds calculation (eliminates null-category double-counting)
    const funds = calculateFunds({
      totalApprovedDeposits: totalDepositsAllTime,
      totalMealDeposits: totalMealDepositsAllTime,
      totalFoodExpenses: totalFoodCostAllTime,
    });

    // Today's stats
    const totalMealsToday = todayMeals.reduce(
      (acc, m) => acc + (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0) + (m.guest || 0),
      0
    );
    const totalBazaarToday = todayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    // Filter approved users count
    const approvedUsersCount = users.filter((u) => ["member", "manager", "admin"].includes(u.role)).length;

    // Calculate each user's financial summary
    const formattedUsers = users.map((u) => {
      const userDeposit = u.deposits.reduce((acc, d) => acc + d.amount, 0);
      const userMeals = u.meals.reduce(
        (acc, m) => acc + (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0) + (m.guest || 0),
        0
      );

      const summary = calculateMemberSummary({
        userId: u.id,
        name: u.name || "Unnamed",
        role: u.role,
        totalDeposit: userDeposit,
        totalMeals: userMeals,
        mealRate: liveMealRate,
        fixedCost: fixedCostPerMember,
      });

      return {
        id: u.id,
        name: u.name || "Unnamed",
        email: u.email,
        phone: u.phone || "N/A",
        image: u.image,
        role: u.role,
        deposit: summary.totalDeposit,
        totalMeals: summary.totalMeals,
        mealCost: summary.mealCost,
        fixedCost: summary.fixedCost,
        totalCost: summary.totalCost,
        balance: summary.balance,
        isPositive: summary.isPositive,
        balanceFormatted: summary.balanceFormatted,
        status: u.role === "pending" ? "Pending" : u.role === "suspended" ? "Suspended" : "Active",
      };
    });

    // Dues only apply to approved active members (never pending users)
    const dueMembers = formattedUsers.filter(
      (u) => u.status !== "Pending" && u.balance < 0
    );
    const totalDue = round2(
      dueMembers.reduce((acc, u) => acc + Math.abs(u.balance), 0)
    );
    const dueMembersCount = dueMembers.length;

    return NextResponse.json(
      {
        users: formattedUsers,
        stats: {
          totalMembers: approvedUsersCount,
          totalFoodCost: round2(totalFoodCostThisMonth),
          mealFund: funds.mealFund,
          messFund: funds.messFund,
          totalFund: funds.totalFund,
          totalMessMeals: round1(totalMessMealsThisMonth),
          liveMealRate,
          fixedCostPerMember,
          totalDepositsThisMonth: round2(totalDepositsThisMonth),
          totalBazaarToday: Math.round(totalBazaarToday),
          totalMealsToday: round1(totalMealsToday),
          totalDue,
          dueMembersCount,
          period: {
            month: targetMonth,
            year: targetYear,
            monthName,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to retrieve user data");
  }
}

// To update user's role or info (Admin only)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = AdminUpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid update payload" },
        { status: 400 }
      );
    }

    const { userId, newRole, name, phone } = parsed.data;

    const dataToUpdate: any = {};
    if (newRole) dataToUpdate.role = newRole;
    if (name) dataToUpdate.name = sanitizeInput(name);
    if (phone !== undefined) dataToUpdate.phone = phone ? sanitizeInput(phone) : null;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return NextResponse.json(
      { success: true, message: "User updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to update member");
  }
}

// For admin to add a new member (Admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = AdminCreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid member data" },
        { status: 400 }
      );
    }

    const { name, email, phone, role, password } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists!" },
        { status: 400 }
      );
    }

    // Hash password with cost factor 12
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: sanitizeInput(name),
        email,
        phone: phone ? sanitizeInput(phone) : "",
        password: hashedPassword,
        role: role || "member",
        defaultBreakfast: 0.5,
        defaultLunch: 1.0,
        defaultDinner: 1.0,
      },
    });

    return NextResponse.json(
      { success: true, message: "Member created successfully!", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to create new member");
  }
}

// To delete a user (Admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToDelete) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (userToDelete.email === "ourmess001@gmail.com" || userToDelete.id === adminUser.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete the primary admin account" },
        { status: 400 }
      );
    }

    // ACID transaction to delete user and cascaded relations
    await prisma.$transaction([
      prisma.mealLog.deleteMany({ where: { userId } }),
      prisma.deposit.deleteMany({ where: { userId } }),
      prisma.expense.deleteMany({ where: { userId } }),
      prisma.bazaarSchedule.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json(
      { success: true, message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Failed to delete user");
  }
}