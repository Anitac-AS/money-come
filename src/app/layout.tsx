import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { MobileShell } from "@/components/layout/mobile-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Money",
  description: "Minimal, fast personal finance tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable}`} style={{ background: '#FFFFFF' }}>
        <div className="flex min-h-svh w-full justify-center" style={{ background: '#FFFFFF' }}>
          <div className="relative flex min-h-svh w-full max-w-md flex-col" style={{ background: '#FFFFFF' }}>
            <MobileShell>{children}</MobileShell>
          </div>
        </div>
      </body>
    </html>
  );
}
