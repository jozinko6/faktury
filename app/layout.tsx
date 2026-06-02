import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uctovnik MVP",
  description: "Slovensky fakturacny a uctovny system pre prve MVP kroky."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}
