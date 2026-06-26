# SkillTrade — AI Agent Handover Document

> Last updated: June 2026. Written by Claude Sonnet 4.6 after an extended build session.
> Read this entire document before writing a single line of code.

---

## 1. About Fran (the user)

**Who he is:** Non-technical founder building SkillTrade as a personal experiment project. Not a software engineer — he relies entirely on the AI agent to write, audit, and maintain all code.

**Communication style:**
- Writes in Croatian/Bosnian, often short informal messages (e.g. "popravi sve", "je li to gotovo?", "imas ideje?", "ti odluci")
- Short messages = big scope. "Popravi sve" means "fix everything across the whole codebase."
- Does not explain technical constraints — you are expected to figure them out yourself
- Trusts the AI agent to make all technical decisions autonomously without asking for approval on implementation details
- Common permission phrases: "ti odluci" (you decide), "ti možeš sve" (you can do everything), "napravi" (just do it)

**How to work with Fran:**
- Keep responses **short and direct** — no architecture lectures, no option menus, just act
- Do not ask for clarification on technical choices — make the reasonable call and go
- Translate Croatian questions into intent and execute. Don't wait for English rephrasing.
- When you finish something, say what you did in 1–2 sentences. He reads the diff.
- Respond in Croatian when he writes in Croatian. It's his preferred language.
- He will tell you if you got it wrong. Don't over-confirm before acting.

---

## 2. The Project

**SkillTrade** is a privacy-first, mobile-first web app for local mutual skill exchange. Users declare skills they offer and skills they want to learn, then get matched with nearby people where the exchange is complementary (A teaches B what B wants; B teaches A what A wants).

**Core differentiators:**
- No real identity required — username only, no email shown to user
- No GPS — city/area is self-declared text
- Rule-based SQL matching — no AI API, no paid third-party services
- No profile photos in MVP — initials avatar only
- No password recovery — intentional product decision, warning shown at registration

**Why it exists:** Personal experiment to validate whether local skill exchange can work without payment, social media mechanics, or identity exposure. Zero cost risk is a hard requirement.

---

## 3. Tech Stack

| Layer | Choice | Critical Notes |
|---|---|---|
| Framework | **Next.js 16** App Router + TypeScript | **Breaking changes vs older Next.js — read `node_modules/next/dist/docs/` before writing any Next.js code. APIs and file conventions differ from your training data.** |
| UI | Tailwind CSS + shadcn/ui | `tailwindcss-animate` bundled — `animate-in`, `fade-in-0`, `slide-in-from-bottom-2` work |
| Backend/DB | Supabase — PostgreSQL, Auth, RLS, Realtime | Project ID: `linhydqdjmzpbvpccnxr` |
| Hosting | Vercel (free tier) | Project name: `skilltrade` |
| Language | TypeScript — `npx tsc --noEmit` must pass at 0 errors before any commit |

**Production URL:** `https://skilltrade-henna.vercel.app`
**GitHub:** `https://github.com/franprojekti/SkillTrade` (branch: `main` — single branch, all code here)

---

## 4. Auth Architecture

This is the most unusual part of the stack. **Read carefully.**

- Users register with **username + password only** — no email is collected or shown
- Internally, the app generates a synthetic email: `{normalized_username}@internal.skilltrade.app`
- This synthetic email is used with `supabase.auth.signUp()` / `signInWithPassword()` — the user never sees it
- Username rules: 3–20 chars, lowercase, alphanumeric + underscore only, normalized at registration
- Sessions: HTTPOnly cookies via `@supabase/ssr` — **session-only** (no `maxAge`/`expires`)
- `src/lib/supabase/session-cookie.ts` exports `toSessionOptions()` — strips `maxAge`/`expires` before cookies are set. Used in both `server.ts` and `middleware.ts`. This means: close browser = session ends. Minimize/background app = session persists (correct behavior).
- `src/lib/auth-guard.ts` exports `requireAuth()` — used in all 11 protected server components to get `{ user, supabase }` without duplicating 3-line auth boilerplate

---

## 5. Database Overview

Full schema lives in `supabase/migrations/`. Key tables:

