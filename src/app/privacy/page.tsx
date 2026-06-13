import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "SkillTrade collects only your username, general city, and declared skills — no email, no GPS, no ad tracking. Read our full privacy policy.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | SkillTrade",
    description: "SkillTrade collects only your username, general city, and declared skills — no email, no GPS, no ad tracking.",
    url: "/privacy",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SkillTrade" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | SkillTrade",
    description: "SkillTrade collects only your username, general city, and declared skills — no email, no GPS, no ad tracking.",
    images: ["/opengraph-image"],
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center">
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
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">What we collect</h2>
            <p>SkillTrade collects only what is necessary to run the service:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Your chosen username</li>
              <li>A hashed version of your password (never stored in plaintext)</li>
              <li>Your optional display name and bio</li>
              <li>Your general location (city and area — not GPS coordinates)</li>
              <li>Skills you declare as offered or wanted</li>
              <li>Messages you send to connected users</li>
              <li>Connection requests, bookmarks, blocks, and reports you create</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">What we do not collect</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Your real name</li>
              <li>Your email address (unless you provide one for optional password recovery)</li>
              <li>Your phone number</li>
              <li>Your precise GPS location</li>
              <li>Any payment information</li>
              <li>Social media accounts or login data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">How we use your data</h2>
            <p>Your data is used only to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Authenticate you when you sign in</li>
              <li>Match you with compatible users based on skills and location</li>
              <li>Enable chat between connected users</li>
              <li>Show your profile to other users on the platform</li>
              <li>Process blocks, reports, and notifications</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or share your data with third parties for advertising or
              analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Data visibility</h2>
            <p>
              Your username, display name, general location, and skills are visible to other
              authenticated users of the platform. Your bio is visible after you choose to share it.
              Your messages are only visible to you and the person you are chatting with.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Data retention and deletion</h2>
            <p>
              You can delete your account at any time from the Settings page. When you delete your
              account, all your profile data, skills, messages, bookmarks, blocks, and reports are
              permanently removed from our systems. This action is irreversible.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Security</h2>
            <p>
              Passwords are hashed using industry-standard algorithms. Sessions are managed using
              secure, HTTPOnly cookies. Row-level security is enforced at the database level,
              ensuring users can only access data they are authorized to see.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Contact</h2>
            <p>
              For questions about this policy or your data, you can reach us through the platform.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
        {" · "}
        <Link href="/" className="hover:underline">Home</Link>
      </footer>
    </div>
  );
}
