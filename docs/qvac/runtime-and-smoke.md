# QVAC runtime and smoke test

This document is the English specification of the QVAC model and local
runtime seam required by the MVP typed extraction flow. It is delivered as
part of issue **#9** in the parent spec
[**#4 — QVAC model and local runtime seam**](https://github.com/quantumquirkxyz/FieldSight/issues/4).

The TypeScript implementation lives in
[`src/capture/qvac-runtime.ts`](../../src/capture/qvac-runtime.ts),
[`src/capture/qvac-runtime.native.ts`](../../src/capture/qvac-runtime.native.ts),
[`src/capture/qvac-smoke.ts`](../../src/capture/qvac-smoke.ts), and
[`src/capture/qvac-smoke.native.ts`](../../src/capture/qvac-smoke.native.ts).
The smoke test lives in
[`src/capture/qvac-smoke.test.ts`](../../src/capture/qvac-smoke.test.ts)
and the "no cloud inference path" guard lives in
[`scripts/check-no-cloud-inference.mjs`](../../scripts/check-no-cloud-inference.mjs).

## Supported runtime

The MVP runs the QVAC worker on the on-device runtime exposed by
`@qvac/sdk`. That runtime is available on:

- **Android** (physical device, via the Expo dev client / a release build).
- **iOS** (physical device, via the Expo dev client / a release build).

QVAC workers do not run on emulators (the engine binaries require a real
device) and there is no browser runtime. This matches the QVAC capability
map recorded in
[`docs/proposal-solution.md`](../proposal-solution.md#4-webmobile-androidios--why-and-how).
The non-native fallback in `qvac-runtime.ts` makes every `QvacRuntime`
operation throw `QvacRuntimeUnavailableError` so the capture flow and the
smoke test fail with a clear message in Node, web, and CI.

### Why emulators cannot run the QVAC engine

- **The QVAC engine binaries are `arm64-v8a` only.** `@qvac/llm-llamacpp`
  and the other `@qvac/*` packages ship `prebuilds/android-arm64` (and
  desktop `linux-x64`/`darwin-*`); there are no real `android-x64`
  prebuilts. An `x86_64` emulator therefore has no engine to load.
- **The engine binaries require Android API 29+.** The ELF
  `.note.android.ident` in `libqvac__llm-llamacpp.so` records API `29`.
- **The Android emulator cannot run `arm64` system images on an `x86_64`
  host for API 28+.** The emulator's `main-emulator.cpp` hard-fails with
  `Avd's CPU Architecture 'arm64' is not supported by the QEMU2 emulator
  on x86_64 host` for `apiLevel >= 28`; only API ≤ 27 `arm64` images run
  on `x86_64` hosts, and those are below the engine's API 29 floor.
- **No cloud fallback.** Because the engine cannot run, the app must not
  silently route inference to a cloud API. `NativeQvacRuntime.loadModel`
  checks `Device.isDevice` (from `expo-device`) and throws a catchable
  `QvacRuntimeUnavailableError` on an emulator, so `App.tsx` shows
  "QVAC could not load its on-device model." and disables capture. The
  `scripts/check-no-cloud-inference.mjs` guard is a CI gate proving there
  is no cloud inference path in the source or the shipped bundle.

Run the app on a physical Android (or iOS) device, API 29+, to exercise
the QVAC engine. The engine also runs on the host through the Node
runtime (`@qvac/sdk` + the `linux-x64` prebuilds), which is how the
model and the extraction contract can be validated without a device.

## MVP model configuration

| Setting | Value |
|---|---|
| Model constant | `LLAMA_3_2_1B_INST_Q4_0` (re-exported as `QVAC_MVP_MODEL` in `qvac-runtime.native.ts`) |
| Worker binding | `@qvac/sdk` `loadModel` / `completion` / `unloadModel` |
| Engine | `llamacpp` (text generation), local to the device |
| Streaming | Disabled for the MVP smoke and the extraction flow (`stream: false`) |
| Output schema | `responseFormat: { type: 'json_object' }`, validated by the typed extraction contract (issue #5) |
| Fallback model | `QWEN3_600M_INST_Q4` (documented in `docs/proposal-solution.md` §5.1; smaller, but too weak for the typed extraction contract in practice) |

The 1B instruct model was chosen after on-device-style evaluation: the
600M model hallucinated an unrelated schema or emitted Qwen3 "thinking"
text instead of the contract JSON, while `LLAMA_3_2_1B_INST_Q4_0` returned
the contract shape with `age: null` (never an invented Age).

The model constant and the worker binding are the only QVAC-side
configuration the MVP depends on. Both are exported from
`@qvac/sdk` and used directly by `NativeQvacRuntime`, so the configuration
is reproducible across runs and across devices.

### Host validation

`scripts/qvac-host-smoke.mjs` runs the same model, the same
`responseFormat: { type: 'json_object' }` schema, and the same typed
contract on the Node runtime (`node scripts/qvac-host-smoke.mjs`, using
the QVAC `linux-x64` prebuilds). It is the device-free way to prove the
model loads and produces contract JSON with no cloud inference path.

Recorded run (`LLAMA_3_2_1B_INST_Q4_0`):

```
[qvac-host-smoke] loading LLAMA_3_2_1B_INST_Q4_0 ...
[qvac-host-smoke] loaded: bd4db59fb4120b52
[qvac-host-smoke] completion output:
{"observations": [ {"client": "DemoCare", "site": "Pacific Hospital",
"modality": "MRI", "brand": "NovaMed", "model": "N-1", "quantity": 0,
"age": null, "use": null, "comment": "planned replacement"} ]}
[qvac-host-smoke] unloaded cleanly
```

The 1B model is small enough that it can miss quantities or usage ("Two",
"1200 hours") in a zero-shot prompt, but it returns the contract shape and
never invents a value (`age: null` stays null). That is the MVP contract:
structure and provenance over recall.

### Offline startup

With the model cached, `loadModel` does not contact the network: the registry
path validates the local file (size plus a full SHA-256, about 1.9 s for the 1B
model) and loads it with llama.cpp (about 2.4 s). Measured on the physical
device, the online and offline load timelines are identical — roughly 6 s from
JS start to the model being registered, and about 10 s to the "ON-DEVICE" badge
including app startup.

The network is required to *provision* the model (the first 773 MB download, or
after clearing the app cache). An offline load with an incomplete cache waits on
the registry timeouts (`registryStreamTimeoutMs` 60 s,
`registryDownloadMaxRetries` 3). For HTTP model sources the SDK also validates a
cache hit with a freshness `HEAD` whose connect timeout is
`httpConnectionTimeoutMs` (10 s by default), which a hanging network (WiFi
connected without internet) would pay in full. Before the first QVAC call the
app writes `qvac.config.json` into its documents directory
(`src/capture/qvac-config.native.ts`) with `httpConnectionTimeoutMs: 3000` and
console logging enabled, so that fallback is bounded and the load path is
visible in `adb logcat`.

## No cloud inference path

The MVP never calls a cloud inference endpoint. This is enforced by three
mechanisms:

1. **`QvacRuntime` only references the local worker.** `NativeQvacRuntime`
   calls `loadModel`, `completion`, and `unloadModel` from `@qvac/sdk`
   with a local model constant. There is no `fetch`, no `axios`, no cloud
   SDK import, and no remote URL anywhere in the QVAC source.
2. **`ADR 0001 — On-device inference via QVAC`** records the design
   decision and the disqualification consequence.
3. **`scripts/check-no-cloud-inference.mjs`** is a static guard. It strips
   comments from the QVAC source (`src/capture/**`, `scripts/**`) and the
   smoke prompt, then fails CI if any of the following appear in code:
   - `fetch(` calls
   - `XMLHttpRequest`
   - `axios` / `node-fetch` imports
   - `openai` / `@openai/*` or `anthropic` / `@anthropic/*` imports
   - any `http://` or `https://` URL (other than `localhost` / `127.0.0.1`)

Run the guard:

```sh
node scripts/check-no-cloud-inference.mjs
```

Expected output:

```
no-cloud-inference check passed: no cloud HTTP, fetch, or inference SDK imports in QVAC source.
```

## Smoke test

The smoke test loads the configured model, runs a single typed completion
against a contract-shaped prompt, handles failure, and unloads the model
— guaranteeing the unload runs even when the load or the completion
throws. The orchestration is pure (it depends only on the `QvacRuntime`
interface) and is exercised by `qvac-smoke.test.ts` against an injected
fake runtime so the smoke test is CI-runnable from any Node environment.

### CI command

```sh
npx vitest run src/capture/qvac-smoke.test.ts
```

Expected output (abridged):

```
 RUN  v3.2.7 <repo>
 ✓ src/capture/qvac-smoke.test.ts (9 tests) 11ms
 Test Files  1 passed (1)
      Tests  9 passed (9)
```

The nine tests cover the happy path (load → complete → unload), a load
failure (no complete/unload), a completion failure (model still unloaded),
an unload failure (the failure is reported and the model is not left
loaded silently), a non-contract completion shape, a malformed JSON
completion, the injected clock, the no-cloud prompt contents, and the
non-native fallback rejecting every operation with a clear
`QvacRuntimeUnavailableError`.

### Device command

On a physical Android or iOS device with the QVAC worker reachable, run
the native smoke through the Expo dev client. The exact command depends
on the app shell (the MVP capture flow wires the smoke entry into a
dev-only screen); the canonical reference is:

```sh
npx expo start --dev-client --android   # or --ios
# then trigger the smoke entry from the dev menu and copy the printed
# JSON into the PR "Validation" section.
```

The device run produces a `QvacSmokeResult` JSON the reviewer pastes into
the PR:

```jsonc
{
  "loaded": true,
  "modelId": "<handle from loadModel>",
  "completion": {
    "contentText": "{\"observations\":[{ ... }]}",
    "isContractShape": true
  },
  "failure": null,
  "unloaded": true,
  "durationMs": 1234
}
```

If the device run cannot be performed during review, the CI output above
plus the no-cloud guard output are recorded in the PR as the reproducible
proof of the smoke orchestration and the offline-only guarantee; the
device command is documented here for the reviewer to execute on hardware.

## Recorded result (PR template)

```
## Validation

- `node scripts/check-no-cloud-inference.mjs` -> no-cloud-inference check passed.
- `npx vitest run src/capture/qvac-smoke.test.ts` -> 9/9 tests passed.
- Device command (Android/iOS): <the JSON output above> OR
  "device run not performed in this PR; CI smoke + no-cloud guard are the
   reproducible evidence; the device command in
   docs/qvac/runtime-and-smoke.md is the reviewer-facing step."
```

## Failure handling

The smoke orchestration records every step in the returned
`QvacSmokeResult`. The capture flow and the PR review read the same
shape:

- `loaded: false` and `failure: { message }` → the worker could not load
  the model. The capture flow surfaces this as `ExtractionError`.
- `completion: null` and `failure: { message }` → the model loaded but
  the completion crashed. The model is still unloaded
  (`unloaded: true`) so the device does not retain a half-loaded worker.
- `unloaded: false` and `failure: { message }` → unload itself failed.
  The reviewer sees the combined message and the device keeps the model
  handle only because the worker refused to release it; the capture flow
  surfaces the error and the smoke test exits non-zero.

The non-contract completion shape (`isContractShape: false`) is
recorded as a soft failure: the smoke still unloads the model, the
reviewer sees the offending `contentText`, and the extractor is
expected to reject the content via the typed extraction contract (issue
#5).