| Table | Purpose |
|---|---|
| `profiles` | 1:1 with `auth.users`. Has `username`, `display_name`, `bio`, `location_city/area/country`, `connection_preference`, `is_active`, `onboarding_completed`, `years_experience` |
| `skills` | Seed skill taxonomy (~150–300 skills). Has `canonical_name`, `slug`, `category`, `aliases`, `status` |
| `user_skills` | Many-to-many: user ↔ skill, with `skill_type` = `'offered'` or `'wanted'` |
| `skill_suggestions` | User-suggested skills not in seed list — `status: pending_review` |
| `connection_requests` | Sender/receiver, status: `pending/accepted/declined/cancelled` |
| `conversations` | Created when connection request is accepted |
| `conversation_participants` | Junction: conversation ↔ user |
| `messages` | Chat messages, `read_at` for receipts |
| `bookmarks` | User saves another user's profile |
| `blocks` | User blocks another user — excluded from ALL queries everywhere |
| `skill_exchanges` | Auto-populated when connection accepted — who teaches whom which skill |
| `notifications` | In-app: connection_request, request_accepted, new_message |

**RLS is ON on all tables.** Never bypass it. Service role key is only used server-side via env var.

**Fuzzy matching:** `pg_trgm` extension installed in `extensions` schema. `get_matches()` RPC uses `word_similarity()` threshold 0.35 — "web" matches "web development". Index: `skills_name_trgm` (GIN).

**Key RPC functions:**
- `get_matches(p_user_id UUID)` — returns scored match list, callable by `authenticated`
- `create_conversation_for_request(p_request_id UUID)` — idempotent, callable by `authenticated`
- `get_blocked_ids(p_user_id UUID)` — internal only, not directly callable via PostgREST

---

## 6. Project File Structure

```
src/
  app/
    (auth)/login/          — login page + server action
    (auth)/register/       — register page + server action
    app/
      dashboard/           — post-login landing page (skill exchange overview)
      matches/             — match feed + [id] profile view
      requests/            — sent/received connection requests
      chat/                — conversation list + [id] individual chat
      saved/               — bookmarked profiles
      profile/             — own profile view + edit/
      onboarding/          — multi-step onboarding wizard
      settings/delete/     — delete account
    not-found.tsx
    globals.css
  components/
    layout/app-nav.tsx     — bottom nav (mobile) + sidebar (desktop)
    ui/skill-selector.tsx  — searchable skill picker with "Add X" suggestion flow
    ui/initials-avatar.tsx — colored avatar from username initial
  lib/
    supabase/
      server.ts            — createClient() for server components
      middleware.ts        — updateSession() — route protection + onboarding check
      client.ts            — createClient() for client components
      session-cookie.ts    — toSessionOptions() — strips maxAge/expires
    auth-guard.ts          — requireAuth() — used in all 11 protected pages
    format.ts              — getDisplayName(), formatLocation(), formatConnectionPref()
  types/
    database.ts            — full Supabase type definitions (keep in sync with DB)
middleware.ts              — root middleware, calls updateSession()
supabase/migrations/       — all SQL migrations (001–023+)
public/sw.js               — service worker (PWA)
src/app/manifest.ts        — PWA manifest (Next.js App Router style)
```

---

## 7. Routing Logic (middleware.ts)

The middleware in `src/lib/supabase/middleware.ts` handles:
1. Unauthenticated user hits `/app/*` → redirect to `/login`
2. Authenticated user hits `/login` or `/register` → redirect to `/app/dashboard`
3. Authenticated user with `onboarding_completed = false` hits `/app/*` (not onboarding) → redirect to `/app/onboarding` (with session cookie copy so auth survives redirect)

**Post-auth landing page is `/app/dashboard`** — not `/app/matches`. The dashboard replaced matches as the default landing.

---

## 8. Vercel Deploy — Critical Rule

**Git commit email MUST be `franprojekti@gmail.com`** (the GitHub account email).

If commits are made with any other email (e.g. `fran1004krasnic@gmail.com`), Vercel rejects ALL deploys with: "commit email could not be matched to a GitHub account".

