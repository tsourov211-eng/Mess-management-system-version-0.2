// src/components/AuthSessionProvider.tsx
"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

function SessionWatcher() {
    const { status } = useSession();
    const pathname = usePathname();

    // 1. Immediately sign out if status turns unauthenticated on any protected route
    useEffect(() => {
        const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/", "/about", "/contact"];
        const isPublicPage = publicPaths.includes(pathname);

        if (status === "unauthenticated" && !isPublicPage) {
            signOut({ callbackUrl: "/login" });
        }
    }, [status, pathname]);

    // 2. Globally intercept 401 responses to immediately log out if the backend rejects user
    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (response.status === 401) {
                    const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
                    // Don't intercept auth-check attempts during initial login/credentials submission
                    if (!url.includes("/api/auth/callback/credentials") && !url.includes("/api/auth/signin")) {
                        signOut({ callbackUrl: "/login" });
                    }
                }
                return response;
            } catch (err) {
                // Forward the error to caller without unhandled crash in monkey-patch
                throw err;
            }
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    return null;
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider refetchInterval={10} refetchOnWindowFocus={true}>
            <SessionWatcher />
            {children}
        </SessionProvider>
    );
}