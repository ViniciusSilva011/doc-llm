import type { Metadata } from "next";

import "@/app/globals.css";
import { AppHeader } from "@/components/layout/app-header";

export const metadata: Metadata = {
  title: "DocWise",
  description:
    "Document AI workspace for uploading PDFs, indexing knowledge, and asking grounded questions.",
  icons: {
    icon: [
      {
        url: "/newimage.png",
        type: "image/png",
        sizes: "1254x1254",
      },
    ],
    apple: [
      {
        url: "/newimage.png",
        type: "image/png",
        sizes: "1254x1254",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <AppHeader />
        <main className="py-8 md:py-10">{children}</main>
      </body>
    </html>
  );
}
