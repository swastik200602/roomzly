# Roomzly — Interview-Ready Refactor Plan

**Author:** Swastik Singh · **Prepared:** 2026-09-08 · **Target:** SDE-1 (full-stack) interviews
**Repo:** `roomzly-hub` (Frontend: TanStack Start · Backend: Express 5 + Prisma) · **Live:** roomzly.in

---

## How to read this document

This is an execution plan **you** run — not a script to follow blindly. Every item has a **Why** so you can defend the decision in an interview, because the point of this project is not that it works, it's that you can explain *why it's built the way it is*. Work top-to-bottom: phases are ordered by risk and by what an interviewer notices first.

Legend: 🔴 Critical (do first — these actively hurt you) · 🟠 High (interviewers grill this) · 🟡 Medium (polish) · 🟢 Low (nice-to-have).
Effort tags: `S` ≈ <2h · `M` ≈ half-day · `L` ≈ 1–2 days.

---

## 1. Verdict — where Roomzly actually stands

The honest one-line summary, and the exact framing to use in an interview:

> **"Roomzly has a genuinely strong core — real refresh-token rotation, a well-modeled Prisma schema, an opinionated dark design system — but the execution outran the architecture. I'm refactoring to make the whole thing as solid as its best parts."**

This is a **"good bones, messy execution"** project, not a vibe-coded toy. That distinction matters: it means the fixes are surgical, not a rewrite, and the story you tell is one of *engineering maturity* (I found the problems myself and fixed them) rather than *starting over*.

**What's genuinely strong (lead with these — don't hide them):**

- **Auth is senior-level.** bcrypt cost-12, 15-min access / 7-day refresh tokens, refresh-token **rotation** with SHA-256-hashed storage and reuse-invalidation, httpOnly+SameSite cookies scoped to the auth path, `ADMIN` self-registration blocked, sessions wiped on password reset. Google OAuth does real RS256 JWKS signature verification — not a blind `jwt.decode`.
- **Prisma schema is textbook.** 18 models, 9 enums, `cuid` PKs, composite indexes tuned to query patterns (`Booking @@index([propertyId, status, checkIn])`), deliberate `onDelete` policies, `Decimal(12,2)` for money.
- **The backend is a clean layered modular monolith** — routes → controller → service → Zod schema per feature. 0 occurrences of `any`, `console.*`, or `@ts-ignore` in `src/`.
- **Real ops touches:** `/health` + `/ready` (probes Postgres + Redis, returns 503 if degraded), centralized error middleware, consistent `{success,data}` / `{success,error}` response envelope, graceful Redis degradation, CSV-injection escaping.
- **The frontend design system has real taste** — a dark "architectural" language with `Inter Tight` display type, mono eyebrows, hairline borders, custom skeletons and blur-up images. Not untouched shadcn.

**What drags it down (the "current problems" you asked me to identify):**

1. 🔴 A **real production UI-freeze bug**, band-aided at runtime instead of fixed at the source.
2. 🔴 A **SPA-vs-SSR identity crisis** — the app can't answer "is this server-rendered?", which nullifies all the SEO work.
3. 🔴 **Fake tests + misleading CI/README** — the most dangerous part for credibility, because it reads as *deliberately misleading* rather than incomplete.
4. 🔴 **Live secrets sitting in `Backend/.env`** on the demo machine (never committed — but real and must be rotated).
5. 🟠 **God components** — `listing.$slug.tsx` is 1,158 lines; five route files exceed 500.
6. 🟠 **Template DNA leaking through** — "villa/loft/concierge/portfolio" luxury-real-estate copy in a Dehradun student-housing app.
7. 🟠 **A design system that's defined but not enforced** — 109 native `<button>`s vs 2 uses of the `<Button>` component; 66 hardcoded colors the theme file explicitly forbids.
8. 🟠 A **broken flagship chart** (invalid `hsl(oklch(...))` CSS) and **CTAs that fail WCAG contrast**.

---

## 2. Metrics snapshot (grounds every claim below)

