import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
// No custom font — uses system font stack defined in CSS

export const metadata: Metadata = {
  title: "CineNova — Your Personal Movie Universe",
  description: "Netflix-grade AI-powered movie recommendations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#141414] text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
