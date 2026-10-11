import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FinanceSubmissionSchema } from "@/lib/validations";
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from "@/lib/rate-limit";
import { sanitizeInput, safeErrorResponse } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting: 30 financial mutations per minute
    const clientId = getClientIdentifier(req, "finance-post");
    const rateCheck = checkRateLimit(clientId, 30, 60 * 1000);
    if (!rateCheck.success) {
      return rateLimitExceededResponse(rateCheck.resetAt);
    }

    // Anti-IDOR: Derive authenticated user identity from verified database record
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = FinanceSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid financial transaction data" },
        { status: 400 }
      );
    }

    const { type, amount, note, method, date } = parsed.data;
    const sanitizedNote = sanitizeInput(note);
    const transactionDate = date ? new Date(date) : new Date();

    // 💡 Payment Request (Deposit)
    if (type === "payment") {
      const newDeposit = await prisma.deposit.create({
        data: {
          userId: user.id, // Strictly scoped to session user (Anti-IDOR)
          amount,
          note: sanitizedNote,
          method: method || "Cash",
          status: "Pending", // Awaiting manager approval
          date: transactionDate,
        },
      });
      return NextResponse.json(
        { success: true, message: "Payment request submitted successfully", data: newDeposit },
        { status: 201 }
      );
    }

    // 💡 Bazar Expense
    if (type === "expense") {
      const newExpense = await prisma.expense.create({
        data: {
          userId: user.id, // Strictly scoped to session user (Anti-IDOR)
          amount,
          description: sanitizedNote || "Bazar Expense",
          status: "Pending", // Awaiting manager approval
          date: transactionDate,
        },
      });
      return NextResponse.json(
        { success: true, message: "Expense submitted for approval", data: newExpense },
        { status: 201 }
      );
    }

    return NextResponse.json({ success: false, error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    return safeErrorResponse(error, "Failed to submit financial transaction");
  }
}