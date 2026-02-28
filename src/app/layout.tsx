import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "카페 키오스크",
  description: "카페 주문 키오스크",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
