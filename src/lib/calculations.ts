/**
 * Standard Bangladeshi Mess Business Logic & Calculation Engine
 * 
 * Rules:
 * 1. Total Meals = Breakfast + Lunch + Dinner + Guest Meals
 * 2. Total Bazar = Sum of approved food / market expenses
 * 3. Live Meal Rate = Total Bazar / Total Meals (0.00 if Total Meals is 0)
 * 4. Fixed Cost Per Member = Sum of monthly non-bazar overheads (Seat Rent, Utilities, Gas, Wifi, Maid, Additional, Meal Charge)
 * 5. Member Total Cost = (Member Meals * Meal Rate) + Member Fixed Cost
 * 6. Member Net Balance = Member Total Deposits - Member Total Cost
 *    - Positive (>= 0): Member is in surplus (Refund / credit in mess fund) -> Green
 *    - Negative (< 0): Member is in deficit (Due payable to mess) -> Red
 * 7. Fund Segregation:
 *    - Meal Fund = Approved Meal Deposits - Approved Bazar Food Expenses
 *    - Mess Fund = Approved Overhead Deposits (Seat Rent, Bills, WiFi, Maid, etc.)
 *    - Total Fund = Meal Fund + Mess Fund (Strictly equals total cash-in-hand)
 */

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

export interface MonthlyExpenseConfig {
  seatRent?: number;
  electricityGas?: number;
  internet?: number;
  maid?: number;
  additional?: number;
  mealCharge?: number;
}

export interface MemberFinancialSummary {
  userId: string;
  name: string;
  role: string;
  totalDeposit: number;
  totalMeals: number;
  mealCost: number;
  fixedCost: number;
  totalCost: number;
  balance: number;
  isPositive: boolean;
  balanceFormatted: string;
}

/**
 * Utility to round floats safely to prevent IEEE-754 precision drift (e.g. 0.1 + 0.2).
 */
export function round2(num: number): number {
  return Math.round((Number(num) || 0) * 100) / 100;
}

export function round1(num: number): number {
  return Math.round((Number(num) || 0) * 10) / 10;
}

/**
 * Extracts year, month (1-12), day, hour, and minute in Bangladesh standard time (Asia/Dhaka).
 * Crucial for hosting on UTC platforms like Vercel to prevent midnight date flips.
 */
export function getDhakaDate(baseDate: Date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(baseDate);

    const year = parseInt(parts.find((p) => p.type === "year")?.value || `${baseDate.getFullYear()}`, 10);
    const month = parseInt(parts.find((p) => p.type === "month")?.value || `${baseDate.getMonth() + 1}`, 10);
    const day = parseInt(parts.find((p) => p.type === "day")?.value || `${baseDate.getDate()}`, 10);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || `${baseDate.getHours()}`, 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || `${baseDate.getMinutes()}`, 10);

    return { year, month, day, hour, minute };
  } catch {
    return {
      year: baseDate.getFullYear(),
      month: baseDate.getMonth() + 1,
      day: baseDate.getDate(),
      hour: baseDate.getHours(),
      minute: baseDate.getMinutes(),
    };
  }
}

/**
 * Calculates start and end timestamps for "Today" spanning both UTC midnight and Dhaka local midnight.
 * This guarantees that meals logged at UTC 00:00 and expenses logged during the Dhaka day are both captured.
 */
export function getDhakaTodayStartAndEnd(baseDate: Date = new Date()) {
  const dhaka = getDhakaDate(baseDate);
  const now = baseDate;

  const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const localTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  
  const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const utcTomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

  const dhakaUtcToday = new Date(Date.UTC(dhaka.year, dhaka.month - 1, dhaka.day, 0, 0, 0, 0));
  const dhakaUtcTomorrow = new Date(Date.UTC(dhaka.year, dhaka.month - 1, dhaka.day + 1, 0, 0, 0, 0));

  const todayStart = new Date(Math.min(localToday.getTime(), utcToday.getTime(), dhakaUtcToday.getTime()));
  const todayEnd = new Date(Math.max(localTomorrow.getTime(), utcTomorrow.getTime(), dhakaUtcTomorrow.getTime()));

  return { todayStart, todayEnd, dhaka };
}

/**
 * Computes exact month UTC range, month keys, and metadata for dynamic queries.
 */
