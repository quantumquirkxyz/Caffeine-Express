# QVAC model and local runtime seam

This is the MVP delivery of the parent spec
[**#4 — QVAC model and local runtime seam**](https://github.com/quantumquirkxyz/FieldSight/issues/4).
The seam is split into two work items:

- [**#5 — QVAC: typed MVP extraction contract**](https://github.com/quantumquirkxyz/FieldSight/issues/5)
  — the prompt, the JSON shape, the deterministic parser, and the
  contract tests.
  → [`docs/qvac/extraction-contract.md`](extraction-contract.md)
  → [`src/capture/qvac-contract.ts`](../../src/capture/qvac-contract.ts)
  → [`src/capture/qvac-contract.test.ts`](../../src/capture/qvac-contract.test.ts)
- [**#9 — QVAC: configure MVP text-generation model and smoke test**](https://github.com/quantumquirkxyz/FieldSight/issues/9)
  — the supported runtime, the model configuration, the smoke test
  (load → complete → failure → unload), and the no-cloud-inference
  guarantee.
  → [`docs/qvac/runtime-and-smoke.md`](runtime-and-smoke.md)
  → [`src/capture/qvac-runtime.ts`](../../src/capture/qvac-runtime.ts)
  → [`src/capture/qvac-runtime.native.ts`](../../src/capture/qvac-runtime.native.ts)
  → [`src/capture/qvac-smoke.ts`](../../src/capture/qvac-smoke.ts)
  → [`src/capture/qvac-smoke.test.ts`](../../src/capture/qvac-smoke.test.ts)
  → [`scripts/check-no-cloud-inference.mjs`](../../scripts/check-no-cloud-inference.mjs)

## What the seam delivers

The MVP typed extraction flow needs three things from QVAC: a model that
loads on the device, a typed contract between the model and the capture
flow, and a guarantee that no inference ever leaves the device. The two
sub-issues cover all three.

| Acceptance criterion (spec #4) | Delivered by |
|---|---|
| The chosen QVAC text-generation model loads in the supported MVP runtime. | #9 — `NativeQvacRuntime` + `LLAMA_3_2_1B_INST_Q4_0`, smoke test green. |
| A typed Field note can be sent to QVAC and returns structured extraction output. | #5 — `extractObservationsFromContent` + `QVACObservationExtractor` (native). |
| The output contract covers Client/Site, Modality, brand, model, quantity, Age, Use, and Comment when present. | #5 — the `ModelObservationRow` schema and the worked examples in `extraction-contract.md`. |
| Required Age can be returned as `Unknown` without invented values. | #5 — `age: null` → `ageProvenance: 'Unknown'`; the contract tests assert no invented Age. |
| The runtime works offline after model assets are available. | #9 — the `QvacRuntime` interface is local-only and the no-cloud guard (`scripts/check-no-cloud-inference.mjs`) is a CI gate. |
| A smoke test documents model load, completion, failure, and cleanup. | #9 — `runQvacSmokeTest` + `docs/qvac/runtime-and-smoke.md`. |

## Non-goals (out of MVP scope)

These are intentionally excluded from the seam and live in the post-MVP
roadmap recorded in [`docs/proposal-solution.md`](../proposal-solution.md):

- Parakeet dictation, text-to-speech, OCR, multimodal vision, P2P
  delegation, and natural-language queries.
- Cloud inference or a remote inference API. Any addition of a cloud
  path would violate `ADR 0001` and the no-cloud guard, and must be
  raised as a new ADR.

## How to read the seam

1. Start with [`extraction-contract.md`](extraction-contract.md) for the
   JSON shape, the Age/Use rules, the worked examples, and the contract
   tests.
2. Read [`runtime-and-smoke.md`](runtime-and-smoke.md) for the supported
   runtime, the model configuration, the smoke test, and the no-cloud
   guarantee.
3. Run `node scripts/check-no-cloud-inference.mjs` and
   `npx vitest run src/capture/qvac-smoke.test.ts` to reproduce the CI
   evidence locally.
4. On a physical Android or iOS device, run the native smoke documented
   in `runtime-and-smoke.md` and paste the result into the PR.

## Status

Both sub-issues are implemented, typecheck-clean, and covered by
contract/smoke tests on the `feat/issue-5-typed-qvac-extraction-contract`
and `feat/issue-9-qvac-runtime-config-and-smoke-test` branches. The
parent spec is ready for review.
