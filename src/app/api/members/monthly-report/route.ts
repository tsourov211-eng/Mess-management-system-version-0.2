import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMealRate, calculateFixedCostPerMember, formatMonthKey } from "@/lib/calculations";
import { safeErrorResponse } from "@/lib/security";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        messName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const targetMonth = searchParams.get("month") ? parseInt(searchParams.get("month")!) : now.getMonth() + 1;
    const targetYear = searchParams.get("year") ? parseInt(searchParams.get("year")!) : now.getFullYear();

    if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12 || isNaN(targetYear)) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }

    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const dateFilter = { gte: startOfMonth, lt: endOfMonth };

    // 1. Fetch User's Daily Meals for the month
    const userMealLogs = await prisma.mealLog.findMany({
      where: {
        userId: user.id,
        date: dateFilter,
      },
      orderBy: { date: "asc" },
    });

    // 2. Fetch User's Deposits for the month
    const userDeposits = await prisma.deposit.findMany({
      where: {
        userId: user.id,
        date: dateFilter,
      },
      orderBy: { date: "asc" },
    });

    // 3. Fetch User's Bazaar Expenses for the month
    const userExpenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        date: dateFilter,
      },
      orderBy: { date: "asc" },
    });

    // 4. Mess-wide totals for Live Meal Rate calculation
    const messExpensesAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        status: "Approved",
        date: dateFilter,
      },
    });
    const totalMessExpense = messExpensesAgg._sum.amount || 0;

    const allMessMealLogs = await prisma.mealLog.findMany({
      where: { date: dateFilter },
      select: { breakfast: true, lunch: true, dinner: true, guest: true },
    });
    const totalMessMeals = allMessMealLogs.reduce(
      (acc, m) => acc + (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0) + (m.guest || 0),
      0
    );

    const liveMealRate = calculateMealRate(totalMessExpense, totalMessMeals);

    // 5. Fixed Overhead per member
    const monthKey = formatMonthKey(startOfMonth);
    const isoMonthKey = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
    const monthlyExpenseConfig = await prisma.monthlyExpense.findFirst({
      where: {
        OR: [
          { month: monthKey },
          { month: isoMonthKey }
        ]
      },
    });
    const fixedCostPerMember = calculateFixedCostPerMember(monthlyExpenseConfig);

    // 6. Member Totals
    const approvedDeposits = userDeposits.filter((d) => d.status === "Approved");
    const totalDeposit = approvedDeposits.reduce((acc, d) => acc + d.amount, 0);

    const totalBreakfast = userMealLogs.reduce((acc, m) => acc + (m.breakfast || 0), 0);
    const totalLunch = userMealLogs.reduce((acc, m) => acc + (m.lunch || 0), 0);
    const totalDinner = userMealLogs.reduce((acc, m) => acc + (m.dinner || 0), 0);
    const totalGuest = userMealLogs.reduce((acc, m) => acc + (m.guest || 0), 0);
    const totalMeals = Math.round((totalBreakfast + totalLunch + totalDinner + totalGuest) * 10) / 10;

    const mealCost = Math.round(totalMeals * liveMealRate * 100) / 100;
    const totalFixedCost = fixedCostPerMember;
    const totalMonthCost = Math.round((mealCost + totalFixedCost) * 100) / 100;
    const currentBalance = Math.round((totalDeposit - totalMonthCost) * 100) / 100;

    const approvedExpenses = userExpenses.filter((e) => e.status === "Approved");
    const totalBazaar = approvedExpenses.reduce((acc, e) => acc + e.amount, 0);

    // 7. Day-by-Day Calendar Matrix
    const isSameDay = (dbDate: Date, dayNum: number) => {
      const d = new Date(dbDate);
      return (
        (d.getUTCDate() === dayNum && d.getUTCMonth() === targetMonth - 1 && d.getUTCFullYear() === targetYear) ||
        (d.getDate() === dayNum && d.getMonth() === targetMonth - 1 && d.getFullYear() === targetYear)
      );
    };

    const dailyBreakdown = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(targetYear, targetMonth - 1, d);
      const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
      const monthShort = dayDate.toLocaleDateString("en-US", { month: "short" });
      const formattedDate = `${String(d).padStart(2, "0")} ${monthShort} (${dayName})`;
      const isoDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      const meal = userMealLogs.find((m) => isSameDay(m.date, d));
      const b = meal ? meal.breakfast || 0 : 0;
      const l = meal ? meal.lunch || 0 : 0;
      const dn = meal ? meal.dinner || 0 : 0;
      const g = meal ? meal.guest || 0 : 0;
      const dayMeals = Math.round((b + l + dn + g) * 10) / 10;

      const dayDeposits = userDeposits.filter((dep) => isSameDay(dep.date, d));
      const dayApprovedDepositTotal = dayDeposits
        .filter((dep) => dep.status === "Approved")
        .reduce((acc, dep) => acc + dep.amount, 0);

      const dayExpenses = userExpenses.filter((exp) => isSameDay(exp.date, d));
      const dayApprovedExpenseTotal = dayExpenses
        .filter((exp) => exp.status === "Approved")
        .reduce((acc, exp) => acc + exp.amount, 0);

      dailyBreakdown.push({
        day: d,
        date: isoDate,
        formattedDate,
        dayName,
        breakfast: b,
        lunch: l,
        dinner: dn,
        guest: g,
        totalMeals: dayMeals,
        depositAmount: dayApprovedDepositTotal,
        deposits: dayDeposits.map((dep) => ({
          amount: dep.amount,
          status: dep.status,
          method: dep.method,
          note: dep.note,
        })),
        bazaarAmount: dayApprovedExpenseTotal,
        bazaars: dayExpenses.map((exp) => ({
          amount: exp.amount,
          status: exp.status,
          description: exp.description,
        })),
      });
    }

    const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleDateString("en-US", { month: "long" });

    return NextResponse.json({
      success: true,
      member: {
        id: user.id,
        name: user.name || "Member",
        email: user.email,
        phone: user.phone || "N/A",
        messName: user.messName || "Amader Mess",
      },
      month: targetMonth,
      year: targetYear,
      monthName,
      monthKey,
      daysInMonth,
      stats: {
        totalDeposit,
        totalMeals,
        liveMealRate,
        mealCost,
        fixedCost: totalFixedCost,
        totalCost: totalMonthCost,
        currentBalance,
        isPositive: currentBalance >= 0,
        totalBazaar,
        breakdownMeals: {
          breakfast: totalBreakfast,
          lunch: totalLunch,
          dinner: totalDinner,
          guest: totalGuest,
        },
      },
      dailyBreakdown,
      allDeposits: userDeposits,
      allExpenses: userExpenses,
    });
  } catch (error) {
    return safeErrorResponse(error, "Failed to generate monthly report data");
  }
}
