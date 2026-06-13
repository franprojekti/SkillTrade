import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "SkillTrade Terms of Service.",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance</h2>
            <p>
              By creating an account on SkillTrade, you agree to these Terms of Service. If you do
              not agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Eligibility</h2>
            <p>
              You must be at least 16 years old to use SkillTrade. By registering, you confirm you
              meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Your Account</h2>
            <p>
              You are responsible for keeping your password secure. SkillTrade does not offer password
              recovery by default. If you lose access to your account, you may need to create a new
              one. Do not share your account with others.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use the platform for illegal purposes</li>
              <li>Harass, threaten, or intimidate other users</li>
              <li>Create fake or misleading profiles</li>
              <li>Spam other users with unsolicited messages or connection requests</li>
              <li>Attempt to scrape or extract user data</li>
              <li>Use the platform for commercial solicitation or advertising</li>
              <li>Impersonate another person</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. In-Person Meetings</h2>
            <p>
              SkillTrade may facilitate introductions between users who then choose to meet in person.
              We strongly encourage you to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Meet in a public place for the first time</li>
              <li>Inform a trusted person of your plans</li>
              <li>Trust your instincts about your own safety</li>
            </ul>
            <p className="mt-3">
              SkillTrade is not responsible for any interactions that occur outside the platform,
              including in-person meetings. You use the platform and arrange meetings at your own
              risk.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Content</h2>
            <p>
              You retain ownership of any content you submit (bio, messages, skill descriptions).
              By submitting content, you grant SkillTrade a limited license to store and display it
              to other users as part of the service. You are responsible for everything you post.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Termination</h2>
            <p>
              You can delete your account at any time. We reserve the right to suspend or terminate
              accounts that violate these terms. Deleted accounts cannot be recovered.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Disclaimer</h2>
            <p>
              SkillTrade is provided &ldquo;as is&rdquo; without warranties of any kind. We do not
              guarantee the quality, accuracy, or outcomes of any skill exchange arranged through
              the platform. Use SkillTrade at your own discretion.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">9. Changes</h2>
            <p>
              We may update these terms from time to time. Continued use of the platform after
              changes constitutes acceptance of the new terms.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        {" · "}
        <Link href="/" className="hover:underline">Home</Link>
      </footer>
    </div>
  );
}
