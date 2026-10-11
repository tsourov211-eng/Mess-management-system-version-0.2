import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, sanitizeInput, safeErrorResponse } from "@/lib/security";
import { RegisterSchema } from "@/lib/validations";
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Rate limiting: 5 attempts per minute per IP
    const clientId = getClientIdentifier(req, "register");
    const rateCheck = checkRateLimit(clientId, 5, 60 * 1000);
    if (!rateCheck.success) {
      return rateLimitExceededResponse(rateCheck.resetAt);
    }

    const body = await req.json();

    // 2. Strict Zod Schema Validation
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const errorMessage = parsed.error.issues[0]?.message || "Invalid registration data";
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    const { name, email, phone, password } = parsed.data;

    // 3. Duplicate email verification
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists!" },
        { status: 400 }
      );
    }

    // 4. Secure Password Hashing with cost factor 12
    const hashedPassword = await hashPassword(password);

    // 5. Sanitize text fields
    const sanitizedName = sanitizeInput(name);
    const sanitizedPhone = phone ? sanitizeInput(phone) : null;

    const newUser = await prisma.user.create({
      data: {
        name: sanitizedName,
        email,
        password: hashedPassword,
        phone: sanitizedPhone,
        role: "pending", 
        defaultBreakfast: 0.5,
        defaultLunch: 1.0,
        defaultDinner: 1.0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful! You can log in after admin approval.",
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
      },
      { status: 201 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Registration failed! Please try again.");
  }
}
