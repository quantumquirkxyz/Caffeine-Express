# FieldSight — Judging Guide

This document maps the submission to the Decentralized AI Hackathon evaluation criteria and gives the shortest path to verify the implementation.

## 1. Technical — 35%

**Claim:** FieldSight performs AI extraction with QVAC on the device and does not route inference to a cloud API.

Evidence:

- Native QVAC runtime: `src/capture/qvac-runtime.native.ts`
- Native QVAC extractor: `src/capture/qvac-extractor.native.ts`
- Structured extraction contract: `src/capture/qvac-contract.ts`
- Architecture decision: `docs/adr/0001-on-device-qvac-inference.md`
- Deterministic policy gate: `scripts/check-no-cloud-inference.mjs`
- CI enforcement: `.github/workflows/no-cloud-inference.yml`
- Runtime/smoke instructions: `docs/qvac/runtime-and-smoke.md`

Run:

```sh
npm ci
npm run verify
```

For the actual AI path, use a physical Android/iOS device. The browser is intentionally not an inference substitute.

## 2. Innovation — 25%

FieldSight treats unstructured field observations as evidence rather than as final database rows. QVAC converts a conversational Field note into typed Observations; the domain layer explicitly models incomplete and uncertain information instead of inventing values. Multiple Observations are reconciled into an Installed base, preserving provenance and uncertainty.

The important architectural distinction is:

```text
raw Field note != Observation != Installed equipment
```

This separates capture, evidence, and resolved operational knowledge.

## 3. Impact — 20%

The target problem is operational visibility of installed equipment observed by field collaborators. Manual notes are slow, inconsistent, duplicated, and often incomplete. FieldSight reduces the capture burden while producing a structured installed-base view that can be filtered by Client, Site, geography, modality, brand, and model.

The solution is local-first because field observations may be sensitive and connectivity may be unreliable.

## 4. Design — 10%

The app uses a focused three-part workflow:

1. **Overview** — aggregate installed-base signal.
2. **Capture** — conversational Field note entry and local extraction.
3. **Installed base** — resolved records with filtering.

The mobile interface is the submission-critical capture surface; the web build is useful for dashboard review and deterministic UI demonstration.

## 5. Completion — 10%

The MVP critical path is implemented end-to-end:

```text
Field note
  -> QVAC extraction
  -> typed validation
  -> Observation persistence
  -> Installed-base reconciliation
  -> dashboard aggregation
```

Synthetic fixture data is provided for deterministic judging and tests. Post-MVP capabilities such as speech, camera/OCR, P2P synchronization, and advanced analytics are intentionally excluded from the critical path.

## Recommended demo sequence (under 5 minutes)

**0:00–0:30 — Problem**

Explain that valuable field knowledge currently remains in notes or memory and that sensitive observations should not be sent to cloud AI.

**0:30–1:10 — Technical proof**

Show the QVAC native runtime/extractor and the no-cloud guard. State clearly that inference happens on the physical device.

**1:10–2:30 — Capture**

On a physical phone, type one realistic Field note and run QVAC extraction. Show the structured Observation and any Unknown/Estimated values rather than hiding uncertainty.

**2:30–3:30 — Reconciliation**

Show how the persisted Observation updates the Installed base and how duplicate/related evidence resolves into the operational view.

**3:30–4:20 — Dashboard**

Show Client/Site/geography and equipment filtering plus aggregate counts.

**4:20–5:00 — Close**

Reiterate the differentiators: QVAC on-device inference, structured evidence, explicit uncertainty, local-first operation, and an auditable no-cloud boundary.

## Submission checklist

Before delivery:

- Repository remains accessible to judges.
- README retains the explicit preexisting-base declaration.
- No inference API or cloud-model dependency is introduced.
- `npm run verify` succeeds.
- Physical-device QVAC capture is tested before recording the final demo.
- Demo video is in Spanish, no longer than five minutes, and accessible without credentials.
- Repository and video are submitted before the official deadline.
