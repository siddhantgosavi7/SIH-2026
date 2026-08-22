import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resolve — Grievance Intelligence",
  description: "AI-assisted grievance intake, prioritization, and accountability.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
