# signal-triage — Architecture & Security Specification

**Status:** draft v1 for implementation
**Author:** Andres Zamora
**Purpose of this document:** a self-contained spec. Someone who reads only this should be able to build the thing without asking follow-up questions.

---

## 1. What this is

A browser tool that takes a batch of customer support messages and turns them into a ranked list of product themes.

It exists to make one argument concrete: **the loudest theme in a support inbox is usually not the most important one.** The tool ranks the same data two ways and lets you flip between them.

It is a decision aid for prioritisation. It is not an analytics product, a ticketing system, or a replacement for talking to customers.

---

## 2. Goals and non-goals

**Goals**

- Group free-text support messages into themes without configuration.
- Score each theme on reach, severity, and strategic fit — where fit is a human input, not a computed value.
- Let the user toggle between "rank by volume" and "rank by priority" and see the ordering change.
- Be readable end to end by a reviewer in under twenty minutes.
- Handle potentially sensitive input safely by default.

**Non-goals**

- No accounts, no login, no multi-user state.
- No server-side persistence of user-supplied text. Ever.
- No integrations with helpdesk platforms in v1. (Zendesk/Intercom import is a v3 idea, and it changes the threat model — see §6.6.)
- No claim of statistical rigour. The scoring model is a heuristic and the UI says so.

---

## 3. The constraint that drives everything

Support messages are **other people's words about their own problems**. Depending on the product they came from, a single pasted batch can contain names, email addresses, phone numbers, billing details, and — for anything in the clinical or wellness space — health information about identifiable third parties.

The user pasting that text is usually not thinking about any of this. They are thinking about their backlog.

So the architecture does not try to *protect* that data well. It tries to **never be in a position to leak it**, which is a stronger guarantee and a much smaller thing to get right.

Everything in §4 follows from this.

---

## 4. Architecture decisions

### ADR-001 — Zero backend. The app is a static bundle.

All parsing, clustering, and scoring run in the browser. There is no server, no database, no request that carries user text off the machine.

**Why:**
- Eliminates the entire class of at-rest and in-transit breach risk for user content. There is no store to breach and no transport to intercept.
- No secrets to manage, which removes the most common way a portfolio repository embarrasses its author.
- Deployable to GitHub Pages at zero cost with no operational surface.
- "Your messages never leave your browser" is simultaneously the security posture, the privacy policy, and the product pitch. One sentence covers all three.

**Cost accepted:** no cross-device sync, no shared workspaces, no server-side model. All acceptable for the stated purpose.

### ADR-002 — Deterministic clustering is the default and the only required path.

Theme assignment and severity classification run on a local, inspectable rule set — keyword and pattern matching over a domain lexicon. No network call is required for the core loop.

**Why:**
- Works offline, works instantly, works for every visitor with no consent prompt and no account.
- Deterministic output is testable. A pure function from message list to scored themes can be unit tested; an LLM call cannot be, not meaningfully.
- A reviewer can read the lexicon and disagree with it. That is a feature — it makes the judgment visible rather than hiding it behind a model.
- Honest framing: the clustering is the cheap part of this problem. The scoring model and the fit control are where the thinking is.

### ADR-003 — Any AI enrichment is a pluggable adapter behind an interface, disabled by default.

Define one interface:

```ts
interface ThemeEnricher {
  readonly id: string;
  readonly requiresNetwork: boolean;
  enrich(groups: ThemeGroup[], signal: AbortSignal): Promise<EnrichmentResult>;
}
```

Ship `LocalEnricher` (no-op / lexicon-based) as the default. Any network-backed enricher is opt-in, per-session, and off unless the user explicitly turns it on.

**Hard rules for any network enricher:**

1. **Redaction runs first and is not optional.** Text passes through the redaction pipeline (§6.3) before it is serialised into a request body. No code path sends raw input.
2. **No API key ever ships in the repo, the bundle, or the build.** Not in a `.env` that gets committed, not in a Vite `VITE_`-prefixed variable — those are inlined into client JS and are public by definition. Write this warning in the code comment next to the adapter.
3. **No shared key.** Do not proxy other people's usage through a key you pay for. That is an unbounded cost liability and an abuse vector. If a hosted mode is ever wanted, it needs auth and rate limiting, which contradicts ADR-001 — so it is out of scope.
4. **Bring-your-own-key only**, held in memory for the session, never written to `localStorage`, never logged, cleared on unload.
5. The UI states plainly, before the first call, what will be transmitted and to whom.

If any of this feels like too much friction, the correct move is to ship without the network enricher. The tool is complete without it.

