import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SkillTrade — Exchange Skills with People Near You",
  description:
    "Trade skills with people in your city. Teach what you know, learn what you want — no money, no middleman. SkillTrade matches you based on complementary skills and location.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SkillTrade — Exchange Skills with People Near You",
    description: "Trade skills with people in your city. Teach what you know, learn what you want — no money, no middleman.",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SkillTrade" }],
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/app/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Sign In
            </Link>
            <Link href="/register" className={buttonVariants({ size: "sm" })}>
              Get Started <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight mb-5">
            Trade skills with people<br className="hidden sm:block" /> near you
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Teach what you know. Learn what you want. No money, no middleman — just two people swapping knowledge.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Create Your Profile <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/about" className={buttonVariants({ variant: "outline", size: "lg" })}>
              How It Works
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-card/50">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <h2 className="text-2xl font-bold text-foreground text-center mb-12">How it works</h2>
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {[
                {
                  step: "1",
                  title: "Create your profile",
                  desc: "Add skills you can teach and skills you want to learn. Choose your city and how you prefer to meet.",
                },
                {
                  step: "2",
                  title: "Get matched",
                  desc: "Our algorithm finds people where the exchange is genuinely mutual — you teach them something, they teach you something back.",
                },
                {
                  step: "3",
                  title: "Exchange knowledge",
                  desc: "Connect, chat, and arrange how you want to meet. In person or online — your choice.",
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center flex-shrink-0">
                    {step}
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy callout */}
        <section className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-foreground mb-3">Privacy-first, always</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No email required. No GPS. No ads. You sign up with a username, pick a city, and that&apos;s it.
            Your data is used only to match you with compatible people — nothing else.
          </p>
          <Link href="/privacy" className="mt-4 inline-block text-sm text-primary hover:underline">
            Read our Privacy Policy →
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <Link href="/about" className="hover:underline">About</Link>
        {" · "}
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        {" · "}
        <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </div>
  );
}
