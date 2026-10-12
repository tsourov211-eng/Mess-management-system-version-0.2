/**
 * Standard Bangladeshi Mess Business Logic & Calculation Engine
 * 
 * Rules:
 * 1. Total Meals = Breakfast + Lunch + Dinner + Guest Meals
 * 2. Total Bazar = Sum of approved food / market expenses
 * 3. Live Meal Rate = Total Bazar / Total Meals (0.00 if Total Meals is 0)
 * 4. Fixed Cost Per Member = Sum of monthly non-bazar overheads (Seat Rent, Utilities, Gas, Wifi, Maid, Additional)
 * 5. Member Total Cost = (Member Meals * Meal Rate) + Member Fixed Cost
 * 6. Member Net Balance = Member Total Deposits - Member Total Cost
 *    - Positive (> 0): Member is in surplus (Refund due from mess fund) -> Green
 *    - Negative (< 0): Member is in deficit (Due payable to mess) -> Red
 */

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
 * Calculates the exact live meal rate with division-by-zero protection.
 */
export function calculateMealRate(totalBazar: number, totalMeals: number): number {
  if (totalMeals <= 0 || totalBazar <= 0) {
    return 0;
  }
  const rate = totalBazar / totalMeals;
  return Math.round(rate * 100) / 100;
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

  return Math.round(total * 100) / 100;
}

/**
 * Calculates a member's complete financial summary.
 * In an active/ongoing month, live balance reflects real money present right now:
 * Member Live Balance = Member Deposits - (Member Meals * Live Meal Rate) - Actual Incurred Shared Costs
 * Unpaid projected overhead configurations (e.g. seat rent, maid budget) are preserved for breakdown display
 * but NOT deducted from live cash-in-hand balances.
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

  const mealCost = Math.round((totalMeals * mealRate) * 100) / 100;
  const sharedOverhead = actualSharedCost > 0 ? actualSharedCost : fixedCost;
  const totalCost = Math.round((mealCost + sharedOverhead) * 100) / 100;
  const balance = Math.round((totalDeposit - totalCost) * 100) / 100;
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
    totalDeposit: Math.round(totalDeposit * 100) / 100,
    totalMeals: Math.round(totalMeals * 10) / 10,
    mealCost,
    fixedCost,
    totalCost,
    balance,
    isPositive,
    balanceFormatted: `${prefix} Tk ${absAmount}`,
  };
}

/**
 * Formats a month & year Date into the string key used by MonthlyExpense table (e.g. "October 2026").
 */
export function formatMonthKey(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