### ADR-004 — React + TypeScript + Vite, with a deliberately small dependency tree.

**Why React:** your resume claims React, and a reviewer who opens the repo is cross-checking that claim. A vanilla build would have a marginally smaller supply-chain surface, but the security story here is carried by "no backend, no egress, no secrets" — not by avoiding a UI framework.

**Dependency policy:** React, React DOM, Vite, TypeScript, Vitest. That is close to the whole list. Every additional runtime dependency is a supply-chain decision, so each one needs a line in the README explaining why it earned its place. No component library, no state manager, no date library, no lodash.

---

## 5. System design

```
src/
  domain/              ← pure, no DOM, no network, fully unit tested
    types.ts             Message, ThemeGroup, Severity, ScoredTheme
    lexicon.ts           theme definitions + severity patterns (data, not logic)
    classify.ts          message → themeId, message → severity
    score.ts             reach × severity × fit, ranking comparators
    redact.ts            PII detection and masking
  enrich/
    types.ts             ThemeEnricher interface
    local.ts             default, no network
    remote.ts            optional, BYO-key, redaction-gated
  ui/
    App.tsx
    SourcePanel.tsx      paste area, sample loader, message count
    ThemeList.tsx        ranked list + the sort toggle
    ThemeDetail.tsx      breakdown, fit slider, source messages
    Caveats.tsx          "what this does not tell you"
  fixtures/
    sample-messages.ts   synthetic, clearly labelled
  main.tsx
```

**The layering rule:** `domain/` imports nothing from `ui/` or `enrich/`. It has no side effects. This is what makes the scoring model testable and what lets a reviewer read the logic without reading the interface.

**Data flow:** raw text → `parse` → `Message[]` → `classify` → `ThemeGroup[]` → `score` (+ user fit values) → `ScoredTheme[]` → sorted by the active comparator → rendered.

State lives in one `useReducer` in `App.tsx`. Fit values are a `Record<themeId, number>`. No global store.

---

## 6. Security and privacy

### 6.1 Threat model

| Threat | Vector | Mitigation |
|---|---|---|
| User content leaks to a third party | Any outbound request carrying input | ADR-001: no backend. No analytics, no telemetry, no fonts-with-logging, no error reporting service. The only egress is the opt-in enricher, which is redaction-gated. |
| XSS via pasted content | Support text rendered into the DOM | React escapes by default. **`dangerouslySetInnerHTML` is banned repo-wide** — add an ESLint rule for it so this is enforced, not remembered. |
| Secret committed to history | `.env`, key pasted into source | `.gitignore` covers `.env*`; gitleaks in CI; GitHub secret scanning + push protection enabled on the repo. |
| Malicious dependency | Transitive npm package | Minimal tree, lockfile committed, Dependabot on, `npm audit` gating CI, exact version pinning. |
| User accidentally publishes sensitive data | Screen sharing, screenshots in a demo | Redaction toggle (§6.3) that masks PII in the rendered view, not just before transmission. |
| Stored content on a shared machine | Browser persistence | Nothing user-supplied is written to `localStorage`, `sessionStorage`, or IndexedDB. UI preferences only — and document that distinction in the README. |

### 6.2 Content Security Policy

