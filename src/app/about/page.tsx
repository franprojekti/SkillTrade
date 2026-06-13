import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about SkillTrade — a privacy-first platform for local skill exchange. No email, no GPS, no ads. Just people swapping skills in their city.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About SkillTrade",
    description: "A privacy-first platform for local skill exchange. No email, no GPS, no ads. Just people swapping skills in their city.",
    url: "/about",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SkillTrade" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About SkillTrade",
    description: "A privacy-first platform for local skill exchange. No email, no GPS, no ads.",
    images: ["/opengraph-image"],
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground hover:opacity-80">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="3" fill="#22C55E" />
              <circle cx="18" cy="6" r="3" fill="#22C55E" />
              <circle cx="12" cy="18" r="3" fill="#166534" />
              <line x1="6" y1="6" x2="18" y2="6" stroke="#22C55E" strokeWidth="1.5" />
              <line x1="6" y1="6" x2="12" y2="18" stroke="#22C55E" strokeWidth="1.5" />
              <line x1="18" y1="6" x2="12" y2="18" stroke="#22C55E" strokeWidth="1.5" />
            </svg>
            SkillTrade
          </Link>
          <Link href="/register" className={buttonVariants({ size: "sm" })}>
            Get Started <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-4">About SkillTrade</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-5 leading-relaxed">
          <p>
            SkillTrade is a platform for local, mutual skill exchange. The idea is simple: everyone
            knows something worth sharing, and everyone has something they want to learn. SkillTrade
            connects people where these overlap.
          </p>
          <p>
            Unlike marketplace platforms, SkillTrade is not about money. There are no payments, no
            credits, and no premium tiers. Two people find each other, agree to exchange knowledge,
            and that&apos;s it.
          </p>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">Why privacy-first?</h2>
          <p>
            Most platforms ask for your email, your phone number, and increasingly your location.
            SkillTrade asks for none of that. You create a username, set a password, and choose what
            you want to share. Your general city is used for matching — your precise location is
            never stored or shown.
          </p>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">How matching works</h2>
          <p>
            When you add skills you offer and skills you want to learn, our algorithm compares your
            profile against others in your area. A strong match means the exchange is genuinely
            mutual — you teach them something, they teach you something back. Scores are based on
            skill overlap, location proximity, and connection preferences.
          </p>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">Safety</h2>
          <p>
            SkillTrade facilitates introductions, not guarantees. When meeting someone in person,
            please use common sense: meet in public places, tell someone where you&apos;re going,
            and trust your instincts. You can block or report any user at any time.
          </p>
        </div>
        <div className="mt-10">
          <Link href="/register" className={buttonVariants()}>
            Create Your Profile <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        {" · "}
        <Link href="/terms" className="hover:underline">Terms</Link>
        {" · "}
        <Link href="/" className="hover:underline">Home</Link>
      </footer>
    </div>
  );
}