| Signal | Value | Meaning |
|---|---|---|
| Backend `src` LOC | 5,259 across 60 files | Reasonable, well-split — except 2 god-services |
| Frontend hand-written LOC | 14,974 across 127 files | Fine total; concentrated in a few huge files |
| Largest frontend file | `listing.$slug.tsx` — **1,158 LOC** | Must be decomposed |
| Frontend files > 500 LOC | **6** | God-component smell |
| Native `<button>` vs `<Button>` | **109 vs 2** | Design system bypassed ~98% of the time |
| Hardcoded colors (`text-white`/`bg-white`/`bg-black`) | **66** | Violates the theme's own "all colors are tokens" rule |
| Arbitrary Tailwind values (`-[...]`) | **291** across 51 files | Weak spacing scale discipline |
| `focus-visible` occurrences | **9** (vs 197 `hover:`) | Keyboard a11y largely missing |
| `any` in hand-written FE code | **3 real** (rest in generated file) | Good, actually |
| `as never` search casts | **12** | Silences TanStack Router's type safety |
| Meaningful tests (whole repo) | **~2** (of 7 claimed) | README badge says "7 Passed" |
| Total commits | 21 over ~3 months | Tests/CI/badges bolted on in the last few |

---

## 3. The refactor, phased

### Phase 0 — Stop the bleeding (do before showing anyone) 🔴

These are the items that actively damage you in an interview or demo *right now*.

#### 0.1 Rotate the leaked credentials · `S`
`Backend/.env` contains **real, currently-valid** secrets: Supabase DB password, both JWT secrets, Cloudinary API secret, a Gmail app password, and the Upstash Redis token. Good news: `.env` was **never committed** (verified — git history is clean, and `.gitignore` is correct). But these are live credentials on a machine you use for demos and screen-shares.

**Do:** Rotate all six now (Supabase DB password, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, Cloudinary secret, Gmail app password, Upstash token). Keep only placeholders in a local `.env`; confirm production reads them from Railway-injected env vars (your `.env.production.example` already models this correctly). **Never open `Backend/.env` during a live demo.**

**Why:** "Walk me through your env setup" is a common question. Real secrets on screen is an instant judgment hit, and a leaked JWT secret means auth forgery. Rotating costs 20 minutes and removes the risk entirely.

#### 0.2 Fix the production freeze at the source, then delete the band-aid · `M`
**Root cause (confirmed from source):** `RouteTransition.tsx:8` wraps routes in `<AnimatePresence mode="wait">` keyed on `pathname`. On navigation it **unmounts the outgoing route — and any open Radix Dialog inside it — mid-animation.** Radix sets `body { pointer-events: none; overflow: hidden }` for its scroll-lock/focus-trap; when the dialog is torn down abruptly, its cleanup effect races the unmount and those styles get **stuck**, freezing the entire page. `InteractionRecovery.tsx` is the band-aid: it force-resets `body.style.pointerEvents`, `overflow`, and strips `aria-hidden`/`inert` on every navigation and on every global `focusin`/`pointerdown`.

**Do (pick the cleanest, in order of preference):**
1. Ensure any open dialog **closes before navigation completes** — drive dialog `open` state off route state, or close all dialogs in a `router.subscribe(...beforeLoad...)` hook. Then the unmount never races Radix cleanup.
2. Alternatively, stop unmounting during transitions: don't key `AnimatePresence` on `pathname` in a way that unmounts a subtree containing a live modal, or drop `mode="wait"` in favor of a crossfade that doesn't block.
3. Once the source is fixed, **delete `InteractionRecovery.tsx` entirely** and remove `scripts/probe-production-freeze.mjs` + `scripts/debug-renderer-freeze.mjs` from `package.json`.

**Why:** This is the single best story in the whole project. "I had a production freeze. Instead of the runtime band-aid that was force-mutating the DOM on every navigation, I traced it to Radix's scroll-lock cleanup racing Framer Motion's exit-unmount, and fixed the lifecycle ordering." That is a *senior* debugging narrative. Shipping the band-aid is the opposite signal — "treats symptoms, not causes." Leaving the two CDP debug scripts in `package.json` advertises that you never found the root cause.

#### 0.3 Resolve the SPA-vs-SSR identity crisis · `M`
`index.html` + `main.tsx` boot a **pure client SPA** (`createRoot(...).render(<RouterProvider/>)`), yet `server.ts`/`start.ts` implement a **full TanStack Start SSR entry** that either never runs or runs in a second, inconsistent mode. `__root.tsx` has no `shellComponent`/document. So a crawler gets an empty `<div id="root">`, which **nullifies every bit of SEO work** (`SeoManager`, JSON-LD, per-route meta, the college landing pages).

