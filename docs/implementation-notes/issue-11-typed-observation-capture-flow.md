# Implementation note - Issue #11: typed Observation capture flow

**Branch:** `feat/issue-11-typed-observation-capture-flow`
**Status:** implemented, validated, awaiting review

## What changed

- Added the injectable `ObservationExtractor` seam and `captureObservation` application flow.
- Added a deterministic local extractor for typed MVP Field notes. It normalizes modality aliases and preserves missing Age as `Unknown`.
- Added the mobile/web capture card to `App`: multiline typed input, extraction/save action, loading indicator, validation/extraction error, saved result, field values, and provenance.
- Captured Observations are persisted through `ObservationStore` and immediately update the installed-base view.
- Added deterministic unit/integration coverage for extraction, validation, persistence, Unknown Age, errors, and injected extractor behavior.

## Acceptance criteria -> evidence

| Criterion | Evidence |
|---|---|
| Typed natural-language input | `src/App.tsx` capture card and `TextInput` |
| QVAC seam and structured result | `ObservationExtractor`, `captureObservation`, saved preview in `src/capture/observation-capture.ts` and `src/App.tsx` |
| Client/Site, Modality, brand, model, quantity, Age, Use, Comment, provenance | Existing `ObservationInput` contract consumed by the capture flow; preview displays the extracted fields and provenance |
| Missing Age is `Unknown` and saveable | Capture test asserts `age === null` and `ageProvenance === 'Unknown'` after persistence |
| Loading, validation error, saved, empty, offline states | Capture state machine in `App`; existing dashboard offline/empty states retained |
| Deterministic typed capture validation | `src/capture/observation-capture.test.ts` |

## Validation performed

- `npm run typecheck` - clean.
- `npm test -- --run src/capture/observation-capture.test.ts` - 3 tests passed.
- `npm test` - 65 tests across 10 files passed.

## Seam decision

The UI depends on `ObservationExtractor`, not on parsing details. The deterministic extractor is the MVP fixture implementation; a device QVAC implementation can be injected without changing the capture or persistence flow.
