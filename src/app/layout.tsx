import type { Metadata } from "next";

import "@/app/globals.css";
import { AppHeader } from "@/components/layout/app-header";

export const metadata: Metadata = {
  title: "Doc LLM Starter",
  description:
    "Production-oriented SaaS starter with Next.js, Auth.js, PostgreSQL, pgvector, background ingestion, and OpenAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
