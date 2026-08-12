import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Money — Assets, Liabilities & Goals",
  description:
    "A simple app to track what you own, what you owe, and your money goals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50">
        <Nav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