**Do:** Pick one and commit.
- **If SPA (simplest, lowest risk):** delete `server.ts` + `start.ts`, drop `@tanstack/react-start`, and rely on the `firebase.json` SPA rewrites you already have. Then be honest that SEO is via pre-rendering/meta only.
- **If SSR (higher ceiling, better story):** render through the Start server entry with a root document component, delete `main.tsx`/`index.html`'s manual mount, and verify the crawler sees real HTML.

**Why:** "Is this SSR or SPA?" is the *first* question an interviewer asks about a TanStack Start repo, and right now the codebase can't answer it. Committing to one — and knowing the trade-off (SPA = simpler deploy, worse SEO/first-paint; SSR = better SEO/TTFB, more infra) — turns a red flag into a talking point.

#### 0.4 Delete the fake tests; make the ones you keep real · `M`
`Backend/src/modules/bookings/bookings.test.ts` **re-implements** `nightsBetween` and `hasOverlap` *inside the test file* instead of importing them — and `hasOverlap` doesn't even exist in the service (overlap is an inline Prisma `WHERE`). So the test asserts against a hand-copied duplicate; if you break the real overlap query, the test stays green. The README badge advertises "7 Passed"; only ~2 are meaningful (`colleges.test.ts`).

**Do:** Extract the real domain logic — `computeNights(checkIn, checkOut)` and a pure `overlaps(a, b)` predicate — out of `bookings.service.ts`, have the service *use* them, and import *those* in the test. Delete the local re-implementations. (Full testing strategy in Phase 3.)

**Why:** "Show me your booking-overlap test" opens this file and reveals the function was copied into the test. That reads as *knowingly gaming the test count* — worse than having no tests. Fixing it converts your headline feature ("date-conflict-safe reservations") from *faked* to *verified*.

#### 0.5 Fix the misleading README badges & Render/Railway contradiction · `S`
The README has hardcoded static badges: `Tests-7 Passed`, `Operational`, `200 OK`, `Ready`, `6 Listings` — none live. The CI badge points at repo slug `roomzly` but the clone URL is `roomzly-hub` (renders broken). README says the backend is on **Render** (`roomzly-backend.onrender.com`); the only deploy config in the repo is **Railway** (`railway.json`), and the docs describe Railway too. The CI even builds the frontend against the Render URL.

**Do:** Remove all hardcoded status/test badges; keep only the live GitHub Actions badge with the correct slug. Pick one host (Railway, since the config exists) and make README + `docs/PRODUCTION_DEPLOYMENT.md` + CI env all agree. Stop advertising `/api-docs` until the OpenAPI spec has real paths (see 3.4).

**Why:** Badges are the first thing an interviewer's eye lands on. Once they catch one fake badge, they distrust the entire README — and by extension the project. Honest, minimal badges read as *more* senior than a wall of green shields.

---

### Phase 1 — Architecture & correctness 🟠

The stuff you'll be grilled on in a code walkthrough.

#### 1.1 Break up the god components · `L`
Six files exceed 500 LOC. Priority order:

- **`listing.$slug.tsx` (1,158)** → extract `PropertyGallery`, `BookingWidget`, `ReviewsSection`, `ReportDialog`, `ShareDialog`; co-locate each one's query/mutation. One `ListingPage` currently owns 5 mutations, 3 gallery implementations, 3 dialogs, a reviews form, and a booking calendar.
- **`dashboard.add-property.tsx` (500)** + **`dashboard.edit-property.$id.tsx` (668)** → they duplicate the same `Field` component, `toPayload()`, `furnishingToApi()`, and validation. Hoist a shared `usePropertyForm` hook + `propertyFormSchema` (Zod) + `<PropertyFields>` into a `features/property/` folder. (See 1.4.)
- **`dashboard.messages.tsx` (534)** → extract `useThreadSocket(threadId)` and `useMessagesQuery`; split `ThreadList` / `MessagePane`. Socket lifecycle (join/leave/typing/read-receipts) is currently tangled inline with render.
- **`dashboard.admin.tsx` (619)** → split the 5 sub-panels into components; replace `window.prompt` moderation inputs (see 1.6).

**Why:** An interviewer walking your code needs to *find the booking logic in under 30 seconds*. A 1,158-line component is untestable and unreviewable; decomposition is the clearest signal you understand separation of concerns.

#### 1.2 Use TanStack Router loaders instead of fetching in every component · `M`
No route uses a `loader`; every page fetches via `useQuery` inside the component body, and `router.tsx` sets `defaultPreloadStaleTime: 0`. You're paying for the framework's headline feature (parallel prefetch on hover/preload, no request waterfalls) and not using it — every navigation flashes a spinner.

