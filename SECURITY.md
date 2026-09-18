# Security policy

## Reporting a vulnerability

If you find a security or privacy issue, please open a
[GitHub security advisory](https://github.com/An-Zamora/signal-triage/security/advisories/new)
or email the maintainer rather than filing a public issue.

Expected first response: **within 5 business days.**

## Scope

signal-triage is a fully static, client-side app. There is no backend, no
database, and no request that carries user-supplied text off the machine
(see [ADR-001 in the architecture spec](./signal-triage-ARCHITECTURE.md)).

The most valuable reports concern:

- Any code path that could cause user-pasted content to leave the browser.
- Any way to bypass the Content-Security-Policy in `index.html`.
- Cross-site scripting via pasted message content.

## What is intentionally out of scope

- The redaction and network-enrichment features described in the spec are **not
  built in v0.1.** Reports about them are premature.
- The heuristic scoring and keyword classification are known to be imperfect by
  design; that is documented, not a vulnerability.
