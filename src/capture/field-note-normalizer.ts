import { QvacRuntimeUnavailableError } from './qvac-runtime';

export async function normalizeFieldNote(_modelId: string, _transcript: string): Promise<string> {
  throw new QvacRuntimeUnavailableError(
    'QVAC note normalization is available on a physical Android or iOS device.',
  );
}