**Do:** Move primary fetches into route `loader`s via `queryClient.ensureQueryData` with shared query keys; keep `useQuery` in the component for hydration/reactivity. Fix `edit-property` while you're there — it currently fetches *the entire owner list* and `.find()`s the one listing instead of calling a detail endpoint (O(n) over-fetch + breaks deep-links).

**Why:** "You chose TanStack Router — why? What does its loader model give you over fetching in `useEffect`?" You want to answer that with code that *demonstrates* the answer, not contradicts it.

#### 1.3 Fix backend pagination & the race-prone code generator · `M`
- `properties.service.ts:267-282` — when a `college`/`studentFriendly` filter is active, it does `findMany({ take: 200 })` then filters/sorts/slices **in JS**. Beyond 200 rows, results and `meta.total` are silently wrong. Push the geo-bounds and student-friendly score into the SQL `where`/`orderBy` so the DB paginates.
- `properties.service.ts:77-80` — `createPropertyCode` uses `count()+1`, which races under concurrency (two creates → same code → 500) and counts soft-deleted rows. Use a DB sequence, `cuid`, or retry on Prisma `P2002`.

**Why:** "Does your pagination scale? What happens at 10,000 listings?" is a standard system-design probe. The in-memory cap is exactly the anti-pattern they're testing for.

#### 1.4 Establish a shared domain-types + feature-folder structure · `M`
Types are redefined across files; furnishing has *two* conflicting enums (display strings `"Semi-furnished"` vs API `SEMI_FURNISHED`), forcing ad-hoc mappers in both form files. `resolveApiBase()` is copy-pasted in `client.ts` and `socket.ts`.

**Do:** Create `src/features/{property,booking,auth,messaging}/` co-locating components + hooks + types per domain. Add one canonical `types/domain.ts` (or generate types from the backend Zod schemas). Export a single `getApiBase()` and one `qs()` query-string helper. Add a `getErrorMessage(err)` helper to replace the 29 repeated `instanceof ApiError` blocks.

**Why:** Consistency is the cheapest way to look senior. One source of truth for the property contract means create/update can't silently drift.

#### 1.5 Turn the design system back on: route everything through `<Button>` · `M`
109 native `<button>`s vs 2 uses of the existing, well-built `<Button>` (which already has `cva` variants + `focus-visible:ring`). Add an `accent` variant, then migrate. This single change also fixes most of the keyboard-focus gap (Phase 2).

**Why:** This is *the* consistency red flag reviewers grep for. It means padding/sizing/disabled/focus behavior drift per file, and the accessibility baked into the component is bypassed.

#### 1.6 Kill placeholder-grade UI · `S`
`dashboard.admin.tsx` uses `window.prompt()` for rejection/resolution reasons (blocking, unstyled, untestable). `dashboard.tsx:196` has a header search box with no `value`/`onChange` — pure decoration. Replace the prompts with a Radix Dialog + controlled textarea; wire or remove the dead search.

**Why:** Non-functional and `window.prompt` UI are classic "demo-ware" tells that undercut the polish elsewhere.

#### 1.7 Address the N+1s and god-services (backend) · `M`
`messages.service.ts:27-35` runs one `count` per thread; `users.service.ts:119-133` creates notifications one-per-admin in a loop; `createUniqueSlug` loops with a `findUnique` per collision. Split the 605-line `properties.service.ts` and 583-line `admin.service.ts` into querying / reviews / verification sub-services.

**Why:** Fine at demo scale, but "where are your N+1s?" is a common probe — name and fix them before they do. `groupBy` for counts, `createMany` for notifications.

---

### Phase 2 — UI/UX redesign 🟠

The "looks vibe-coded" problem. The bones are good; the fixes are about **enforcement, contrast, and killing template DNA.** Full design spec in §4.

#### 2.1 Fix the broken flagship chart · `S` — *highest effort-to-impact in the whole plan*
`dashboard.index.tsx` and `dashboard.analytics.tsx` set SVG `stroke`/`fill` to `hsl(var(--accent))`, but the tokens are **oklch** strings — `hsl(oklch(...))` is invalid CSS, so the browser drops the color and renders near-black lines on a near-black background. The owner revenue chart is effectively blank.

**Do:** Use the vars directly — `var(--color-accent)` / `var(--color-border)`, no `hsl()` wrapper. ~6 lines across 2 files.

