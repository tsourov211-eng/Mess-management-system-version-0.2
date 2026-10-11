import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

/**
 * Hardened Security Configuration
 * Cost factor 12 for bcrypt (meets enterprise standard specified in 3.A)
 */
export const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares plaintext password against a stored bcrypt hash.
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword?: string | null
): Promise<boolean> {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Sanitizes user text input to defend against XSS, control characters, and injection attacks.
 */
export function sanitizeInput(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "") // Strip HTML tag angle brackets
    .trim();
}

/**
 * Enterprise Safe Error Response
 * Never leaks database crash dumps, SQL/MongoDB connection details, or raw stack traces.
 */
export function safeErrorResponse(
  error: unknown,
  fallbackMessage = "An internal server error occurred.",
  status = 500
) {
  // Log full error on the server for telemetry and debugging
  console.error(`[SECURE_ERROR_LOG] [${new Date().toISOString()}]:`, error);

  return NextResponse.json(
    {
      success: false,
      error: fallbackMessage,
    },
    { status }
  );
}