export function getMonthDateRange(
  yearParam?: number | string | null,
  monthParam?: number | string | null
) {
  const dhakaNow = getDhakaDate();
  
  let targetYear = yearParam ? parseInt(String(yearParam), 10) : dhakaNow.year;
  let targetMonth = monthParam ? parseInt(String(monthParam), 10) : dhakaNow.month;

  if (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100) {
    targetYear = dhakaNow.year;
  }
  if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
    targetMonth = dhakaNow.month;
  }

  // Exact UTC boundaries for standard MongoDB filtering
  const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));

  const monthIndex = targetMonth - 1;
  const monthName = MONTH_NAMES[monthIndex];
  const shortMonthName = monthName.slice(0, 3);
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

  // Multi-format keys to reliably match MonthlyExpense entries
  const monthKey = `${monthName} ${targetYear}`;
  const isoMonthKey = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
  const shortMonthKey = `${shortMonthName} ${targetYear}`;

  const allMonthKeys = [
    monthKey,
    isoMonthKey,
    shortMonthKey,
    `${targetYear}-${targetMonth}`,
  ];

  return {
    year: targetYear,
    month: targetMonth,
    startDate,
    endDate,
    dateFilter: { gte: startDate, lt: endDate },
    monthName,
    monthKey,
    isoMonthKey,
    allMonthKeys,
    daysInMonth,
  };
}

/**
 * Calculates the exact live meal rate with division-by-zero protection.
 */
export function calculateMealRate(totalBazar: number, totalMeals: number): number {
  if (totalMeals <= 0 || totalBazar <= 0) {
    return 0;
  }
  return round2(totalBazar / totalMeals);
}

/**
 * Calculates the total fixed overhead cost per member for a given month.
 */
export function calculateFixedCostPerMember(config?: MonthlyExpenseConfig | null): number {
  if (!config) return 0;
  const total = 
    (Number(config.seatRent) || 0) +
    (Number(config.electricityGas) || 0) +
    (Number(config.internet) || 0) +
    (Number(config.maid) || 0) +
    (Number(config.additional) || 0) +
    (Number(config.mealCharge) || 0);

  return round2(total);
}

/**
 * Computes strictly segregated and balanced mess funds:
 * - Meal Fund = Approved Meal Deposits - Approved Food Expenses
 * - Mess Fund = Approved Overhead Deposits (Total Approved Deposits - Meal Deposits)
 * - Total Fund = Meal Fund + Mess Fund (Cash in Hand)
 */
export function calculateFunds(params: {
  totalApprovedDeposits: number;
  totalMealDeposits: number;
  totalFoodExpenses: number;
}) {
  const totalApproved = round2(params.totalApprovedDeposits);
  const totalMealDeps = round2(params.totalMealDeposits);
  const totalFoodExps = round2(params.totalFoodExpenses);

  const mealFund = round2(totalMealDeps - totalFoodExps);
  const messFund = round2(Math.max(0, totalApproved - totalMealDeps));
  const totalFund = round2(mealFund + messFund);

  return {
    mealFund,
    messFund,
    totalFund,
    totalMealDeposits: totalMealDeps,
    totalOverheadDeposits: messFund,
    totalFoodExpenses: totalFoodExps,
  };
}

/**
 * Calculates a member's complete financial summary.
 * In an active/ongoing month, live balance reflects real money present right now:
 * Member Live Balance = Member Deposits - (Member Meals * Live Meal Rate) - Incurred/Allocated Overheads
 * 
 * Pending members are never charged overheads or meal costs.
 */
export function calculateMemberSummary(params: {
  userId: string;
  name: string;
  role: string;
  totalDeposit: number;
  totalMeals: number;
  mealRate: number;
  fixedCost?: number;
  actualSharedCost?: number;
}): MemberFinancialSummary {
  const { 
    userId, 
    name, 
    role, 
    totalDeposit, 
    totalMeals, 
    mealRate, 
    fixedCost = 0, 
    actualSharedCost = 0 
  } = params;

  const isPending = role === "pending";

  const effectiveFixedCost = isPending ? 0 : round2(actualSharedCost > 0 ? actualSharedCost : fixedCost);
  const mealCost = isPending ? 0 : round2(totalMeals * mealRate);
  const totalCost = round2(mealCost + effectiveFixedCost);
  const balance = round2(totalDeposit - totalCost);
  const isPositive = balance >= 0;

  const prefix = isPositive ? "+" : "-";
  const absAmount = Math.abs(balance).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    userId,
    name,
    role,
    totalDeposit: round2(totalDeposit),
    totalMeals: round1(totalMeals),
    mealCost,
    fixedCost: effectiveFixedCost,
    totalCost,
    balance,
    isPositive,
    balanceFormatted: `${prefix} Tk ${absAmount}`,
  };
}

