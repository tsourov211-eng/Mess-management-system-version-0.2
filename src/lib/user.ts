/**
 * Unified user and role helper utilities.
 * Ensures consistent normalization across session, profile, and UI components.
 */

export type UserRole = "admin" | "manager" | "member" | "suspended" | "pending" | string;

/**
 * Normalizes user role into a consistent, user-facing display label.
 * Single source of truth across the application.
 */
export function getUserDisplayRole(
  roleOrUser?: string | { role?: string | null } | null
): string {
  if (!roleOrUser) return "Member";
  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser.role;
  if (!role) return "Member";

  const normalized = role.toLowerCase().trim();
  switch (normalized) {
    case "admin":
    case "super_admin":
    case "superadmin":
      return "Super Admin";
    case "manager":
      return "Mess Manager";
    case "member":
      return "Member";
    case "suspended":
      return "Suspended";
    case "pending":
      return "Pending Approval";
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

/**
 * Provides dedicated, premium badge styles corresponding to normalized user roles.
 */
export function getRoleBadgeStyle(
  roleOrUser?: string | { role?: string | null } | null
): string {
  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser?.role;
  const normalized = (role || "").toLowerCase().trim();

  switch (normalized) {
    case "admin":
    case "super_admin":
    case "superadmin":
      return "bg-purple-50 text-purple-700 border-purple-200/80";
    case "manager":
      return "bg-blue-50 text-blue-700 border-blue-200/80";
    case "suspended":
      return "bg-red-50 text-red-700 border-red-200/80";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200/80";
    case "member":
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  }
}
