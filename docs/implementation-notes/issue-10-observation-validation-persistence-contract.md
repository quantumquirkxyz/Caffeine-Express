# Implementation note — Issue #10: Observation validation and persistence contract

**Branch:** `feat/issue-10-observation-validation-persistence-contract`
**Status:** implemented, validated, awaiting review (KerubeDev)

## What changed

The MVP data plane now enforces the Observation contract defined by the parent
spec (#3), the glossary in `CONTEXT.md`, and ADRs 0002, 0003, 0005, and 0007.

- `src/domain/provenance.ts` — per-field provenance vocabulary
  (Confirmed > Reported > Estimated > Unknown) with firmness ordering and
  worst-case (`leastFirm`) derivation.
- `src/domain/modality.ts` — canonical Modality vocabulary (MRI, CT, Ultrasound,
  X-Ray, Patient Monitoring, Image Guided Therapy, Other) plus alias
  normalization (`MR` → `MRI`, `US` → `Ultrasound`, …); unknown terms return
  `null` instead of inventing a modality.
- `src/domain/site.ts` — `Client` and `Site` value objects (Site inherits its
  Client, city, and country).
- `src/domain/age.ts` — inclusive min–max Age range (`AgeRange`), `null` = Age
  Unknown, `exactAgeYears`/`approximateAgeYears` helpers. Approximate years
  widen into a band (`7` → `6–8`), preserving uncertainty instead of a false
  point figure.
- `src/domain/use.ts` — explicit operating hours with an optional period,
  kept distinct from Age.
- `src/domain/observation.ts` — the Observation aggregate: per-field
  provenance, derived record State (worst-case), and the strict four-field
  observation key (Site × Modality × brand × model). `observationKeyEquals`
  never matches a partial key, per ADR 0002.
- `src/validation/observation.schema.ts` — the validation seam. `ObservationInput`
  is the accepted extraction-shaped contract (QVAC ticket #5 must produce this
  shape); Zod validation turns it into a persisted `Observation`. Missing
  required Age → `Unknown`; malformed input is rejected with a structured
  `ObservationValidationError` and nothing is invented.
- `src/store/observation-store.ts` + `src/store/memory-observation-store.ts` —
  the persistence contract (`save`/`findById`/`findByKey`/`all`) with an
  append-only in-memory implementation for tests and MVP seeding.
- `src/fixtures/synthetic.ts` + `src/fixtures/seed.ts` — 20 reproducible
  fictional fixtures (DemoCare Clients/Sites, 10 fictional countries/cities,
  6 fictional manufacturers, fictional models) mirroring the hackathon
  workbook, and a loader that validates every row through the contract before
  persisting. `MR` → `MRI`, approximate scalar age → inclusive range, missing
  brand/model stays `Unknown`.

## Acceptance criteria → evidence

| Criterion | Evidence |
|---|---|
| Observation supports Client/Site, Modality, brand, model, quantity, required Age, Use, Comment, per-field provenance, and record State | `Observation` type + `recordState` (`src/domain/observation.ts`), tests in `observation.test.ts`; Comment excluded from State per glossary |
| Age uses an inclusive min–max range or `Unknown` | `AgeRange | null` (`age.ts`); missing age → `null` + provenance `Unknown` (`observation.schema.test.ts`) |
| Use stores explicit hours with an optional period | `Use { hours, period }` (`use.ts`); period optional/nullable; reversed period rejected |
| Malformed extraction is rejected without invented values | `behavior observation.schema.test.ts`: zero/negative/fractional quantity, reversed/negative/text age, unknown modality, empty brand/model, negative hours, confidence labels as provenance, bad date format all rejected |
| Synthetic fixtures are fictional and reproducible | `seed.test.ts`: 20 rows, known fictional brands, DemoCare-only clients/sites, deterministic under a fixed clock |

## Validation performed

- `npm run typecheck` — clean.
- `npm run build` — clean emit to `dist/`.
- `npm test` (Vitest) — 52 tests across 7 files, all green (domain, validation,
  store, fixtures).
- Skipped: no XLSX adapter or installed-base reconciliation here — both belong
  to issues #13 and #8 respectively and consume this contract.

## Seam decisions (explicit)

- The extraction contract (`ObservationInput`) is the boundary this data plane
  exposes to the QVAC capture layer (#5); it is documented and type-exported.
- Persistence is behind the `ObservationStore` interface so the mobile/dashboard
  surface can swap SQLite (Expo) or any local store for the memory backend
  without touching validation or the domain.
- Age `null` is the single, explicit `Unknown` marker; brand/model `null` with
  forced `Unknown` provenance keeps records honest (ADR 0003).

## Handoff

Branch pushed to `origin` for `publish-open-pr`. Reviewer: KerubeDev
(`docs/agents/work-item-format.md` metadata inherited from issue #10).