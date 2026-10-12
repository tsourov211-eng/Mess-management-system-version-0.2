import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
                scope: "openid email profile",
              },
            },
            checks: ["state"],
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required!");
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();

        // Rate limiting: 5 failed attempts per minute per email
        const rateCheck = checkRateLimit(`login:email:${normalizedEmail}`, 5, 60 * 1000);
        if (!rateCheck.success) {
          throw new Error("Too many failed login attempts. Please wait 1 minute before trying again.");
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          throw new Error("Invalid email or password!");
        }

        if (user.role === "suspended") {
          throw new Error("Your account has been suspended! Please contact the admin.");
        }

        if (user.role === "pending") {
          throw new Error("Your account is pending admin approval!");
        }

        if (!user.password) {
          throw new Error("This account was created with Google. Please click 'Continue with Google' or use Forgot Password.");
        }

        const isPasswordValid = await comparePassword(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password!");
        }

        return {
          id: user.id,
          name: user.name || "User",
          email: user.email,
          role: user.role || "member",
          image: user.image && !user.image.startsWith("data:") ? user.image : null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours session
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.trim().toLowerCase();
        if (!email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          if (existingUser.role === "suspended") {
            return "/login?error=Suspended";
          }
          if (existingUser.role === "pending") {
            return "/login?error=PendingApproval";
          }
          return true;
        }

        // New Google user registration -> create in pending state awaiting admin approval
        await prisma.user.create({
          data: {
            name: user.name || "Google User",
            email,
            image: user.image,
            role: "pending",
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
          },
        });

        return "/login?error=PendingApproval";
      }
      return true;
    },
    async jwt({ token, user, trigger, session: updateSession }) {
      // Strip any base64 data URIs so cookie never exceeds HTTP limits
      if (token.picture && typeof token.picture === "string" && token.picture.startsWith("data:")) {
        delete token.picture;
      }
      if (trigger === "update" && (updateSession as any)?.name) {
        token.name = (updateSession as any).name;
      }
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "member";
        if (token.role === "suspended" || token.role === "pending") {
          token.isDeleted = true;
        }
        if (user.name) token.name = user.name;
        token.lastChecked = Date.now();
      } else if (token?.id || token?.email) {
        const now = Date.now();
        const lastChecked = (token.lastChecked as number) || 0;
        // Check DB at most once every 10 seconds per token
        if (now - lastChecked > 10000) {
          try {
            const dbUser = await prisma.user.findFirst({
              where: token.id
                ? { id: token.id as string }
                : { email: token.email as string },
              select: { id: true, role: true, name: true },
            });

            if (!dbUser || dbUser.role === "suspended" || dbUser.role === "pending") {
              token.isDeleted = true;
            } else {
              token.id = dbUser.id;
              token.role = dbUser.role || "member";
              if (dbUser.name) token.name = dbUser.name;
              delete token.isDeleted;
            }
            token.lastChecked = now;
          } catch (err: any) {
            console.warn("JWT db check warning:", err?.message ? err.message.slice(0, 100) : "DB query timeout");
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.isDeleted) {
        return null as any;
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "member";
        if (token.name) {
          session.user.name = token.name as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
