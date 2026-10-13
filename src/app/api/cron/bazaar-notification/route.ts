import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureTodayBazaarNotice, getDhakaDate } from "@/lib/calculations";

/**
 * Midnight Bazaar Duty Notification Trigger Route.
 * Can be called via GET or POST at 12:00 AM (00:00) by cron jobs (e.g. Vercel Cron, external webhook),
 * or directly by testing tools.
 */
export async function GET() {
  try {
    const dhaka = getDhakaDate();
    const result = await ensureTodayBazaarNotice(prisma);
    return NextResponse.json({
      success: true,
      message: "Bazaar notification check executed successfully",
      dhakaDate: `${dhaka.year}-${String(dhaka.month).padStart(2, "0")}-${String(dhaka.day).padStart(2, "0")}`,
      time: `${String(dhaka.hour).padStart(2, "0")}:${String(dhaka.minute).padStart(2, "0")}`,
      result,
    });
  } catch (error) {
    console.error("Cron bazaar-notification GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to trigger bazaar notification" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
