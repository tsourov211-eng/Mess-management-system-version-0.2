import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  calculateMealRate, 
  calculateFixedCostPerMember, 
  formatMonthKey, 
  getMonthDateRange,
  ensureTodayMealLogs,
  calculateConsumedMeals,
  getDhakaTodayStartAndEnd,
  round1,
  round2,
  syncUserGuestMeals
} from "@/lib/calculations";
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
        defaultBreakfast: true,
        defaultLunch: true,
        defaultDinner: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure today's meal logs exist for all active mess members
    await ensureTodayMealLogs(prisma);

    const { searchParams } = new URL(req.url);
    const { 
      year: targetYear, 
      month: targetMonth, 
      dateFilter, 
      allMonthKeys, 
      monthName,
      monthKey,
      daysInMonth 
    } = getMonthDateRange(searchParams.get("year"), searchParams.get("month"));

    // Ensure approved guest meals are synchronized for active month
    await syncUserGuestMeals(prisma, user.id, dateFilter);

    // Parallelize all 6 queries for maximum responsiveness
    const [
      userMealLogs,
      userDeposits,
      userExpenses,
      messExpensesAgg,
      allMessMealLogs,
      monthlyExpenseConfig,
    ] = await Promise.all([
      // 1. Fetch User's Daily Meals for the month
      prisma.mealLog.findMany({
        where: {
          userId: user.id,
          date: dateFilter,
        },
        orderBy: { date: "asc" },
      }),
      // 2. Fetch User's Deposits for the month
      prisma.deposit.findMany({
        where: {
          userId: user.id,
          date: dateFilter,
        },
        orderBy: { date: "asc" },
      }),
      // 3. Fetch User's Bazaar Expenses for the month
      prisma.expense.findMany({
        where: {
          userId: user.id,
          date: dateFilter,
        },
        orderBy: { date: "asc" },
      }),
      // 4. Mess-wide totals for Live Meal Rate calculation
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          status: "Approved",
          date: dateFilter,
        },
      }),
      // 5. Mess meal logs for the month
      prisma.mealLog.findMany({
        where: { date: dateFilter },
        select: { date: true, breakfast: true, lunch: true, dinner: true, guest: true },
      }),
      // 6. Fixed Overhead per member
      prisma.monthlyExpense.findFirst({
        where: { month: { in: allMonthKeys } },
      }),
    ]);

    const { todayStart, todayEnd, dhaka: dhakaNow } = getDhakaTodayStartAndEnd();
    const dhakaUtcToday = new Date(Date.UTC(dhakaNow.year, dhakaNow.month - 1, dhakaNow.day, 0, 0, 0, 0));

    // Guarantee today's meal is represented in userMealLogs if active month is current month
    if (targetMonth === dhakaNow.month && targetYear === dhakaNow.year) {
      const hasTodayInUserLogs = userMealLogs.some((m) => {
        const d = new Date(m.date);
        return d.getTime() >= todayStart.getTime() && d.getTime() < todayEnd.getTime();
      });
      if (!hasTodayInUserLogs) {
        userMealLogs.push({
          id: "today-virtual",
          userId: user.id,
          date: dhakaUtcToday,
          breakfast: user.defaultBreakfast ?? 0.5,
          lunch: user.defaultLunch ?? 1.0,
          dinner: user.defaultDinner ?? 1.0,
          guest: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

    const totalMessExpense = messExpensesAgg._sum.amount || 0;
    const totalMessMeals = round1(
      allMessMealLogs.reduce(
        (acc, m) => acc + calculateConsumedMeals(m, dhakaNow, { todayStart, todayEnd }),
        0
      )
    );

    const liveMealRate = calculateMealRate(totalMessExpense, totalMessMeals);
    const fixedCostPerMember = calculateFixedCostPerMember(monthlyExpenseConfig);

    // 6. Member Totals
    const approvedDeposits = userDeposits.filter((d) => d.status === "Approved");
    const totalDeposit = approvedDeposits.reduce((acc, d) => acc + d.amount, 0);

    const currentHour = dhakaNow.hour;
    const breakfastPassed = currentHour >= 8;
    const lunchPassed = currentHour >= 12;
    const dinnerPassed = currentHour >= 21;

    const isTodayRecord = (dbDate: Date) => {
      const d = new Date(dbDate);
      return d.getTime() >= todayStart.getTime() && d.getTime() < todayEnd.getTime();
    };

    let totalBreakfast = 0;
    let totalLunch = 0;
    let totalDinner = 0;
    let totalGuest = 0;

    for (const m of userMealLogs) {
      if (isTodayRecord(m.date)) {
        if (breakfastPassed) totalBreakfast += (m.breakfast || 0);
        if (lunchPassed) totalLunch += (m.lunch || 0);
        if (dinnerPassed) totalDinner += (m.dinner || 0);
        if (m.guest && m.guest > 0) {
          if (dinnerPassed || lunchPassed) totalGuest += m.guest;
          else if (breakfastPassed) totalGuest += Math.min(m.guest, 0.5);
        }
      } else {
        const mTime = new Date(m.date).getTime();
        if (mTime < todayStart.getTime()) {
          totalBreakfast += (m.breakfast || 0);
          totalLunch += (m.lunch || 0);
          totalDinner += (m.dinner || 0);
          totalGuest += (m.guest || 0);
        }
      }
    }

    totalBreakfast = round1(totalBreakfast);
    totalLunch = round1(totalLunch);
    totalDinner = round1(totalDinner);
    totalGuest = round1(totalGuest);
    const totalMeals = round1(totalBreakfast + totalLunch + totalDinner + totalGuest);

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
      const isCurrentDay = d === dhakaNow.day && targetMonth === dhakaNow.month && targetYear === dhakaNow.year;

      let b = 0;
      let l = 0;
      let dn = 0;
      let g = 0;

      if (isCurrentDay) {
        b = breakfastPassed ? (meal ? meal.breakfast || 0 : (user.defaultBreakfast ?? 0.5)) : 0;
        l = lunchPassed ? (meal ? meal.lunch || 0 : (user.defaultLunch ?? 1.0)) : 0;
        dn = dinnerPassed ? (meal ? meal.dinner || 0 : (user.defaultDinner ?? 1.0)) : 0;
        g = (lunchPassed || dinnerPassed) ? (meal ? meal.guest || 0 : 0) : 0;
      } else if (dayDate.getTime() < todayStart.getTime()) {
        b = meal ? meal.breakfast || 0 : 0;
        l = meal ? meal.lunch || 0 : 0;
        dn = meal ? meal.dinner || 0 : 0;
        g = meal ? meal.guest || 0 : 0;
      }

      const dayMeals = round1(b + l + dn + g);

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
          category: dep.category || "Meal Fund",
        })),
        bazaarAmount: dayApprovedExpenseTotal,
        bazaars: dayExpenses.map((exp) => ({
          amount: exp.amount,
          status: exp.status,
          description: exp.description,
        })),
      });
    }

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
