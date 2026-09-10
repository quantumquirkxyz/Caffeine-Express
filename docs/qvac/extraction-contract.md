# QVAC MVP typed extraction contract

This document is the English specification of the contract between the
on-device QVAC text-generation model and the MVP capture flow. It is the
single source of truth for the prompt, the JSON shape, the parsing rules,
and the examples the contract tests exercise.

The TypeScript implementation lives in
[`src/capture/qvac-contract.ts`](../../src/capture/qvac-contract.ts) and the
contract tests live in
[`src/capture/qvac-contract.test.ts`](../../src/capture/qvac-contract.test.ts).
The contract is delivered as part of issue **#5** in the parent spec
[**#4 — QVAC model and local runtime seam**](https://github.com/quantumquirkxyz/Caffeine-Express/issues/4).

## Goal

Turn one typed Field note into one or more schema-shaped `ObservationInput`
records, deterministically and offline, with the following guarantees:

- **Typed output** for Client, Site, Modality, brand, model, quantity, Age,
  Use, and Comment when present.
- **No invented values.** A missing required Age becomes `Unknown`; an
  unrecognized modality, a reversed Age range, or a non-positive quantity is
  rejected as malformed model output and surfaced as an `ExtractionError`.
- **Deterministic mapping** from model JSON to `ObservationInput[]`, so the
  capture flow and the test fixtures can rely on stable, reproducible
  inputs.
- **English documentation** of the prompt, the JSON shape, the rules, and
  worked examples (this document).

## JSON shape

The QVAC text-generation model is instructed, via the prompt in
[`buildExtractionPrompt`](../../src/capture/qvac-contract.ts), to return a
single JSON object with the following exact shape. The parser rejects any
deviation.

```json
{
  "observations": [
    {
      "client": "DemoCare",
      "site": "Pacific Hospital",
      "city": "Unknown",
      "country": "Unknown",
      "modality": "MRI",
      "brand": "NovaMed",
      "model": "N-1",
      "quantity": 2,
      "age": null,
      "use": { "hours": 1200 },
      "comment": "planned replacement"
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `client` | string | yes | Client (organization) name as stated in the note. |
| `site` | string | yes | Site name as stated in the note. |
| `city` | string | optional | Defaults to `"Unknown"`. |
| `country` | string | optional | Defaults to `"Unknown"`. |
| `modality` | string | yes | Canonical term (MRI, CT, Ultrasound, X-Ray, Patient Monitoring, Image Guided Therapy, Other) or a documented alias (MR, scanner, US, xray, monitoring, IGT, ...). Unrecognized values are rejected. |
| `brand` | string \| null | optional | `null` when the note does not name a brand. |
| `model` | string \| null | optional | `null` when the note does not name a model. |
| `quantity` | positive integer | yes | Defaults to 1 for a single device. |
| `age` | `null` \| number \| `{ "min": number, "max": number }` \| `{ "approx": number }` | optional (default `null`) | See "Age rules" below. |
| `use` | `null` \| `{ "hours": number }` | optional (default `null`) | `hours` must be a non-negative number. `period` is not modeled in the MVP and is recorded as `null` until a future Visit is attached. |
| `comment` | string \| null | optional | Verbatim collaborator comment, or `null`. |

The parser is **strict**: extra unknown keys in a row are rejected, the
`observations` array must contain at least one element, and the top-level
object must be exactly `{ "observations": [...] }`.

## Age rules

| Model output | Mapped `ObservationInput` | Provenance |
|---|---|---|
| `null` or omitted | `age: null` | `Unknown` |
| `7` (bare number) | `age: { min: 7, max: 7 }` | `Reported` |
| `{ "approx": 7 }` | `age: { min: 6, max: 8 }` (clamped at `min >= 0`) | `Estimated` |
| `{ "min": 4, "max": 6 }` | `age: { min: 4, max: 6 }` (must satisfy `min <= max`, both non-negative) | `Reported` |
| anything else (string, `{ min, max }` with `min > max`, negative number, ...) | rejected as malformed model output | n/a |

The model **never** invents an Age. When the note gives no Age or the Age
is unknowable, the model returns `null` and the mapper records
`age: null`, `ageProvenance: 'Unknown'`.

## Use rules

| Model output | Mapped `ObservationInput` | Provenance |
|---|---|---|
| `null` or omitted | `use: null` | `useProvenance: null` |
| `{ "hours": 1200 }` | `use: { hours: 1200, period: null }` | `useProvenance: 'Reported'` |
| `{ "hours": -1 }` or non-finite | rejected as malformed model output | n/a |

`period` is part of the internal Observation model (it carries an explicit
operating window) but is not part of the MVP model output; the mapper
records `period: null` and a future Visit can attach a real period.

## Other provenance defaults

| Observation input field | Source | Default provenance |
|---|---|---|
| `site` | required from the model | not per-field (lives on the Site) |
| `modality` | normalized from the model | `Reported` |
| `brand` | trimmed string or `null` | `Reported` if present, `Unknown` if `null` |
| `model` | trimmed string or `null` | `Reported` if present, `Unknown` if `null` |
| `quantity` | required positive integer | `Reported` |
| `fieldNote` | the original typed note | n/a |
| `collaborator` | not modeled in the MVP | `null` (filled by the Visit context) |
| `visitDate` | `now.toISOString().slice(0, 10)` (overridable in tests) | n/a |
| `createdAt` | `now.toISOString()` (set by `createObservation`) | n/a |

## Worked examples

Each example shows a Field note, the model JSON the model is expected to
return, and the resulting `ObservationInput` array. The contract tests
exercise each of these cases.

### 1. Complete Field note

Field note:

> Two MRI machines at Pacific Hospital, client DemoCare, brand NovaMed,
> model N-1, 1200 hours, comment planned replacement.

Model JSON:

```json
{
  "observations": [
    {
      "client": "DemoCare",
      "site": "Pacific Hospital",
      "modality": "MRI",
      "brand": "NovaMed",
      "model": "N-1",
      "quantity": 2,
      "age": null,
      "use": { "hours": 1200 },
      "comment": "planned replacement"
    }
  ]
}
```

Mapped `ObservationInput[0]`:

```ts
{
  site: { client: { name: 'DemoCare' }, name: 'Pacific Hospital', city: 'Unknown', country: 'Unknown' },
  modality: 'MRI',
  modalityProvenance: 'Reported',
  brand: 'NovaMed', brandProvenance: 'Reported',
  model: 'N-1', modelProvenance: 'Reported',
  quantity: 2, quantityProvenance: 'Reported',
  age: null, ageProvenance: 'Unknown',
  use: { hours: 1200, period: null }, useProvenance: 'Reported',
  comment: 'planned replacement',
  fieldNote: '<the original note>',
  collaborator: null,
  visitDate: '2026-09-09',
}
```

### 2. Incomplete Field note (no brand/model/age/use/comment)

Field note:

> MRI at Hospital, client DemoCare.

Model JSON:

```json
{
  "observations": [
    {
      "client": "DemoCare",
      "site": "Hospital",
      "modality": "MRI",
      "brand": null,
      "model": null,
      "quantity": 1,
      "age": null,
      "use": null,
      "comment": null
    }
  ]
}
```

Mapped `ObservationInput[0]`:

```ts
{
  site: { client: { name: 'DemoCare' }, name: 'Hospital', city: 'Unknown', country: 'Unknown' },
  modality: 'MRI', modalityProvenance: 'Reported',
  brand: null, brandProvenance: 'Unknown',
  model: null, modelProvenance: 'Unknown',
  quantity: 1, quantityProvenance: 'Reported',
  age: null, ageProvenance: 'Unknown',
  use: null, useProvenance: null,
  comment: null,
  fieldNote: '<the original note>',
  collaborator: null,
  visitDate: '2026-09-09',
}
```

### 3. Approximate Age

Field note:

> About 7 years old MRI at Hospital, client DemoCare.

Model JSON:

```json
{
  "observations": [
    {
      "client": "DemoCare",
      "site": "Hospital",
      "modality": "MRI",
      "quantity": 1,
      "age": { "approx": 7 }
    }
  ]
}
```

Mapped: `age: { min: 6, max: 8 }`, `ageProvenance: 'Estimated'`. The
envelope follows the inclusive-range convention defined in
[`ADR 0005`](../adr/0005-age-as-min-max-range-with-envelope.md) and the
domain helper [`approximateAgeYears`](../../src/domain/age.ts).

### 4. Explicit Use hours

Field note:

> One CT at Hospital, client DemoCare, 1500 hours.

Model JSON:

```json
{
  "observations": [
    {
      "client": "DemoCare",
      "site": "Hospital",
      "modality": "CT",
      "quantity": 1,
      "use": { "hours": 1500 }
    }
  ]
}
```

Mapped: `use: { hours: 1500, period: null }`, `useProvenance: 'Reported'`.

### 5. Malformed model output

Any of the following is rejected and surfaced as `ExtractionError`:

- `not json` (malformed JSON)
- `{ "data": [...] }` (missing `observations` array)
- `{ "observations": [] }` (empty array is a contract violation)
- `{ "observations": [ { "client": "a", "site": "b", "modality": "MRI", "quantity": 1, "age": { "min": 9, "max": 4 } } ] }` (reversed Age range)
- `{ "observations": [ { "site": "b", "modality": "MRI", "quantity": 1 } ] }` (missing required `client`)
- `{ "observations": [ { "client": "a", "site": "b", "modality": "MRI", "quantity": 0 } ] }` (non-positive quantity)
- `{ "observations": [ { "client": "a", "site": "b", "modality": "MRI", "quantity": 1, "use": { "hours": -1 } } ] }` (negative Use hours)
- `{ "observations": [ { "client": "a", "site": "b", "modality": "MRI", "quantity": 1, "invented": "value" } ] }` (unknown key, the parser is strict)

## How the capture flow uses the contract

The native extractor
([`qvac-extractor.native.ts`](../../src/capture/qvac-extractor.native.ts))
sends the prompt to the on-device QVAC completion and feeds the
`contentText` of the final event into
[`extractObservationsFromContent`](../../src/capture/qvac-contract.ts),
which:

1. Parses the JSON and validates the top-level `{ "observations": [...] }`
   shape.
2. Validates each row against the Zod model-row schema (strict).
3. Maps each row to an `ObservationInput` with the documented provenance
   defaults, normalizes the modality (alias → canonical; unknown alias →
   `ExtractionError`), and runs the result through the existing
   `parseObservationInput` Zod schema so the output is guaranteed to be
   schema-shaped.
4. Surfaces any contract or schema violation as `ExtractionError` so the
   capture flow can show a clear error to the collaborator without
   persisting a partial record.

The capture flow then runs each `ObservationInput` through
`createObservation` to produce the persisted `Observation` record (the
typed data plane owned by issue **#10** and issue **#11**).