#### 2.2 Fix CTA contrast + commit to one brand color · `M`
White text on the accent blue is **3.7:1** — fails WCAG AA (needs 4.5:1). This is your *main* action color (hero Search, Book Now, login Continue). Meanwhile the logo/OG image use an orphan **lime** that disagrees with the blue UI.

**Do:** Adopt a single accent with a **dark foreground** (see §4 palette) so button text is near-black on a bright fill — instantly ~9:1. Regenerate logo, favicon, and OG image to match. This one change fixes both the accessibility failure and the "blue-SaaS-template with a random lime logo" look.

#### 2.3 Purge the template DNA · `M`
The loudest "generated" tell. Rewrite luxury-real-estate language for Dehradun students: Navbar "Locations→villa" / "Concierge→dashboard", login "Premium Real Estate · Since 2026 / Member access / Your portfolio is waiting", dashboard "Portfolio performance". Fix the taxonomy — retire villa/loft/commercial; lead with **Room / PG / Hostel / Flat / Shared**. Replace London/NYC/Tokyo stock photos and the generic auth-mosaic with real Dehradun listing photos. Delete dead assets (a 2.4MB and a 2.6MB unused PNG ship in the repo).

#### 2.4 Enforce tokens, focus, and rhythm structurally · `L`
Replace the 66 hardcoded colors with theme tokens (start with the auth pages, the worst offenders). Add a global `:focus-visible` ring in the base layer (fixes the 9-vs-197 gap at once). Ship shared `<Section>` and `<PageHeader>` primitives to enforce one `<h1>` per page (several pages have 2–4), one radius, and the 4px spacing scale — so the 291 arbitrary values can't creep back.

**Why (all of Phase 2):** Your framing is *"the design system was strong but under-enforced and inherited template DNA — I unified the tokens, fixed contrast/a11y, and rewrote the domain language for Dehradun students."* That's a design-maturity story, not a "I made it prettier" story.

---

### Phase 3 — Testing, CI & docs 🟠

Currently the most *dangerous* area because it overclaims. Fixing it is high-ROI: honest, real signals read as senior.

#### 3.1 Write ~25 meaningful tests · `L`
Tools you already have installed: **Vitest** + **Supertest** (Supertest is currently a dead dependency — never imported). Add `@vitest/coverage-v8` and publish a *real* number.

Priority order (by interview signal):

1. **Auth (~6):** password hash/verify, JWT sign/verify, refresh-token rotation invalidates the old token, login rejects bad creds, RBAC guard allows/denies by role. *This is your headline security feature — it must be real.*
2. **Bookings (~5, integration via Supertest + a test Postgres):** create computes nights + `Decimal` total server-side; a second overlapping request returns 400; owner can't book own property; confirm/cancel authorization. *Kills the fake-test problem from 0.4.*
3. **RBAC middleware (~3):** RESIDENT/OWNER/ADMIN guards.
4. **Zod validation (~3):** malformed payloads rejected.
5. **CSV export escaping (~2):** formula-injection strings (`=cmd`, `+`, `@`) neutralized. Small, high-signal.
6. **Frontend (~4):** Zustand auth store login/logout/persist, wishlist add/remove, one react-hook-form + Zod validation test.

#### 3.2 Make CI do what it claims · `M`
The backend CI job is named "Backend **Lint**, Typecheck & Tests" but there's **no lint step and no ESLint installed** in the backend. The frontend job only builds — no lint/typecheck/test, despite ESLint being installed there.

**Do:** `npm ci` (not `npm install`) everywhere. Backend: add ESLint + config (or rename the job honestly), a dedicated `tsc --noEmit` typecheck, and a `services: postgres:16` container for integration tests. Frontend: add `eslint` + `tsc --noEmit` + `vitest` jobs. Fail the PR on any failure — only then does the green badge mean something.

