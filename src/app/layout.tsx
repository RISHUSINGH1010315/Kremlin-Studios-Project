import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kremlin Studios | Building AI-Powered Brands For The Next Decade",
  description: "We combine creativity, AI, automation, content, design, and technology to help businesses scale faster. Explore our digital agency services or book our luxury Greater Noida Creator Residency.",
  keywords: "Kremlin Studios, AI Agency, Creative Studio, UI/UX Design, Web Development, Next.js, Greater Noida Studio, Creator Residency, Video Editing, AI Automation, Noida, Delhi NCR",
  authors: [{ name: "Kremlin Studios" }],
  icons: {
    icon: "/images/Logo.png",
    shortcut: "/images/Logo.png",
    apple: "/images/Logo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} scroll-smooth`}>
      <body className="bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 min-h-screen flex flex-col overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
