import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ChatAssistant } from "@/components/chat-assistant";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Mache",
  description: "Marketplace internationale centrée sur Haïti, la Caraïbe et la diaspora."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={inter.variable}>
        <Header />
        {children}
        <Footer />
        <ChatAssistant />
      </body>
    </html>
  );
}
