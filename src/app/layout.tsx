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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skilltrade.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SkillTrade — Exchange Skills with People Near You",
    template: "%s | SkillTrade",
  },
  description:
    "Trade skills with people in your city. Teach what you know, learn what you want — no money, no middleman. SkillTrade matches you based on complementary skills and location.",
  keywords: ["skill exchange", "learn new skills", "teach skills", "skill swap", "local learning", "knowledge sharing", "skill trade"],
  openGraph: {
    title: "SkillTrade — Exchange Skills with People Near You",
    description:
      "Trade skills with people in your city. Teach what you know, learn what you want — no money, no middleman.",
    type: "website",
    siteName: "SkillTrade",
    url: SITE_URL,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SkillTrade" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillTrade — Exchange Skills with People Near You",
    description: "Trade skills with people in your city. Teach what you know, learn what you want.",
    images: ["/opengraph-image"],
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
