// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/AuthSessionProvider"; // 👈 Imported with correct path
import { SWRProvider } from "@/components/SWRProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OurMess",
  description: "A smart mess management system", 
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}>
        {/* Wrapped entire body with SessionProvider and SWRProvider */}
        <AuthSessionProvider>
          <SWRProvider>
            {children}
          </SWRProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}