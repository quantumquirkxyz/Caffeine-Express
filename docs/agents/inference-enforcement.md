# Inference enforcement (QVAC only)

This document is the English specification of the automated and
on-demand enforcement that guarantees every inference path in the
MVP runs exclusively through QVAC on-device, per
[`docs/adr/0001-on-device-qvac-inference.md`](../adr/0001-on-device-qvac-inference.md).

The enforcement is layered. The deterministic guard is the safety net;
the CI gate is the automated check; the audit skill is the deep
on-demand review. All three are required to keep the no-cloud
guarantee from drifting.

## Layer 1 — ADR 0001 (design decision)

`ADR 0001` records the design decision: every inference runs on
device via QVAC, and any cloud-inference path violates the product's
architectural invariant. A future reader who considers adding a cloud API must
raise a new ADR that supersedes 0001; the auditor and the CI gate
flag the change as a violation until that ADR is merged.

## Layer 2 — Deterministic static guard

[`scripts/check-no-cloud-inference.mjs`](../../scripts/check-no-cloud-inference.mjs)
is a Node script that strips comments and fails on any of:

- `fetch(` calls in `src/capture/**` and `scripts/**`
- `XMLHttpRequest` in the same paths
- `axios`, `node-fetch`, `openai`, `@openai/*`, `anthropic`,
  `@anthropic/*` imports in the same paths
- any `http://` or `https://` URL other than `localhost` /
  `127.0.0.1` in the same paths
- any forbidden pattern in the smoke prompt string

The script is the deterministic enforcer. It runs in milliseconds, has
zero false positives on the current tree, and is the single source of
truth for "the QVAC source has no cloud path."

Run it locally:

```sh
node scripts/check-no-cloud-inference.mjs
# or
npm run check:no-cloud
```

Expected output on a clean tree:

```
no-cloud-inference check passed: no cloud HTTP, fetch, or inference SDK imports in QVAC source.
```

## Layer 3 — CI gate

[`.github/workflows/no-cloud-inference.yml`](../../.github/workflows/no-cloud-inference.yml)
runs the guard plus typecheck and tests on every pull request and push
to `mvp` and `main`. A PR that introduces a cloud path fails the
`enforce-qvac-only` job before it can merge.

The CI job also asserts `docs/adr/0001-on-device-qvac-inference.md`
is present, so the design decision cannot be deleted silently.

## Layer 4 — Audit subagent / skill

[`.agents/skills/inference-auditor/SKILL.md`](../../.agents/skills/inference-auditor/SKILL.md)
is the reusable on-demand auditor. It runs the deterministic guard
and then walks a ten-row checklist for indirect paths the guard
cannot reach (transitive deps, telemetry SDKs, env-based endpoints,
dynamic imports, WebView sources, native bridges, build pipeline
hooks). The skill produces a verdict with cited evidence and is
invoked by any agent — including the ralph loop — on demand.

## When to invoke the auditor

Invoke the inference-auditor skill when:

- A pull request touches `src/capture/`, `src/validation/`,
  `src/domain/`, `scripts/`, `app.json`, `package.json`, the Expo
  plugin list, or any file that imports `@qvac/sdk` or a cloud SDK.
- A change touches the build pipeline (Gradle, Metro,
  `expo prebuild`, `babel.config.cjs`).
- Before merging to `mvp` or `main`.
- A reviewer asks to "verify ADR 0001", "check inference",
  "QVAC only", or "no cloud audit".

## Status

All four layers are in place on the
`ci/inference-enforcement-no-cloud-guard` branch. The guard passes on
the current `mvp` tip; the CI gate is the merge gate; the audit skill
is the on-demand deep review.
