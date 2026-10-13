import { z } from "zod";

/**
 * 1. User Registration Schema
 */
export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  phone: z.string().trim().max(20).optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

/**
 * 2. Password Reset Schemas
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

/**
 * 3. Daily Meal Logging Schemas
 */
export const SingleMealItemSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  breakfast: z.coerce.number().min(0, "Breakfast cannot be negative").max(10),
  lunch: z.coerce.number().min(0, "Lunch cannot be negative").max(10),
  dinner: z.coerce.number().min(0, "Dinner cannot be negative").max(10),
  guest: z.coerce.number().min(0, "Guest meals cannot be negative").max(50).default(0),
});

export const SaveMealsSchema = z.object({
  date: z.string().min(1, "Date is required"),
  meals: z.array(SingleMealItemSchema).optional(),
  userId: z.string().optional(),
  breakfast: z.coerce.number().min(0).max(10).optional(),
  lunch: z.coerce.number().min(0).max(10).optional(),
  dinner: z.coerce.number().min(0).max(10).optional(),
  guest: z.coerce.number().min(0).max(50).optional(),
});

/**
 * 4. Member Finance / Deposit / Expense Submission
 */
export const FinanceSubmissionSchema = z.object({
  type: z.enum(["payment", "expense"], {
    message: "Invalid transaction type",
  }),
  amount: z.coerce.number().positive("Amount must be greater than zero").max(1000000),
  category: z.string().trim().max(300).optional().default("Meal Fund"),
  note: z.string().trim().max(500).optional().nullable(),
  method: z.enum(["Cash", "bKash", "Nagad", "Bank"]).optional().default("Cash"),
  date: z.string().optional().nullable(),
});

/**
 * 5. Daily Bazaar Expense Submission
 */
export const BazaarExpenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero").max(1000000),
  description: z.string().trim().max(500).optional().nullable(),
  date: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
});

/**
 * 6. Manager Action (Approve / Reject)
 */
export const ManagerActionSchema = z.object({
  id: z.string().min(1, "Transaction ID is required"),
  type: z.enum(["deposit", "expense", "guestMeal"]),
  action: z.enum(["Approve", "Reject"]),
});

/**
 * 6.5 Guest Meal Request Submission Schema
 */
export const GuestMealSubmissionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  mealType: z.string().default("LUNCH"),
  guests: z.coerce.number().int().min(1, "At least 1 guest required").max(50, "Maximum 50 guests"),
  note: z.string().trim().max(500).optional().nullable(),
});

/**
 * 7. Monthly Expense Configuration
 */
export const MonthlyExpenseSchema = z.object({
  month: z.string().min(3, "Month name is required"),
  seatRent: z.coerce.number().min(0).default(0),
  electricityGas: z.coerce.number().min(0).default(0),
  internet: z.coerce.number().min(0).default(0),
  maid: z.coerce.number().min(0).default(0),
  additional: z.coerce.number().min(0).default(0),
  mealCharge: z.coerce.number().min(0).default(0),
});

/**
 * 8. Admin User Updates & Roles
 */
export const AdminUpdateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newRole: z.enum(["admin", "manager", "member", "suspended"]).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
});

export const AdminCreateUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(20).optional().nullable(),
  role: z.enum(["admin", "manager", "member"]).default("member"),
  password: z.string().min(6).max(100).optional().default("123456"),
});

/**
 * 9. Change Password Schema
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(100),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirmation do not match",
  path: ["confirmPassword"],
});

/**
 * 10. Profile Settings Schema
 */
export const ProfileSettingsSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  image: z.string().optional().nullable(),
  messName: z.string().trim().max(100).optional().nullable(),
});
