---
name: inference-auditor
description: Audit the FieldSight codebase to prove every inference path runs exclusively through QVAC on-device, and report violations of the no-cloud-inference guarantee. Use when reviewing changes that touch inference, models, capture, extraction, or any network/telemetry surface, or when asked to verify ADR 0001 is honored. Triggers: 'audit inference', 'inference auditor', 'QVAC only check', 'no cloud audit', 'verify ADR 0001', 'check inference path'.
---

# inference-auditor

Reusable audit that proves every inference path in the codebase runs
exclusively through QVAC on-device, per
[`docs/adr/0001-on-device-qvac-inference.md`](../../../docs/adr/0001-on-device-qvac-inference.md).
The skill combines a deterministic static guard with a checklist for
indirect inference paths the guard cannot reach.

## When to invoke

Invoke this skill on any of:

- A pull request that touches `src/capture/`, `src/validation/`,
  `src/domain/`, `scripts/`, `app.json`, `package.json`, the Expo
  plugin list, or anything that imports `@qvac/sdk` or a cloud SDK.
- A change to the build pipeline (Gradle, Metro, `expo prebuild`,
  `babel.config.cjs`).
- Before merging to `mvp` or `main`.
- A request to "verify ADR 0001", "check inference", "QVAC only", or
  "no cloud audit".

## Audit procedure

Run the deterministic guard first. Then walk the checklist for indirect
paths the guard cannot reach (transitive deps, env-based endpoints,
telemetry, dynamic imports, native bridges). Record every finding with
a file:line citation and a one-line rationale.

### 1. Deterministic guard

```sh
node scripts/check-no-cloud-inference.mjs
```

The guard strips comments from `src/capture/**`, `scripts/**`, and the
smoke prompt, then fails on any of:

- `fetch(` calls
- `XMLHttpRequest`
- `axios` / `node-fetch` imports
- `openai` / `@openai/*` or `anthropic` / `@anthropic/*` imports
- any `http://` or `https://` URL other than `localhost` / `127.0.0.1`

Expected output on a clean tree:

```
no-cloud-inference check passed: no cloud HTTP, fetch, or inference SDK imports in QVAC source.
```

Any offence is a hard fail. Do not proceed to the checklist until the
guard passes.

### 2. Indirect-path checklist

The guard catches direct cloud calls in the audited paths. Walk the
rest of the tree for indirect paths the guard does not reach.

| # | Check | Where to look | Pass criterion |
|---|---|---|---|
| 2.1 | No cloud SDK in `package.json` | `dependencies`, `devDependencies` | No `openai*`, `@openai/*`, `anthropic`, `@anthropic/*`, `@google-cloud/*`, `@aws-sdk/*`, `axios`, `node-fetch`. `@qvac/sdk` is the only inference SDK. |
| 2.2 | No cloud SDK anywhere in `src/` | `src/**` (the guard covers `src/capture`; audit the rest) | Same. The capture layer is the only place the guard enforces; the rest of the tree is reviewed by this skill. |
| 2.3 | No remote URLs in any source file | `src/**`, `app.json`, `babel.config.cjs`, `tsconfig.json`, `index.js` | No `http://` / `https://` to non-localhost. The QVAC model registry and asset downloads resolve through the QVAC worker, not direct HTTP. |
| 2.4 | No telemetry / analytics / error reporting SDKs | `src/**`, `package.json` | No Sentry, Datadog, Bugsnag, Mixpanel, Amplitude, PostHog, Firebase Analytics, Google Analytics, or equivalent. The proposal records the capture flow as fully local. |
| 2.5 | No environment-based endpoints | `src/**`, `app.json`, `.env*` | No `process.env.*_URL`, `process.env.*_ENDPOINT`, `API_BASE_URL` that points off-device. QVAC does not require runtime endpoint configuration. |
| 2.6 | No dynamic imports of remote modules | `src/**` | No `await import('https://...')` or equivalent. The JS bundle is fully local. |
| 2.7 | No WebView / iframe loading remote content | `src/**` | No `WebView` `source={{ uri: 'https://... }}` or `iframe` `src="https://..."` pointing off-device. |
| 2.8 | Native bridges resolve to local code | `src/capture/qvac-runtime.native.ts`, `src/capture/qvac-extractor.native.ts`, `src/capture/qvac-smoke.native.ts` | Every import under `@qvac/sdk` is a local model constant or worker binding. The `app.json` Expo plugin entry is `@qvac/sdk/expo-plugin`, which only configures local architecture. |
| 2.9 | Transitive deps are clean | `npm ls <dep>` for any new dependency | The new dep's tree introduces no cloud SDK, no telemetry, no remote URL. |
| 2.10 | Build pipeline does not call out | `babel.config.cjs`, `metro.config.*` (if present), Gradle files after `expo prebuild` | No plugin that POSTs build artifacts or source maps to a remote endpoint. |

### 3. Verdict and report

Produce a verdict:

- **PASS** — guard passes and every checklist row is satisfied. Record
  the guard output and a one-line confirmation per row.
- **FAIL** — guard fails or any checklist row is unsatisfied. Record
  every offence with `file:line`, the offending snippet, the violated
  row, and the suggested fix.

The report is the deliverable. A clean PASS with cited evidence is the
expected output on `mvp` and `main`.

## Relationship to the CI gate

The CI workflow
[`.github/workflows/no-cloud-inference.yml`](../../../.github/workflows/no-cloud-inference.yml)
runs the deterministic guard plus typecheck and tests on every PR and
push to `mvp` and `main`. The CI gate is the automated, deterministic
enforcement; this skill is the on-demand, human-in-the-loop auditor
that catches what the guard cannot (transitive deps, telemetry, env
endpoints, indirect paths). Both are required: the CI gate is the
safety net, this skill is the deep review.
