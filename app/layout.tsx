import type { Metadata } from "next";
import { Eczar, Spectral } from "next/font/google";
import "./globals.css";

const eczar = Eczar({
  variable: "--font-eczar",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

export const metadata: Metadata = {
  title: "AstroVeda | Your Daily Cosmic Guide",
  description: "Ancient Vedic wisdom meet modern AI intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${eczar.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
