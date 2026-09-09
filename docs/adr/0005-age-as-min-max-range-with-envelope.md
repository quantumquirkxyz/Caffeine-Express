# Age as a min–max range with envelope reconciliation

Status: accepted
Date: 2026-09-09

## Context

Field language expresses age as a band, not a point: a collaborator says "around 8–10 years old", "about eight", "six years old", or "relatively new". The challenge brief itself models age as *"Approximate age or installation year"* and its customer view shows *"Approx. Age 4–10 years"*. A future reader might model age as a single point figure, which forces a false-precision pick whenever the source is a band; or might store age *and* installation year as two competing fields. The renewal question (threshold, default 8 years) then becomes ambiguous: does "4–10 years" fire or not?

## Decision

**Age** is an inclusive min–max range in years: min is the youngest plausible value, max the oldest. An exact figure is the degenerate range min = max ("six years old" → 6–6); approximations widen it ("about eight" → 7–9, "8–10" → 8–10, "relatively new" → a low young range). A manufacturing/installation year read from a plate is a proxy that derives the range, never the Age itself, and is not stored as a second field — it stays in Evidence.

Installed equipment reconciles Age as the **envelope**: the inclusive union of the reporting ranges — min of all reported mins, max of all reported maxs — never dropping information. When an independent report's range does not overlap the current envelope, the record carries a derived **conflicting observation** marker surfaced on the dashboard until a deciding report or photo widens or confirms the envelope; the record State is unaffected (the State stays provenance-based, ADR 0003).

Renewal fires when the envelope's **min** reaches the tuning threshold (default 8 years); "older than N" queries use the same min semantics. Unknown age does not qualify.

## Consequences

- Positive: no false precision; renewal decisions are traceable to the evidence band; silent overwrites become explicit "verify" markers; a single Age dimension keeps queries, dedup, and confidence coherent.
- Negative: the schema carries a range instead of a scalar; visualizations must decide how to plot the band; the extractor must map vague phrases to plausible bounds, which calls for stable defaults.
- Follow-up: settle the extraction rules that translate fuzzy wording ("looks relatively new") into bounded ranges; keep the renewal threshold as a tuning parameter, not a domain constant.