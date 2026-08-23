import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GIOP — Grievance Intelligence & Orchestration Platform",
  description: "The campus grievance system that understands itself. Classify, prioritize, and route every complaint across every department.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
