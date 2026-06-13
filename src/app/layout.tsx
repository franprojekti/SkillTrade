import type { Metadata } from "next";
import { Geist_Mono, Inter, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const manropeHeading = Manrope({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SkillTrade",
    template: "%s | SkillTrade",
  },
  description:
    "Connect with people nearby to exchange skills and knowledge. Find someone who knows what you want to learn.",
  keywords: ["skill exchange", "learning", "skill trade", "local", "knowledge sharing"],
  openGraph: {
    title: "SkillTrade",
    description:
      "Connect with people nearby to exchange skills and knowledge.",
    type: "website",
    siteName: "SkillTrade",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark h-full", geistMono.variable, "font-sans", inter.variable, manropeHeading.variable)}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-right" richColors expand={false} visibleToasts={1} />
      </body>
    </html>
  );
}
