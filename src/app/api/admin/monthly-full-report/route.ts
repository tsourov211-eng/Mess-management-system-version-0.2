import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  calculateMealRate, 
  calculateFixedCostPerMember, 
  calculateMemberSummary, 
  formatMonthKey, 
  getMonthDateRange,
  ensureTodayMealLogs,
  calculateConsumedMeals,
  getDhakaTodayStartAndEnd,
  round1,
  round2
} from "@/lib/calculations";
import { safeErrorResponse } from "@/lib/security";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure today's meal logs are populated for all active mess members
    await ensureTodayMealLogs(prisma);

    const currentUser = await prisma.user.findUnique({
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

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role verification: only admin and manager can download all members' reports
    if (currentUser.role !== "admin" && currentUser.role !== "manager") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Manager can access full monthly mess reports" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const { 
      year: targetYear, 
      month: targetMonth, 
      dateFilter, 
      allMonthKeys, 
      monthName,
      daysInMonth 
    } = getMonthDateRange(searchParams.get("year"), searchParams.get("month"));

    // Parallelize all 5 database queries for maximum performance
    const [
      members,
      allMealLogs,
      allExpenses,
      allDeposits,
      monthlyExpenseConfig,
    ] = await Promise.all([
      // 1. Fetch All Active Members
      prisma.user.findMany({
        where: {
          role: { not: "pending" },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          messName: true,
        },
        orderBy: { name: "asc" },
      }),
      // 2. Fetch All MealLogs for the Month
      prisma.mealLog.findMany({
        where: { date: dateFilter },
        orderBy: { date: "asc" },
      }),
      // 3. Fetch All Expenses (Bazaar) for the Month
      prisma.expense.findMany({
        where: { date: dateFilter },
        include: {
          user: { select: { name: true, phone: true } },
        },
        orderBy: { date: "asc" },
      }),
      // 4. Fetch All Deposits for the Month
      prisma.deposit.findMany({
        where: { date: dateFilter },
        include: {
          user: { select: { name: true, phone: true } },
        },
        orderBy: { date: "asc" },
      }),
      // 5. Fixed Overhead Config
      prisma.monthlyExpense.findFirst({
        where: { month: { in: allMonthKeys } },
      }),
    ]);

    const fixedCostPerMember = calculateFixedCostPerMember(monthlyExpenseConfig);

    // 6. Global Mess Calculations
    const { todayStart, todayEnd, dhaka: dhakaNow } = getDhakaTodayStartAndEnd();

    const approvedExpenses = allExpenses.filter((e) => e.status === "Approved");
    const totalMessBazaarCost = approvedExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    const totalMessMeals = round1(
      allMealLogs.reduce(
        (acc, m) => acc + calculateConsumedMeals(m, dhakaNow, { todayStart, todayEnd }),
        0
      )
    );

    const liveMealRate = calculateMealRate(totalMessBazaarCost, totalMessMeals);

    const approvedDeposits = allDeposits.filter((d) => d.status === "Approved");
    const totalMessDeposits = approvedDeposits.reduce((acc, d) => acc + (d.amount || 0), 0);

    const currentCashBalance = Math.round((totalMessDeposits - totalMessBazaarCost) * 100) / 100;

    // Helper to match dates
    const isSameDay = (dbDate: Date, dayNum: number) => {
      const d = new Date(dbDate);
      const matchUtc =
        d.getUTCDate() === dayNum &&
        d.getUTCMonth() === targetMonth - 1 &&
        d.getUTCFullYear() === targetYear;
      const matchLocal =
        d.getDate() === dayNum &&
        d.getMonth() === targetMonth - 1 &&
        d.getFullYear() === targetYear;
      return matchUtc || matchLocal;
    };

    // 7. Build Full Report for each member
    const memberReports = members.map((member) => {
      const memberMealLogs = allMealLogs.filter((m) => m.userId === member.id);
      const memberDeposits = allDeposits.filter((d) => d.userId === member.id);
      const memberExpenses = allExpenses.filter((e) => e.userId === member.id);

      const memApprovedDeposits = memberDeposits.filter((d) => d.status === "Approved");
      const memTotalDeposit = memApprovedDeposits.reduce((acc, d) => acc + d.amount, 0);

      const memApprovedExpenses = memberExpenses.filter((e) => e.status === "Approved");
      const memTotalBazaar = memApprovedExpenses.reduce((acc, e) => acc + e.amount, 0);

      let memBreakfast = 0;
      let memLunch = 0;
      let memDinner = 0;
      let memGuest = 0;

      for (const m of memberMealLogs) {
        const mDate = new Date(m.date);
        const isPast = mDate.getTime() < todayStart.getTime();
        const isToday = mDate.getTime() >= todayStart.getTime() && mDate.getTime() < todayEnd.getTime();

        if (isPast) {
          memBreakfast += (m.breakfast || 0);
          memLunch += (m.lunch || 0);
          memDinner += (m.dinner || 0);
          memGuest += (m.guest || 0);
        } else if (isToday) {
          if (dhakaNow.hour >= 8) memBreakfast += (m.breakfast || 0);
          if (dhakaNow.hour >= 12) memLunch += (m.lunch || 0);
          if (dhakaNow.hour >= 21) memDinner += (m.dinner || 0);
          if (m.guest && m.guest > 0) {
            if (dhakaNow.hour >= 21 || dhakaNow.hour >= 12) memGuest += m.guest;
            else if (dhakaNow.hour >= 8) memGuest += Math.min(m.guest, 0.5);
          }
        }
      }

      memBreakfast = round1(memBreakfast);
      memLunch = round1(memLunch);
      memDinner = round1(memDinner);
      memGuest = round1(memGuest);
      const memTotalMeals = round1(memBreakfast + memLunch + memDinner + memGuest);

      const memSummary = calculateMemberSummary({
        userId: member.id,
        name: member.name || "Unnamed",
        role: member.role,
        totalDeposit: memTotalDeposit,
        totalMeals: memTotalMeals,
        mealRate: liveMealRate,
        fixedCost: fixedCostPerMember,
        actualSharedCost: 0,
      });

      // 31-day breakdown
      const dailyBreakdown = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(targetYear, targetMonth - 1, d);
        const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
        const monthShort = dayDate.toLocaleDateString("en-US", { month: "short" });
        const formattedDate = `${String(d).padStart(2, "0")} ${monthShort} (${dayName})`;
        const isoDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        const isToday = targetYear === dhakaNow.year && targetMonth === dhakaNow.month && d === dhakaNow.day;
        const isFuture = targetYear > dhakaNow.year || (targetYear === dhakaNow.year && targetMonth > dhakaNow.month) || (targetYear === dhakaNow.year && targetMonth === dhakaNow.month && d > dhakaNow.day);

        const meal = memberMealLogs.find((m) => isSameDay(m.date, d));
        let b = 0;
        let l = 0;
        let dn = 0;
        let g = 0;

        if (meal) {
          if (isToday) {
            if (dhakaNow.hour >= 8) b = meal.breakfast || 0;
            if (dhakaNow.hour >= 12) l = meal.lunch || 0;
            if (dhakaNow.hour >= 21) dn = meal.dinner || 0;
            if (meal.guest && meal.guest > 0) {
              if (dhakaNow.hour >= 21 || dhakaNow.hour >= 12) g = meal.guest;
              else if (dhakaNow.hour >= 8) g = Math.min(meal.guest, 0.5);
            }
          } else if (!isFuture) {
            b = meal.breakfast || 0;
            l = meal.lunch || 0;
            dn = meal.dinner || 0;
            g = meal.guest || 0;
          }
        }
        const totalDayMeals = round1(b + l + dn + g);

        const dayDeps = memberDeposits.filter((dep) => isSameDay(dep.date, d));
        const dayDepositTotal = dayDeps
          .filter((dep) => dep.status === "Approved")
          .reduce((acc, dep) => acc + dep.amount, 0);

        const dayExps = memberExpenses.filter((exp) => isSameDay(exp.date, d));
        const dayBazaarTotal = dayExps
          .filter((exp) => exp.status === "Approved")
          .reduce((acc, exp) => acc + exp.amount, 0);

        dailyBreakdown.push({
          day: d,
          dayName,
          formattedDate,
          isoDate,
          breakfast: b,
          lunch: l,
          dinner: dn,
          guest: g,
          totalMeals: totalDayMeals,
          depositAmount: dayDepositTotal,
          deposits: dayDeps.map((dep) => ({
            amount: dep.amount,
            method: dep.method || "Cash",
            status: dep.status,
            note: dep.note || "",
          })),
          bazaarAmount: dayBazaarTotal,
          bazaars: dayExps.map((exp) => ({
            amount: exp.amount,
            description: exp.description || "",
            status: exp.status,
          })),
        });
      }

      return {
        id: member.id,
        name: member.name || "Unnamed",
        phone: member.phone || "N/A",
        email: member.email || "N/A",
        role: member.role,
        stats: {
          totalDeposit: memTotalDeposit,
          totalMeals: memTotalMeals,
          liveMealRate,
          mealCost: memSummary.mealCost,
          fixedCost: memSummary.fixedCost,
          totalBazaar: memTotalBazaar,
          totalCost: memSummary.totalCost,
          currentBalance: memSummary.balance,
          isPositive: memSummary.isPositive,
          balanceFormatted: memSummary.balanceFormatted,
          breakdownMeals: {
            breakfast: Math.round(memBreakfast * 10) / 10,
            lunch: Math.round(memLunch * 10) / 10,
            dinner: Math.round(memDinner * 10) / 10,
            guest: Math.round(memGuest * 10) / 10,
          },
        },
        dailyBreakdown,
      };
    });

    // 8. Flat Bazaar Transactions for quick lookup & summary
    const allBazaars = allExpenses.map((exp) => ({
      id: exp.id,
      date: exp.date,
      formattedDate: new Date(exp.date).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      memberName: exp.user?.name || "Unknown Member",
      phone: exp.user?.phone || "N/A",
      amount: exp.amount,
      description: exp.description || "Bazaar shopping",
      status: exp.status,
    }));

    // 9. Flat Deposit Transactions for quick lookup & summary
    const allDepositsFormatted = allDeposits.map((dep) => ({
      id: dep.id,
      date: dep.date,
      formattedDate: new Date(dep.date).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      memberName: dep.user?.name || "Unknown Member",
      phone: dep.user?.phone || "N/A",
      amount: dep.amount,
      method: dep.method || "Cash",
      status: dep.status,
      note: dep.note || "",
    }));

    return NextResponse.json({
      messName: currentUser.messName || "AMADER MESS",
      month: targetMonth,
      year: targetYear,
      monthName,
      daysInMonth,
      generatedAt: new Date().toISOString(),
      generatedBy: {
        name: currentUser.name || "Admin/Manager",
        role: currentUser.role,
      },
      stats: {
        totalMembers: members.length,
        totalBazaarCost: Math.round(totalMessBazaarCost * 100) / 100,
        totalDeposit: Math.round(totalMessDeposits * 100) / 100,
        totalMealsConsumed: Math.round(totalMessMeals * 10) / 10,
        liveMealRate,
        fixedCostPerMember,
        currentBalance: currentCashBalance,
      },
      memberReports,
      allBazaars,
      allDeposits: allDepositsFormatted,
    });
  } catch (error) {
    return safeErrorResponse(error, "Failed to fetch full monthly reports data");
  }
}
