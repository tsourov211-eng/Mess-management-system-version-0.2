import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mailer';
import crypto from 'crypto';
import { ForgotPasswordSchema } from '@/lib/validations';
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from '@/lib/rate-limit';
import { safeErrorResponse } from '@/lib/security';

export async function POST(req: Request) {
    try {
        // 1. Rate Limiting: 5 requests per minute
        const clientId = getClientIdentifier(req, "forgot-password");
        const rateCheck = checkRateLimit(clientId, 5, 60 * 1000);
        if (!rateCheck.success) {
            return rateLimitExceededResponse(rateCheck.resetAt);
        }

        const body = await req.json();
        const parsed = ForgotPasswordSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0]?.message || 'Valid email is required' },
                { status: 400 }
            );
        }

        const { email } = parsed.data;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Anti-enumeration: return identical success message even if user doesn't exist
        if (!user) {
            return NextResponse.json(
                { success: true, message: 'If that email address is in our database, we will send you an email to reset your password.' },
                { status: 200 }
            );
        }

        // Generate cryptographically secure token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { email },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        await sendPasswordResetEmail(user.email!, resetToken);

        return NextResponse.json(
            { success: true, message: 'If that email address is in our database, we will send you an email to reset your password.' },
            { status: 200 }
        );

    } catch (error) {
        return safeErrorResponse(error, 'An error occurred. Please try again.');
    }
}
