import { completion } from '@qvac/sdk';

const NORMALIZE_SYSTEM = `You clean up dictated field notes before structured extraction.
Preserve every factual claim, number, brand, model, place, uncertainty marker, and negation.
Do not invent missing facts. Do not infer equipment that was not mentioned.
Remove filler words and obvious speech disfluencies, repair punctuation, and reorder fragments only when it improves readability.
Keep the language used by the speaker. Return only the cleaned field note, with no commentary.`;

export async function normalizeFieldNote(modelId: string, transcript: string): Promise<string> {
  const run = completion({
    modelId,
    history: [
      { role: 'system', content: NORMALIZE_SYSTEM },
      { role: 'user', content: transcript },
    ],
    stream: false,
  });
  const result = await run.final;
  return result.contentText.trim();
}
