# FieldSight

FieldSight turns what a field collaborator observes in a hospital into structured, reliable data about installed medical equipment. A Collaborator types a natural-language Field note during a Visit; the QVAC on-device text-generation model extracts structured Observations (Client/Site, Modality, brand, model, quantity, Age, Use); the data is validated, persisted, and reconciled into the Installed base per Client and Site.

The app is an Expo Web/Mobile project (`index.js` → `src/App.tsx`). Android/iOS use **on-device QVAC** (`@qvac/sdk`); web uses a local deterministic extractor because the native QVAC engine is not available in browsers. Neither path uses cloud inference (see [ADR 0001](docs/adr/0001-on-device-qvac-inference.md), enforced by [`scripts/check-no-cloud-inference.mjs`](scripts/check-no-cloud-inference.mjs) and the CI gate).

## Preexisting base (declaration)

Per the Decentralized AI Hackathon rules, every preexisting component used to build this solution is declared here. The substantial MVP work — the typed QVAC extraction contract, the on-device runtime seam and smoke test, the validation/state domain, the installed-base reconciliation and dashboard, and the capture frontend — was built for this challenge.

- **quirk Skills workflow bundle**: `.agents/skills/`, the `.claude/skills/` compatibility view, and `skills-lock.json`. Agent/tooling infrastructure, not product code.
- **Expo / React Native application scaffold and libraries**: `expo`, `react`, `react-native`, `react-native-web`, `react-dom`, `zod`, `lucide-react-native`, `@react-native-async-storage/async-storage`, and the Expo config in `app.json`.
- **QVAC platform (official challenge stack)**: `@qvac/sdk`, `react-native-bare-kit`, `expo-device`, `expo-file-system`, `@qvac/sdk/expo-plugin`, and the on-device model (`LLAMA_3_2_1B_INST_Q4_0`).
- **Synthetic fixture workbook**: `docs/hackathon_rules/Dummy_Installed_Base_Hackathon.xlsx`, provided by the challenge as the seed/acceptance reference.
- **Repository foundations**: prior scaffolding and branch history in this repository (see `docs/`, `CONTEXT.md`, and the `mvp` branch).

## How to run

```sh
npm install
npm start                 # Expo dev server (web / Android / iOS)
npm run web               # web
```

The QVAC worker runs on a **physical Android (API 29+) or iOS device** via the Expo dev client / a release build. It does not run on emulators or the browser; on those targets the capture flow disables itself with a clear error (see [`docs/qvac/runtime-and-smoke.md`](docs/qvac/runtime-and-smoke.md)).

## Verification

```sh
npm run typecheck         # tsc --noEmit
npm test                  # vitest run (contract, runtime, smoke, store, dashboard)
npm run check:no-cloud    # no-cloud-inference guard
npm run build             # tsc emit
npm run export:web        # Expo web bundle
node scripts/qvac-host-smoke.mjs   # loads the real 1B model on the host and runs a contract completion
```

## quirk Skills

Canonical skills live in `.agents/skills/`, exposed through the `.claude/skills/` compatibility view. `skills-lock.json` pins the installed bundle hashes.

- Read `CONTEXT.md` for this repository's local vocabulary and setup.
- Read `docs/agents/` for issue-tracker, work-item, and triage conventions.
- Read `docs/qvac/` for the extraction contract, runtime, and smoke-test seam specs.
