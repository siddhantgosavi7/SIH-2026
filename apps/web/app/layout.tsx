import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resolve — AI-Powered Grievance Intelligence",
  description:
    "AI-powered grievance management for faster resolution, smarter routing and accountable institutional governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}