import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const artific = localFont({
  src: "../public/fonts/artific-font-family/artifictrial-semibold.otf",
  variable: "--font-display",
  weight: "600",
  display: "swap",
});

const satoshi = localFont({
  src: [
    {
      path: "../public/fonts/satoshi-font/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/satoshi-font/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "my·tv — Live television, without the noise",
  description: "Browse live television channels from around the world.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${artific.variable} ${satoshi.variable}`}
    >
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
