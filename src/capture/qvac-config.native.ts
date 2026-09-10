import { File, Paths } from 'expo-file-system';

/**
 * The SDK waits `httpConnectionTimeoutMs` (default 10s) on the cached-model
 * freshness HEAD before falling back to the local GGUF header, so an offline
 * load pays that wait; 3s keeps the check meaningful online and short offline.
 */
export const QVAC_HTTP_CONNECTION_TIMEOUT_MS = 3000;

export function ensureQvacRuntimeConfig(): void {
  const file = new File(Paths.document, 'qvac.config.json');
  file.create({ intermediates: true, overwrite: true });
  file.write(
    JSON.stringify({
      httpConnectionTimeoutMs: QVAC_HTTP_CONNECTION_TIMEOUT_MS,
      loggerConsoleOutput: true,
      loggerLevel: 'info',
    }),
  );
}
