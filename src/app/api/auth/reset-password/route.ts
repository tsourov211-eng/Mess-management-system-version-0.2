import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, safeErrorResponse } from '@/lib/security';
import { ResetPasswordSchema } from '@/lib/validations';
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        // 1. Rate Limiting: 5 requests per minute
        const clientId = getClientIdentifier(req, "reset-password");
        const rateCheck = checkRateLimit(clientId, 5, 60 * 1000);
        if (!rateCheck.success) {
            return rateLimitExceededResponse(rateCheck.resetAt);
        }

        const body = await req.json();
        const parsed = ResetPasswordSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0]?.message || 'Invalid reset parameters' },
                { status: 400 }
            );
        }

        const { token, password } = parsed.data;

        // Find user with valid token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gte: new Date(), // Check if token has not expired
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired password reset token' },
                { status: 400 }
            );
        }

        // Hash the new password with bcrypt cost 12
        const hashedPassword = await hashPassword(password);

        // Update user password and invalidate reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return NextResponse.json(
            { success: true, message: 'Password has been reset successfully' },
            { status: 200 }
        );

    } catch (error) {
        return safeErrorResponse(error, 'An error occurred while resetting password. Please try again.');
    }
}
