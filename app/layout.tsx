import type { Metadata } from "next";
import "./globals.css";
import { DemoBanner } from "./components/demo-banner";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "KOSEN BOOKS", template: "%s | KOSEN BOOKS" },
  description: "木更津高専生の学びたい気持ちと、図書の支援をつなぐ場所です。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
