import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limiting store (isolated per node process)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale rate-limit buckets every 5 minutes
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (typeof timer === "object" && typeof (timer as any).unref === "function") {
    (timer as any).unref();
  }
}

/**
 * Checks and increments the rate limit for a given key.
 * @param key Unique identifier (IP address, email, or user ID)
 * @param maxRequests Maximum requests allowed within the window
 * @param windowMs Time window in milliseconds (default: 60,000ms = 1 min)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs = 60 * 1000
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetAt: newRecord.resetAt,
    };
  }

  if (record.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Extracts a client identifier (IP address or fallback token) from the Request headers.
 */
export function getClientIdentifier(req: Request, suffix = ""): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";
  return `${ip}:${suffix}`;
}

/**
 * Standard 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitExceededResponse(resetAt: number) {
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    {
      success: false,
      error: `Too many requests. Please slow down and try again in ${retryAfterSec} seconds.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}
