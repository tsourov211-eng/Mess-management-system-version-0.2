import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { 
  calculateMealRate, 
  calculateFixedCostPerMember, 
  calculateMemberSummary, 
  formatMonthKey 
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

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (monthParam && yearParam) {
      const year = parseInt(yearParam);
      const month = parseInt(monthParam); // 1 to 12
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 1);
    } else {
      // Default to current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const dateFilter = {
      gte: startDate,
      lt: endDate,
    };

    // 1. Fetch total mess food expenses (Approved expenses) for the active month
    const expenseAggThisMonth = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { 
        status: "Approved",
        date: dateFilter,
      },
    });
    const totalFoodCostThisMonth = expenseAggThisMonth._sum.amount || 0;

    // All-time approved food expenses
    const expenseAggAllTime = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { status: "Approved" },
    });
    const totalFoodCostAllTime = expenseAggAllTime._sum.amount || 0;

    // 2. Total mess meals for the active month
    const monthMeals = await prisma.mealLog.findMany({
      where: { date: dateFilter },
    });
    const totalMessMealsThisMonth = monthMeals.reduce(
      (acc, m) => acc + m.breakfast + m.lunch + m.dinner + m.guest,
      0
    );

    // 3. Exact live meal rate for the active month with 0.00 fallback
    const liveMealRate = calculateMealRate(totalFoodCostThisMonth, totalMessMealsThisMonth);

    // 4. Monthly fixed overhead config for the active month
    const monthKey = formatMonthKey(startDate);
    const isoMonthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
    const monthlyExpenseConfig = await prisma.monthlyExpense.findFirst({
      where: {
        OR: [
          { month: monthKey },
          { month: isoMonthKey }
        ]
      },
    });
    const fixedCostPerMember = calculateFixedCostPerMember(monthlyExpenseConfig);

    // 5. Total deposited money (all-time & this month)
    const depositAggThisMonth = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: { status: "Approved", date: dateFilter },
    });
    const totalDepositsThisMonth = depositAggThisMonth._sum.amount || 0;

    const depositAggAllTime = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: { status: "Approved" },
    });
    // 6. Separate Funds:
    // Meal Fund: Approved deposits for "Meal Fund" - Approved food expenses (all-time)
    const mealDepositAggAllTime = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: {
        status: "Approved",
        OR: [
          { category: "Meal Fund" },
          { category: null },
          { category: "" },
        ],
      },
    });
    const totalMealDepositsAllTime = mealDepositAggAllTime._sum.amount || 0;
    const mealFund = Math.round((totalMealDepositsAllTime - totalFoodCostAllTime) * 100) / 100;

    // Mess Fund: Approved deposits for Overhead Expenses (Seat Rent, Utilities, WiFi, Maid, Additional)
    const overheadDepositAggAllTime = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: {
        status: "Approved",
        NOT: [
          { category: "Meal Fund" },
        ],
      },
    });
    const messFund = Math.round((overheadDepositAggAllTime._sum.amount || 0) * 100) / 100;
    const totalFund = Math.round((mealFund + messFund) * 100) / 100;

    // 7. Today's stats calculation
    const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const localTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const utcTomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

    const todayStart = new Date(Math.min(localToday.getTime(), utcToday.getTime()));
    const todayEnd = new Date(Math.max(localTomorrow.getTime(), utcTomorrow.getTime()));
    const todayDateFilter = { gte: todayStart, lt: todayEnd };

    const todayMeals = await prisma.mealLog.findMany({
      where: { date: todayDateFilter },
    });
    const totalMealsToday = todayMeals.reduce(
      (acc, m) => acc + m.breakfast + m.lunch + m.dinner + m.guest,
      0
    );

    const todayExpenses = await prisma.expense.findMany({
      where: { date: todayDateFilter, status: "Approved" },
    });
    const totalBazaarToday = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

    // 8. Fetch all users along with their active month approved deposits and meal logs
    const users = await prisma.user.findMany({
      orderBy: { role: "asc" },
      include: {
        deposits: { 
          where: { 
            status: "Approved",
            date: dateFilter,
          } 
        },
        meals: {
          where: {
            date: dateFilter,
          }
        },
      },
    });
    
    // Calculate approved users count
    const approvedUsersCount = users.filter(u => ["member", "manager", "admin"].includes(u.role)).length;

    // 9. Calculate each user's financial summary using calculation engine
    const formattedUsers = users.map((u) => {
      const userDeposit = u.deposits.reduce((acc, d) => acc + d.amount, 0);
      const userMeals = u.meals.reduce(
        (acc, m) => acc + m.breakfast + m.lunch + m.dinner + m.guest,
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

    const totalDue = formattedUsers
      .filter((u) => u.balance < 0)
      .reduce((acc, u) => acc + Math.abs(u.balance), 0);
    const dueMembersCount = formattedUsers.filter((u) => u.balance < 0).length;

    return NextResponse.json(
      {
        users: formattedUsers,
        stats: {
          totalMembers: approvedUsersCount,
          totalFoodCost: Math.round(totalFoodCostThisMonth * 100) / 100,
          mealFund,
          messFund: Math.round(messFund * 100) / 100,
          totalFund,
          totalMessMeals: Math.round(totalMessMealsThisMonth * 10) / 10,
          liveMealRate: liveMealRate,
          fixedCostPerMember,
          totalDepositsThisMonth: Math.round(totalDepositsThisMonth * 100) / 100,
          totalBazaarToday: Math.round(totalBazaarToday),
          totalMealsToday: Math.round(totalMealsToday * 10) / 10,
          totalDue: Math.round(totalDue * 100) / 100,
          dueMembersCount,
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