import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Watchlist",
  description: "Custom stock watchlist for research",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

