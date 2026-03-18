import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Agent Demo — Live Interactive Showcase",
  description:
    "Live interactive AI agent demo featuring tool use, agentic loops, and streaming. Built with Next.js, TypeScript, and the Anthropic API.",
  openGraph: {
    title: "AI Agent Demo — Live Interactive Showcase",
    description:
      "Live interactive AI agent demo featuring tool use, agentic loops, and streaming.",
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
      <body className={`${inter.className} bg-[#0a0a0f] text-slate-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}
