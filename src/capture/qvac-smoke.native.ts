/**
 * QVAC native smoke entry: runs the MVP smoke test on the on-device QVAC
 * worker through `NativeQvacRuntime` and prints a machine-parseable result
 * the reviewer can paste into the PR.
 *
 * Invoke on a physical Android or iOS device through the Expo dev client
 * (see `docs/qvac/runtime-and-smoke.md` for the exact command and the
 * recorded-result template). The orchestration is CI-verifiable against
 * the fake runtime in `qvac-smoke.test.ts`; this file is the device
 * counterpart and is the one whose output is recorded in the PR.
 */
import { runQvacSmokeTest } from './qvac-smoke';
import { NativeQvacRuntime } from './qvac-runtime.native';

export async function runNativeQvacSmoke(): Promise<ReturnType<typeof runQvacSmokeTest>> {
  return runQvacSmokeTest(new NativeQvacRuntime());
}