Ship a restrictive CSP as a `<meta http-equiv>` in `index.html`, since GitHub Pages does not let you set headers:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'none';
```

`connect-src 'self'` is what mechanically enforces ADR-001 — with it in place, the deterministic build *cannot* make an outbound call even if a dependency tried to. If the optional enricher is built, that build variant widens `connect-src` to exactly one origin and no more.

Self-host any web font. A Google Fonts link is a request to a third party carrying the visitor's IP and referrer on every page load, which contradicts the privacy claim in the README.

### 6.3 The redaction module

`domain/redact.ts` — pure functions, heavily tested. This is the most interesting module in the repo and the one a reviewer should be pointed at.

Detect and mask:

- Email addresses → `[email]`
- Phone numbers, several international formats → `[phone]`
- Long digit runs that look like card or account numbers → `[number]`
- URLs with query strings → `[link]`
- Capitalised name-like tokens following salutations (`Hi Sarah,` → `Hi [name],`)

**Be explicit in the README about what this does not catch.** Free-text health disclosures, addresses, and unusual name formats will pass through. Name detection by capitalisation is crude and will produce false positives on proper nouns. Overstating a redaction tool's coverage is worse than not shipping one, because it manufactures false confidence. Say so in the docs.

Two independent switches:
- **Redact on display** — for demos and screen sharing. Default off.
- **Redact before send** — for the optional enricher. Default on, **and not user-disableable.**

### 6.4 Repo hygiene

- `LICENSE` — MIT.
- `SECURITY.md` — how to report an issue, expected response time. Short.
- `PRIVACY.md` or a README section — what the app does and does not do with input, in plain language.
- `CONTRIBUTING.md` only if you actually want contributions. An unloved one is noise.
- Branch protection on `main`; CI required before merge.
- No `.env.example` containing anything that resembles a real key format.

### 6.5 CI

GitHub Actions on push and PR: typecheck → lint → test → build → gitleaks → `npm audit --audit-level=high`. A green badge on the README is a small thing that signals care.

### 6.6 If helpdesk import is ever added (v3)

It breaks ADR-001. OAuth tokens need somewhere to live, which means a backend, which means everything above is renegotiated. Do not bolt it on. Treat it as a different product with its own threat model, and say so in the roadmap rather than leaving it implied.

---

## 7. The scoring model

```
priority(theme) = reach × avgSeverity × fit
```

- **reach** — count of distinct senders in the group. Distinct *senders*, not messages: one person sending five emails is one person, and conflating those is how a squeaky wheel captures a roadmap.
- **avgSeverity** — mean of per-message severity. `blocked = 3`, `friction = 2`, `wish = 1`.
- **fit** — user-set, `0` to `1.5`, default `1.0`. Setting `0` marks the theme "not doing it" and removes it from the ranking while leaving it visible in the list.

**Two design decisions worth defending in a README:**

1. **Fit is not computed.** Reach and severity are countable; whether something belongs in the product is a judgment. Putting it behind a visible control keeps the judgment in the open instead of laundering it through a formula.

2. **Severity is inferred from wording, and that is a known weakness.** A polite report of a billing failure scores below an irritated complaint about a font. Document the flaw rather than hiding it. A reviewer trusts a model whose author names its failure mode more than one presented as sound.

---

## 8. Testing

Vitest. Coverage where it earns its keep, not everywhere.

- `score.test.ts` — ranking flips when fit changes; zero fit removes a theme; ties break predictably.
- `classify.test.ts` — known messages land in expected themes; ambiguous ones land in `unsorted` rather than being forced.
- `redact.test.ts` — the important one. Positive cases per pattern, **and explicit negative cases documenting what gets through.** Those failing-by-design cases are the tests a reviewer will actually read.

Skip UI snapshot tests. They cost maintenance and demonstrate nothing here.

---

## 9. README requirements

The README is the artifact most reviewers actually read. It needs, in order:

1. One sentence on what it does, one on why.
2. A screenshot or GIF of the sort toggle flipping the ranking. **This is the whole pitch — put it above the fold.**
3. Live demo link.
4. "Your data never leaves your browser," with a one-line explanation of how that is enforced (the CSP), not just asserted.
5. The scoring model, written out.
6. **A "Limitations" section** — selection bias, customers reporting solutions rather than problems, severity-from-wording, redaction gaps.
7. Local setup: three commands.
8. Why each runtime dependency is present.

The Limitations section is not modesty. It is the part that reads as professional judgment rather than portfolio polish.

---

## 10. Phasing

**v0.1 — the core.** Deterministic pipeline, sort toggle, fit slider, sample fixtures, domain tests, CSP, CI, README. This is already a complete, defensible project. Ship it and stop if time is short.

**v0.2 — privacy surface.** Redaction module with both toggles, plus copy-to-clipboard export of the ranked output.

**v0.3 — optional enrichment.** BYO-key adapter under ADR-003's rules. Only if v0.2 is genuinely finished.

Resist the urge to start at v0.3. A tight v0.1 with real tests and an honest README beats a half-built v0.3 in every review, and it matches the "ship the MVP, don't perfect it" instinct this is being built to demonstrate.

---

## 11. Open questions for you to settle before implementation

1. **Repo name.** `signal-triage` is the working title. Whatever you pick, it goes in your resume header eventually, so pick something you would say out loud.
2. **Domain lexicon.** The current themes are drawn from clinic and practice-management software. Keep it domain-specific, or make the lexicon user-editable and domain-agnostic? Editable is more useful and more work; domain-specific tells a sharper story.
3. **Does the network enricher get built at all?** Your call. Shipping without it is the stronger security posture and the weaker "I work with AI" signal.
4. **Public or private repo at first?** Private until v0.1 is green, then flip. Public history of a half-finished first commit is not a problem, but a public repo with no README for two weeks is.
