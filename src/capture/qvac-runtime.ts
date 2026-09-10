export async function loadQvacModel(): Promise<string> {
  throw new Error('QVAC extraction is available on Android and iOS only.');
}

export async function unloadQvacModel(_modelId: string): Promise<void> {}
