# Plan — Landing Page Improvements (vs Qship)

> Compared our marketing landing (`apps/web/app/(marketing)/page.tsx`, 252 LOC, 1 file) to
> Qship's (`QshipLanding`, 13 sections, ~2,500 LOC + a 2,152-line CSS) on 2026-06-30.
>
> **Strategy:** Do NOT clone their 13 sections — that's ~2,500 LOC of pure parity work with no
> margin. Add only the sections that (a) **prove the product works** and (b) **showcase our AI
> moat** (multi-provider + BYOK + ensemble/critic + injection hardening) that their OpenAI-only
> copy cannot claim. Reach "finished SaaS" feel in ~1 day, not a week.
>
> **Tags:** `PAR` = reach good-enough parity · `EDGE` = where we beat them (invest here).

---

## 0. What we already have (keep — it's good)
- Gold-on-dark hero with badge, dual CTA, trust line ("No credit card / 2 min / cancel").
- `HeroOrbitalGraphic` animated visual.
- 5 feature cards.
- `CoreLoop` component (the pipeline).
- Final CTA + footer.
- Animated background grid + glow blobs.

Our taste is fine. The gap is **product proof + completeness + scroll polish**, not styling.

---

## 1. Section-by-section gap

| Section | Qship has | We have | Action |
|---|---|---|---|
| Sticky nav w/ anchors | ✅ | basic header | 4.2 (PAR) |
| Hero | ✅ animated, 552 LOC | ✅ good | keep |
| Logo / tech marquee | ✅ | ❌ | optional |
| "How it works" numbered process | ✅ | partial (CoreLoop) | 2.1 (PAR) |
| **PR-review showcase** (real AI review card) | ✅ | ❌ | **2.2 (EDGE)** |
| **Agent demo teaser** | ✅ | ❌ | **2.3 (EDGE)** |
| Integrations strip | ✅ | ❌ | 2.4 (PAR) |
| Capabilities / "What you can do" | ✅ | ~feature cards | covered |
| **AI-engine differentiator section** | ❌ (single-model) | ❌ | **2.5 (EDGE — our win)** |
| FAQ | ✅ | ❌ | 2.6 (PAR) |
| Social proof / testimonials | ✅ | ❌ | optional (don't fake) |
| Scroll-reveal animation | ✅ | ❌ | 4.1 (PAR polish) |
| CTA + footer | ✅ | ✅ | keep |

---

## 2. High-value sections to ADD (ordered by impact)

### 2.2 — PR-review showcase  ⭐ EDGE · 🟡
The single most valuable addition. Qship shows a mock GitHub PR with an AI review comment
("Missing rate limit on export endpoint", "Audit log not written"). It makes the abstract
product concrete in one glance.
- [ ] Build a `<ReviewShowcase>` card: a fake-but-realistic PR header + a structured AI review
      comment with BLOCKING/NON_BLOCKING badges, file paths, and suggestions.
- [ ] **Our twist (the margin):** label it "Reviewed by 2 models + critic" and show a second
      "Critic verified" line. Qship's card can only show one model. This visually proves our
      ensemble/critic edge on the landing page itself.
- [ ] Pull the visual language from our real review UI so it feels authentic.

### 2.3 — Agent demo teaser  ⭐ EDGE · 🟡
- [ ] A static (or lightly animated) chat snippet showing the ShipFlow/MetroFlow agent calling a
      tool ("Triage all submitted features" → action card). Link to `/agent`.
- [ ] We just built B2 (task walkthrough) + the agent surface — feature it here.

### 2.5 — "Built on a multi-model engine" section  ⭐ EDGE · 🟢
**This section is our unfair advantage — Qship cannot write it.**
- [ ] A short band: "Most tools bet on one model. MetroFlow drafts across Anthropic, OpenRouter,
      Google & OpenAI, then a critic model audits the result. Bring your own key — encrypted,
      never stored in plaintext."
- [ ] Three mini-cards: **Multi-provider** · **Critic-audited** · **BYOK (AES-256-GCM)**.
- [ ] Zero new infra — it describes code we already shipped (`lib/ai.ts`, `lib/crypto.ts`).

### 2.1 — "How it works" numbered process  PAR · 🟢
- [ ] A 5-step horizontal/vertical numbered strip: Request → PRD → Tasks → AI Review → Human
      Approval → Ship. (We have `CoreLoop`; either restyle it as numbered steps or add a compact
      version above it.)

### 2.4 — Integrations strip  PAR · 🟢
- [ ] A simple row of logos/labels: GitHub, Razorpay, Slack/Discord, Anthropic/Claude, Inngest.
      Signals "real integrations," low effort.

### 2.6 — FAQ  PAR · 🟢
- [ ] 5–6 accordion items: "Is it a code generator?" (no — an operator), "Which models?",
      "Can I use my own key?", "How does the human gate work?", "Pricing?". Reuse to plant the
      BYOK/multi-model messaging again.

---

## 3. Implementation notes
- Keep everything in the existing `(marketing)` route; add components under
  `apps/web/components/marketing/` to avoid bloating one file.
- Reuse existing tokens (`--primary` gold, the glow/grid background) — do NOT introduce a new
  design system. Match the current hero styling.
- Prefer CSS/SVG over a heavy animation lib. One small `useInView` reveal hook covers 4.1.
- All new sections are static/presentational — no API calls, no new server code.

---

## 4. Polish

### 4.1 — Scroll-reveal — PAR · 🟢
- [ ] A tiny `useReveal` (IntersectionObserver) hook that fades/translates sections in. Apply to
      each new section. Big perceived-quality jump for ~30 LOC.

### 4.2 — Sticky nav with section anchors — PAR · 🟢
- [ ] Add anchor links (How it works · Review · Agent · Pricing · FAQ) to `MarketingHeader`,
      smooth-scroll, subtle shadow on scroll.

---

## 5. Explicitly NOT doing (avoid parity waste)
- ❌ A 2,000-line bespoke CSS file. Use Tailwind + existing tokens.
- ❌ Fake testimonials/customer logos (dishonest; judges see through it).
- ❌ Rotator / marquee / flow-connector eye-candy unless time is free.
- ❌ Cloning all 13 sections. Five well-built sections > thirteen thin ones.

---

## 6. Definition of done
- [ ] Landing has: Hero → How it works → **PR-review showcase (ensemble-branded)** → **Agent
      teaser** → **Multi-model engine band** → Integrations → FAQ → CTA.
- [ ] Sections fade in on scroll; nav anchors work.
- [ ] The multi-model/BYOK story appears in at least 2 places (engine band + FAQ) — our one
      claim Qship can't match.
- [ ] `npm run build` clean; no new server code.

---

## 7. Suggested order & effort
1. 2.5 engine band 🟢 → 2. 2.1 process 🟢 → 3. 2.4 integrations 🟢 → 4. 2.6 FAQ 🟢 →
5. 2.2 PR-review showcase 🟡 → 6. 2.3 agent teaser 🟡 → 7. 4.1 reveal + 4.2 nav 🟢.

**Total: ~1 focused day.** Order puts the cheap text/layout sections first (immediate
completeness) and the two visual EDGE pieces (PR showcase, agent teaser) after, since they carry
the most weight but take longer.

> Verdict: our landing doesn't need a rewrite — it needs **product proof** (2.2/2.3) and **our
> AI-moat story** (2.5), plus FAQ/integrations/reveal for finish. That closes the "looks like an
> MVP" gap without burning a week cloning their 13 sections.
