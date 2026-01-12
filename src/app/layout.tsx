import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { MobileShell } from "@/components/layout/mobile-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "錢來了 MoneyIn",
  description: "輕鬆掌握每一筆支出",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/ios/32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/ios/192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/ios/512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/ios/180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  themeColor: "#FF8B7B",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
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
