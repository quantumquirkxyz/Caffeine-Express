/**
 * Non-native targets never run the QVAC worker, so they need no runtime
 * config file; native builds override this module with `qvac-config.native.ts`.
 */
export function ensureQvacRuntimeConfig(): void {}
