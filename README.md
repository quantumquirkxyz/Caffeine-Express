# FieldSight

FieldSight turns what a field collaborator observes during a hospital visit into structured, reliable data about installed medical equipment. A Collaborator types a natural-language Field note during a Visit; the QVAC on-device text-generation model extracts structured Observations (Client/Site, Modality, brand, model, quantity, Age, Use); the data is validated, persisted, and reconciled into the Installed base per Client and Site.

> **Hackathon compliance:** AI inference is performed with QVAC on a physical Android/iOS device. No Field note is sent to a cloud inference API. The web build is a dashboard/demo surface and does **not** perform AI extraction.

## Why this solves the challenge

Field knowledge is normally fragmented across notes, memory, and conversations. FieldSight converts that unstructured evidence into a local-first installed-base data plane while preserving uncertainty instead of fabricating missing values. The MVP is intentionally narrow: typed conversational capture, QVAC extraction on-device, validation, persistence, reconciliation, and an installed-base dashboard.

The architecture is designed around the challenge constraint rather than treating local inference as an implementation detail:

```text
Field note on phone
       |
       v
QVAC on-device model
       |
       v
Typed extraction contract
       |
       v
Validation + Observation persistence
       |
       v
Installed-base reconciliation
       |
       v
Dashboard / aggregation
```

No cloud inference path exists in the product flow. This decision is documented in [`docs/adr/0001-on-device-qvac-inference.md`](docs/adr/0001-on-device-qvac-inference.md) and guarded by [`scripts/check-no-cloud-inference.mjs`](scripts/check-no-cloud-inference.mjs) plus CI.

## QVAC runtime

The app is an Expo Web/Mobile project (`index.js` → `src/App.tsx`). Android/iOS use **on-device QVAC** through `@qvac/sdk`. The configured native model is `LLAMA_3_2_1B_INST_Q4_0`.

The browser/Node implementation deliberately exposes QVAC as unavailable rather than silently substituting a cloud model. This makes the technical boundary auditable: the dashboard can be demonstrated on web, but AI capture must be demonstrated on a physical Android/iOS device using the native runtime.

See:

- [`docs/qvac/runtime-and-smoke.md`](docs/qvac/runtime-and-smoke.md) — native runtime and smoke-test instructions.
- [`docs/adr/0001-on-device-qvac-inference.md`](docs/adr/0001-on-device-qvac-inference.md) — architecture decision.
- [`JUDGING.md`](JUDGING.md) — rubric mapping and recommended demo sequence.

## Preexisting base (declaration)

Per the Decentralized AI Hackathon rules, every preexisting component used to build this solution is declared here. The substantial MVP work — the typed QVAC extraction contract, the on-device runtime seam and smoke test, the validation/state domain, the installed-base reconciliation and dashboard, and the capture frontend — was built for this challenge.

- **quirk Skills workflow bundle**: `.agents/skills/`, the `.claude/skills/` compatibility view, and `skills-lock.json`. Agent/tooling infrastructure, not product code.
- **Expo / React Native application scaffold and libraries**: `expo`, `react`, `react-native`, `react-native-web`, `react-dom`, `zod`, `lucide-react-native`, `@react-native-async-storage/async-storage`, and the Expo config in `app.json`.
- **QVAC platform (official challenge stack)**: `@qvac/sdk`, `react-native-bare-kit`, `expo-device`, `expo-file-system`, `@qvac/sdk/expo-plugin`, and the on-device model (`LLAMA_3_2_1B_INST_Q4_0`).
- **Synthetic fixture workbook**: `docs/hackathon_rules/Dummy_Installed_Base_Hackathon.xlsx`, provided by the challenge as the seed/acceptance reference.
- **Repository foundations**: prior scaffolding and branch history in this repository (see `docs/`, `CONTEXT.md`, and the `mvp` branch).

This declaration is intentionally explicit because omission of a preexisting base is a disqualifying condition under the competition rules.

## How to run

```sh
npm install
npm start                 # Expo dev server
npm run web               # dashboard/demo surface (no AI extraction)
```

For QVAC extraction, use a **physical Android (API 29+) or iOS device** via an Expo dev client / release build. The native QVAC worker is not available in the browser or standard Node test environment.

## Verification

```sh
npm run typecheck         # tsc --noEmit
npm test                  # vitest run
npm run check:no-cloud    # deterministic no-cloud-inference guard
npm run build             # TypeScript emit
npm run export:web        # Expo web bundle
npm run verify            # core judge-facing verification suite
node scripts/qvac-host-smoke.mjs   # host smoke path for the real 1B model where supported
```

The verification suite exists to make the submission independently auditable: QVAC-only inference policy, type safety, domain/runtime tests, and web export are explicit commands rather than implicit claims.

## MVP scope

Implemented for the challenge:

- Typed natural-language Field note capture.
- QVAC structured extraction on-device.
- Typed validation contract with incomplete-data handling.
- Observation persistence.
- Installed-base reconciliation.
- Client/Site/geography filtering and aggregation.
- Synthetic fixture replay for deterministic judging.
- No-cloud-inference policy guard and tests.

Post-MVP ideas such as dictation, camera/OCR, automated follow-up, P2P synchronization, and advanced renewal analytics remain documented but are intentionally outside the submission-critical path.

## quirk Skills

Canonical skills live in `.agents/skills/`, exposed through the `.claude/skills/` compatibility view. `skills-lock.json` pins the installed bundle hashes.

- Read `CONTEXT.md` for the repository vocabulary and domain model.
- Read `docs/agents/` for issue-tracker, work-item, and triage conventions.
- Read `docs/qvac/` for the extraction contract, runtime, and smoke-test seam specs.