Fix if broken:
```bash
git config user.email "franprojekti@gmail.com"
# Then amend or create a new commit and push
```

Always check `git config user.email` before pushing if there's been any config change.

---

## 9. Android APK

The app is also packaged as an Android APK via **PWABuilder** (TWA wrapper — no native code, it's just the web app in a Chrome shell).

- Use the **"Other Android"** tab on PWABuilder, NOT "Google Play" (Google Play tab gives 500 errors)
- Local Bubblewrap project: `C:\Users\Fran\Desktop\SkillTrade-APK\`
- Keystore: `android.keystore`, alias: `android`, password: `skilltrade123`
- To rebuild: open PowerShell → `cd C:\Users\Fran\Desktop\SkillTrade-APK` → run Bubblewrap build → enter password when prompted
- Java: JDK 25 system-wide (Temurin), Bubblewrap uses its own JDK 17 at `C:\Users\Fran\.bubblewrap\jdk\`
- **Session behavior in TWA:** "Exit to home screen" = app backgrounded (Chrome process alive, session persists — correct, same as browser tab). "Swipe away from recents" = Chrome process killed, session-only cookie deleted = logout on next open. This is intentional and correct.

---

## 10. Problems We Hit & How We Solved Them

### 10a. Vercel blocking all deploys
**Problem:** Every push failed with "commit email could not be matched to a GitHub account."
**Cause:** Git `user.email` was set to `fran1004krasnic@gmail.com` but GitHub account uses `franprojekti@gmail.com`.
**Fix:** `git config user.email "franprojekti@gmail.com"` → fix commit → push.

### 10b. Supabase SECURITY DEFINER functions callable by anyone
**Problem:** Linter showed all 8 SECURITY DEFINER functions (trigger functions + RPC) were callable via PostgREST by anon and authenticated roles.
**Cause:** PostgreSQL grants `EXECUTE TO PUBLIC` on every new function by default. `REVOKE FROM anon` doesn't strip it — you must `REVOKE FROM PUBLIC`.
**Fix:** Migration `007_revoke_public_execute.sql` — `REVOKE FROM PUBLIC` on all 8 functions, then `GRANT` back only `get_matches` and `create_conversation_for_request` to `authenticated`.

### 10c. RLS performance warnings (auth.uid() per-row re-evaluation)
**Problem:** Every policy used bare `auth.uid()` which PostgreSQL re-evaluates per row.
**Fix:** Replace all `auth.uid()` with `(select auth.uid())` in every RLS policy — evaluated once per query.

### 10d. Duplicate profiles SELECT policies
**Problem:** Two permissive SELECT policies on `profiles` — both evaluated on every read.
**Fix:** Merged into one: `USING (is_active = TRUE OR (select auth.uid()) = id)`.

### 10e. Silent failures swallowing DB errors
**Problem:** Several pages had `const { data, error } = await supabase.from(...)` where `error` was never checked — DB failures rendered as empty lists with no explanation.
**Files affected:** `matches/page.tsx`, `requests/page.tsx`, `chat/[id]/chat-view.tsx`, `actions/ensure-conversation.ts`
**Fix:** Added error state UI and/or `throw error` after logging.

### 10f. TypeScript cast proliferation from wrong `get_matches` return type
**Problem:** `database.ts` had wrong column names (`user_id`, `score`) but actual RPC returns `out_user_id`, `out_score` etc. Caused `as unknown as MatchRow[]` casts everywhere.
**Fix:** Updated `Functions.get_matches.Returns` in `database.ts` to use correct `out_*` prefixed names. Removed all casts.

### 10g. Bubblewrap APK build failing with Gradle OOM
**Problem:** Local APK build with Bubblewrap failed — Gradle ran out of memory.
**Fix:** Added `-Xmx512m` to `gradle.properties` in the APK project dir.

### 10h. Skill matching too strict (exact ID match only)
**Problem:** "web" and "web development" never matched because the SQL used exact `skill_id` comparison.
**Fix:** Added `pg_trgm` extension + `word_similarity()` with 0.35 threshold in `get_matches()`. Also added GIN index `skills_name_trgm` for performance.

### 10i. Category required to suggest new skills
**Problem:** Users had to pick a category when suggesting a skill they couldn't find. Friction point.
**Fix:** Removed category requirement. `SkillSelector` now shows "Add '[typed text]'" option directly — clicks immediately create the skill with `category = 'Other'`, no modal.

### 10j. Resend connection request blocked forever
**Problem:** Once a declined or cancelled connection request existed between two users, they could never reconnect (UNIQUE constraint `(sender_id, receiver_id)`).
**Fix:** Migration `023_connection_requests_resend.sql` — allows resending when existing request status is `declined` or `cancelled` (either direction). Uses `ON CONFLICT DO UPDATE`.

---

## 11. Behavioral Guidelines for Future AI Agents

### Always do before writing Next.js code
Read `node_modules/next/dist/docs/` for the relevant feature. This is Next.js 16 — conventions differ from what your training data covers.

### TypeScript must compile
Run `npx tsc --noEmit` before declaring any task complete. 0 errors is the bar.

### RLS is the security model
Never write a query that bypasses RLS. Never expose service role key client-side. Blocked users must be excluded from **every** query — use `get_blocked_ids()` RPC or filter manually.

### One branch — main
No feature branches, no PRs. Fran works directly on main. Commit and push.

### Migrations are numbered sequentially
Check `supabase/migrations/` to find the last migration number. Next one is +1. Never reuse numbers.

### Session-only cookies — don't break this
`toSessionOptions()` in `src/lib/supabase/session-cookie.ts` strips `maxAge` and `expires` from all auth cookies. If you touch `server.ts` or `middleware.ts` cookie handling, make sure it still calls `toSessionOptions()`.

### auth-guard pattern
All protected server components use `requireAuth()` from `src/lib/auth-guard.ts`. It returns `{ user, supabase }`. Don't duplicate the 3-line auth check pattern — use the helper.

### Format utilities exist
`src/lib/format.ts` has `getDisplayName()`, `formatLocation()`, `formatConnectionPref()`. Use them. Don't inline the same logic again.

### Dashboard is the home
After login, after registration, after onboarding — user lands on `/app/dashboard`. Not `/app/matches`.

### Memory before /compact
Before running `/compact` or when the session gets long — update the memory files in `C:\Users\Fran\.claude\projects\C--Users-Fran-Desktop-SkillTrade\memory\` with anything new. Fran sometimes misses the window to save state.

---

## 12. Product Decisions (Do Not Change Without Asking)

- **No password recovery** — intentional, not a bug. Warning shown at registration.
- **No profile photos in MVP** — initials avatar only.
- **No AI API** — matching is rule-based SQL only. Zero cost risk.
- **No real email** — synthetic internal email pattern only. Users never see it.
- **UI and all code in English** — Fran communicates in Croatian but the app itself is English.
- **All UI in English** — even though Fran writes in Croatian, every label, button, error message in the app is English.
- **Delete account cascades everything** — user data fully removed, no soft-delete.

---

## 13. What's Been Built (as of June 2026)

Complete MVP. These features are done and working:
- Auth (register + login with username/password, synthetic email, no recovery)
- Onboarding wizard (5 steps: display name, location, skills offered, skills wanted, review)
- Matching feed with fuzzy skill matching (`/app/matches`)
- Individual match/profile view with connection request action
- Connection requests (send, accept, decline, cancel, resend after decline)
- Chat with Supabase Realtime (`/app/chat` + `/app/chat/[id]`)
- Saved/bookmarks with mutual bookmark detection
- Block user (excluded from all queries)
- Dashboard with skill exchange stats (`/app/dashboard`)
- Profile view + edit (display name, role/bio, years experience, location, skills)
- Delete account (cascade wipe)
- PWA manifest + service worker + Android APK via PWABuilder
- Notifications (in-app: new message, new request, request accepted)
- Full RLS on all tables, security hardening (REVOKE FROM PUBLIC, search_path, etc.)

---

*This document is the ground truth for what exists and why. When in doubt, read the code. When the code conflicts with this document, trust the code — it was written later.*