#### 3.3 Make the README honest · `S`
Remove the self-graded "82/100 readiness score", the published demo passwords (`Password123!` for all three roles — at minimum don't seed a real ADMIN with a known password), and any claim not backed by code. Add an honest "Testing" section stating real coverage and what's *not* covered. **Honesty reads as senior; overclaiming reads as junior.** The docs' existing self-aware disclaimer ("the codebase does not show an in-product AI integration") is a good model — more of that.

#### 3.4 Make `/api-docs` real or stop advertising it · `M`
Swagger is mounted but scans for `@openapi` JSDoc annotations of which there are **zero** — the served spec has no paths. Either annotate ~6 core routes, or generate the spec from your existing Zod schemas with `zod-to-openapi`.

---

## 4. Design direction spec (for Phase 2)

Keep the bones — dark-first, `Inter Tight` display, mono eyebrows, hairline borders. Fix color, type roles, and content.

**Palette — commit to ONE accent with a dark foreground (fixes contrast instantly):**

| Role | Hex | Note |
|---|---|---|
| Background | `#0E1116` | keep near-black |
| Surface | `#151A21` | one-step elevation |
| Foreground | `#F7F8F8` | |
| Muted text | `#9AA3AE` | ≥5:1 on bg |
| **Accent (brand)** | **`#F4B740`** amber-gold | warm, "home"; dark text on it → ~9:1 |
| Accent-foreground | `#0E1116` | near-black text on amber |
| Success / Verified | `#2FBF71` | trust cue for verified badges |
| Destructive | keep existing red | |

If you'd rather keep blue: use it only as a secondary/info color and make the *brand* accent the amber, or darken blue to `oklch(0.52 0.19 255)` with white text. Either way: **one** accent, and logo/OG/favicon must match it.

**Type:** cap body at two weights (400/500), display at 700–800, mono 500. You currently ship four active weights on body text. Define named size utilities (`text-display-xl`, `text-eyebrow`) so arbitrary `text-[10px]` disappears.

**Radius/shadow:** standardize `rounded-sm` (4px) for buttons/inputs/cards, `rounded-full` only for avatars/pills. Brutalist = borders, not shadows — define one `--shadow-pop` for overlays only; forbid `shadow-2xl` elsewhere.

**Focus (global base layer):**
```css
:where(a, button, input, select, textarea):focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

---

## 5. Suggested sequencing

You have ~4 hrs/day. A realistic order that front-loads the highest-signal wins:

**Week 1 — Credibility & correctness.** Phase 0 in full (rotate secrets, fix freeze, resolve SPA/SSR, real tests, honest README). By end of week the project *tells the truth* and the scariest bug is gone. This is the week that matters most before any interview.

**Week 2 — Architecture.** 1.1 (decompose `listing.$slug`), 1.2 (loaders), 1.5 (`<Button>` migration), 1.4 (feature folders + shared types). Do 2.1 (chart fix — 15 min) opportunistically.

**Week 3 — UI/UX.** 2.2 (accent + contrast), 2.3 (purge template DNA), 2.4 (tokens/focus/rhythm). This is the week the "vibe-coded" perception dies.

**Week 4 — Depth signals.** Finish Phase 3 (full test suite, real CI, `/api-docs`), 1.3 (pagination), 1.7 (N+1s). Polish the README architecture section and a short "engineering decisions" write-up.

Do each change on its own branch with a clear Conventional Commit — the commit history itself becomes evidence of how you work.

---

## 6. Interview talking points (prep these answers)

The refactor only pays off if you can narrate it. Rehearse these:

- **"Tell me about a hard bug."** → The freeze. Radix scroll-lock cleanup racing Framer Motion's exit-unmount; traced from a runtime symptom to a lifecycle-ordering root cause; deleted the band-aid.
- **"Is this SSR or SPA, and why?"** → Whichever you chose in 0.3, with the trade-off (SEO/TTFB vs deploy simplicity).
- **"How do you prevent double-booking?"** → Server-side date-range overlap predicate inside an atomic transaction; pricing computed server-side with `Decimal`; and *now* it's covered by a real integration test.
- **"How does auth work?"** → Dual-token, refresh **rotation** with hashed storage + reuse invalidation, httpOnly cookies. This is your strongest area — own it.
- **"What would you improve?"** → Pagination scaling (the in-memory cap), the N+1s, splitting the two god-services. Naming your own weaknesses is a senior signal.
- **"Why TanStack Router/Query?"** → Type-safe search params + loader prefetch; and after 1.2, your code actually uses them.

---

## 7. What NOT to do

- **Don't rewrite from scratch.** The core is good; a rewrite throws away your best evidence and your strongest stories.
- **Don't add features.** Interview-readiness is about *depth and honesty* on what exists, not surface area.
- **Don't over-format the README with more badges.** Fewer, honest signals beat a wall of green shields.
- **Don't chase 100% test coverage.** ~25 *meaningful* tests on auth/booking/RBAC beat 200 trivial ones.