/**
 * Formats a month & year Date or numeric month/year into the string key used by MonthlyExpense table.
 * Backwards compatible with both formatMonthKey(date) and formatMonthKey(year, month).
 */
export function formatMonthKey(dateOrYear: Date | number, maybeMonth?: number): string {
  if (typeof dateOrYear === "number" && typeof maybeMonth === "number") {
    const monthIndex = Math.max(0, Math.min(11, maybeMonth - 1));
    return `${MONTH_NAMES[monthIndex]} ${dateOrYear}`;
  }
  
  if (dateOrYear instanceof Date) {
    // Read UTC month & year to avoid any timezone day-shift
    const m = dateOrYear.getUTCMonth();
    const y = dateOrYear.getUTCFullYear();
    return `${MONTH_NAMES[m]} ${y}`;
  }

  const d = new Date();
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Automatically creates or synchronizes today's Bazaar Duty announcement notice at midnight (12:00 AM) or on first load of the day.
 * Ensures every member, manager, and admin receives an active notice of whose bazaar duty it is today.
 * When bazaar is completed, updates the notice to indicate completion.
 */
export async function ensureTodayBazaarNotice(prismaClient: any) {
  try {
    const { todayStart, todayEnd } = getDhakaTodayStartAndEnd();
    const dhaka = getDhakaDate();

    // 1. Fetch all approved or done bazaar schedules for today
    const todaySchedules = await prismaClient.bazaarSchedule.findMany({
      where: {
        date: { gte: todayStart, lt: todayEnd },
        status: { in: ["approved", "done"] },
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!todaySchedules || todaySchedules.length === 0) {
      return { count: 0 };
    }

    const dateFormatted = `${dhaka.day} ${MONTH_NAMES[dhaka.month - 1]} ${dhaka.year}`;

    for (const sched of todaySchedules) {
      const memberName = sched.user?.name || "Member";
      const schedTag = `<!--bazaar-schedule-${sched.id}-->`;
      const isDone = sched.status === "done";

      const expectedTitle = isDone
        ? `Today's Bazaar Completed: ${memberName}`
        : `Today's Bazaar Duty: ${memberName}`;

      const expectedDesc = isDone
        ? `✅ Bazaar shopping completed by ${memberName} for today (${dateFormatted}). ${schedTag}`
        : `Reminder: Today (${dateFormatted}) is ${memberName}'s scheduled bazaar duty. Please complete shopping and submit bazaar expenses. ${schedTag}`;

      // Check if a notice for this schedule already exists
      const existingNotice = await prismaClient.notice.findFirst({
        where: {
          description: { contains: sched.id },
        },
      });

      if (!existingNotice) {
        await prismaClient.notice.create({
          data: {
            title: expectedTitle,
            description: expectedDesc,
            type: "bazaar",
            isActive: true,
          },
        });
      } else if (existingNotice.title !== expectedTitle) {
        await prismaClient.notice.update({
          where: { id: existingNotice.id },
          data: {
            title: expectedTitle,
            description: expectedDesc,
            isActive: true,
          },
        });
      }
    }

    return { count: todaySchedules.length };
  } catch (error) {
    console.error("ensureTodayBazaarNotice error:", error);
    return { error };
  }
}

/**
 * Updates or creates the notice when a bazaar schedule status is changed (e.g. marked "done" or reverted to "approved").
 */
export async function updateBazaarNoticeStatus(
  prismaClient: any,
  schedule: { id: string; userId: string; user?: { name?: string | null } },
  newStatus: string
) {
  try {
    const dhaka = getDhakaDate();
    const dateFormatted = `${dhaka.day} ${MONTH_NAMES[dhaka.month - 1]} ${dhaka.year}`;
    const memberName = schedule.user?.name || "Member";
    const schedTag = `<!--bazaar-schedule-${schedule.id}-->`;
    const isDone = newStatus === "done";

    const expectedTitle = isDone
      ? `Today's Bazaar Completed: ${memberName}`
      : `Today's Bazaar Duty: ${memberName}`;

    const expectedDesc = isDone
      ? `✅ Bazaar shopping completed by ${memberName} for today (${dateFormatted}). ${schedTag}`
      : `Reminder: Today (${dateFormatted}) is ${memberName}'s scheduled bazaar duty. Please complete shopping and submit bazaar expenses. ${schedTag}`;

    const existingNotice = await prismaClient.notice.findFirst({
      where: {
        description: { contains: schedule.id },
      },
    });

    if (existingNotice) {
      await prismaClient.notice.update({
        where: { id: existingNotice.id },
        data: {
          title: expectedTitle,
          description: expectedDesc,
          isActive: true,
        },
      });
    } else {
      await prismaClient.notice.create({
        data: {
          title: expectedTitle,
          description: expectedDesc,
          type: "bazaar",
          isActive: true,
        },
      });
    }
  } catch (error) {
    console.error("updateBazaarNoticeStatus error:", error);
  }
}

export interface MealLogItem {
  date: Date | string;
  breakfast?: number | null;
  lunch?: number | null;
  dinner?: number | null;
  guest?: number | null;
}

/**
 * Calculates the actual CONSUMED meal units taking Dhaka meal cutoff times into account.
 * - Past dates (< todayStart): All meals (breakfast, lunch, dinner, guest) are 100% consumed.
 * - Today: Only meals whose cutoff times have passed in Dhaka time are counted as consumed!
 *   - Breakfast: counted if current Dhaka hour >= 8
 *   - Lunch: counted if current Dhaka hour >= 12
 *   - Dinner: counted if current Dhaka hour >= 21
 * - Future dates (>= todayEnd): 0 meals consumed yet.
 */
export function calculateConsumedMeals(
  meal: MealLogItem,
  dhakaDate = getDhakaDate(),
  todayStartAndEnd?: { todayStart: Date; todayEnd: Date; dhaka?: any }
): number {
  const mDate = new Date(meal.date);
  const bounds = todayStartAndEnd || getDhakaTodayStartAndEnd();
  const { todayStart, todayEnd } = bounds;

  // 1. If this meal is in the PAST (before today), all meals have already been consumed
  if (mDate.getTime() < todayStart.getTime()) {
    return round1((meal.breakfast || 0) + (meal.lunch || 0) + (meal.dinner || 0) + (meal.guest || 0));
  }

  // 2. If this meal is in the FUTURE (after today), none have been consumed yet
  if (mDate.getTime() >= todayEnd.getTime()) {
    return 0;
  }

  // 3. This meal is for TODAY! Only count meals whose cutoff times have PASSED
  const currentHour = dhakaDate.hour;
  const breakfastPassed = currentHour >= 8;
  const lunchPassed = currentHour >= 12;
  const dinnerPassed = currentHour >= 21;

  let consumed = 0;
  if (breakfastPassed) consumed += (meal.breakfast || 0);
  if (lunchPassed) consumed += (meal.lunch || 0);
  if (dinnerPassed) consumed += (meal.dinner || 0);

  if (meal.guest && meal.guest > 0) {
    if (dinnerPassed) {
      consumed += meal.guest;
    } else if (lunchPassed) {
      consumed += meal.guest;
    } else if (breakfastPassed) {
      consumed += Math.min(meal.guest, 0.5);
    }
  }

  return round1(consumed);
}

/**
 * Ensures all active mess members have a MealLog record initialized for today with their default meals.
 * This guarantees that live meal tracking, cooking headcount, and financial reports are 100% accurate.
 */
export async function ensureTodayMealLogs(prismaClient: any) {
  try {
    const { todayStart, todayEnd, dhaka } = getDhakaTodayStartAndEnd();
    const dhakaUtcToday = new Date(Date.UTC(dhaka.year, dhaka.month - 1, dhaka.day, 0, 0, 0, 0));

    // 1. Fetch active members
    const activeUsers = await prismaClient.user.findMany({
      where: { role: { not: "pending" } },
      select: {
        id: true,
        defaultBreakfast: true,
        defaultLunch: true,
        defaultDinner: true,
      },
    });

    if (!activeUsers || activeUsers.length === 0) return { count: 0 };

    // 2. Fetch existing meal logs for today
    const existingLogs = await prismaClient.mealLog.findMany({
      where: {
        date: { gte: todayStart, lt: todayEnd },
      },
      select: { userId: true },
    });

    const loggedUserIds = new Set(existingLogs.map((l: any) => l.userId));

    // 3. Find active users who don't have a meal log for today
    const missingUsers = activeUsers.filter((u: any) => !loggedUserIds.has(u.id));

    if (missingUsers.length === 0) return { count: existingLogs.length };

    // 4. Create missing logs in bulk with user default meals
    await prismaClient.mealLog.createMany({
      data: missingUsers.map((u: any) => ({
        userId: u.id,
        date: dhakaUtcToday,
        breakfast: u.defaultBreakfast ?? 0.5,
        lunch: u.defaultLunch ?? 1.0,
        dinner: u.defaultDinner ?? 1.0,
        guest: 0,
      })),
    });

    return { count: existingLogs.length + missingUsers.length, created: missingUsers.length };
  } catch (error) {
    console.error("ensureTodayMealLogs error:", error);
    return { error };
  }
}

/**
 * Calculates the meal portion (multiplier) for a single guest based on mealType.
 * Standard Mess rules:
 * - Breakfast Only: 0.5 meal
 * - Lunch Only: 1.0 meal
 * - Dinner Only: 1.0 meal
 * - Breakfast & Dinner: 1.5 meals
 * - Lunch & Dinner: 2.0 meals
 * - All Meals: 2.5 meals
 */
export function getGuestMealPortion(mealType?: string | null): number {
  if (!mealType) return 1.0;
  const normalized = mealType.trim().toLowerCase();

  if (normalized.includes("all")) {
    return 2.5;
  }

  let portion = 0;
  if (normalized.includes("breakfast") || normalized.includes("bfast")) {
    portion += 0.5;
  }
  if (normalized.includes("lunch")) {
    portion += 1.0;
  }
  if (normalized.includes("dinner")) {
    portion += 1.0;
  }

  if (portion > 0) {
    return portion;
  }

  if (normalized.includes("both")) {
    return 2.0;
  }

  return 1.0;
}

/**
 * Calculates total guest meals for a guest request.
 * guestCount * portionPerGuest
 */
export function calculateGuestMealUnits(guests: number, mealType?: string | null): number {
  const count = Math.max(0, Number(guests) || 0);
  const portion = getGuestMealPortion(mealType);
  return round1(count * portion);
}

/**
 * Synchronizes approved guest meal requests with MealLog records.
 * Guarantees MealLog.guest accurately reflects:
 * sum of (guests * portion) for all approved guest meal requests on each date.
 */
export async function syncUserGuestMeals(
  prismaClient: any,
  userId?: string | null,
  dateFilter?: { gte: Date; lt: Date }
) {
  try {
    const whereReq: any = { status: "Approved" };
    if (userId) whereReq.userId = userId;
    if (dateFilter) whereReq.date = dateFilter;

    const approvedRequests = await prismaClient.guestMealRequest.findMany({
      where: whereReq,
    });

    const whereLog: any = {};
    if (userId) whereLog.userId = userId;
    if (dateFilter) whereLog.date = dateFilter;

    const mealLogs = await prismaClient.mealLog.findMany({
      where: whereLog,
    });

    // Group approved guest meals by user and UTC date key: userId_YYYY-MM-DD
    const approvedByUserDate = new Map<string, { totalUnits: number; date: Date; userId: string }>();
    for (const req of approvedRequests) {
      const d = new Date(req.date);
      const key = `${req.userId}_${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      const units = calculateGuestMealUnits(req.guests, req.mealType);
      const current = approvedByUserDate.get(key) || { totalUnits: 0, date: d, userId: req.userId };
      current.totalUnits = round1(current.totalUnits + units);
      approvedByUserDate.set(key, current);
    }

    const updates: Promise<any>[] = [];

    // 1. Sync existing logs whose guest count differs from approved guest meals
    for (const log of mealLogs) {
      const d = new Date(log.date);
      const key = `${log.userId}_${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      const expectedUnits = approvedByUserDate.get(key)?.totalUnits || 0;

      if (Math.abs((log.guest || 0) - expectedUnits) > 0.01) {
        updates.push(
          prismaClient.mealLog.update({
            where: { id: log.id },
            data: { guest: expectedUnits },
          })
        );
      }
    }

    // 2. Create missing MealLog records for dates that have approved guest meals but no log yet
    for (const [key, item] of approvedByUserDate.entries()) {
      const hasLog = mealLogs.some((l: any) => {
        const d = new Date(l.date);
        const lKey = `${l.userId}_${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        return lKey === key;
      });

      if (!hasLog && item.totalUnits > 0) {
        const u = await prismaClient.user.findUnique({
          where: { id: item.userId },
          select: { defaultBreakfast: true, defaultLunch: true, defaultDinner: true },
        });
        const reqUtcDate = new Date(Date.UTC(item.date.getUTCFullYear(), item.date.getUTCMonth(), item.date.getUTCDate(), 0, 0, 0, 0));
        updates.push(
          prismaClient.mealLog.create({
            data: {
              userId: item.userId,
              date: reqUtcDate,
              breakfast: u?.defaultBreakfast ?? 0.5,
              lunch: u?.defaultLunch ?? 1.0,
              dinner: u?.defaultDinner ?? 1.0,
              guest: item.totalUnits,
            },
          })
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  } catch (error) {
    console.error("syncUserGuestMeals error:", error);
  }
}


