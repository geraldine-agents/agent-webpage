import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import VisitTracker from "@/components/VisitTracker";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Geraldine Lomeli — AI & ML Engineer",
  description:
    "Portfolio of Geraldine Lomeli, AI & ML Engineer specializing in agentic systems, LangChain, LangGraph, Groq, RAG, and MLOps.",
  openGraph: {
    title: "Geraldine Lomeli — AI & ML Engineer",
    description:
      "Portfolio of Geraldine Lomeli, AI & ML Engineer specializing in agentic systems, LangChain, LangGraph, Groq, RAG, and MLOps.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable} font-sans bg-[#0a0a0f] text-slate-200 antialiased`}>
        {children}
        <Analytics />
        <VisitTracker />
      </body>
    </html>
  );
}
