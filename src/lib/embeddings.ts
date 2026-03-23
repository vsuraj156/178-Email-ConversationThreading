const HARVARD_BASE =
  "https://go.apis.huit.harvard.edu/ais-openai-direct-limited-schools/v1";
const EMBEDDING_MODEL = "text-embedding-3-small";

// Module-level cache: keyed by text so identical messages don't get re-embedded
const cache = new Map<string, number[]>();

/**
 * Fetches embeddings for an array of texts via the Harvard OpenAI gateway.
 * Returns one embedding vector per input text, in the same order.
 * Throws if HARVARD_API_KEY is not set or the API call fails.
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.HARVARD_API_KEY;
  if (!apiKey) throw new Error("HARVARD_API_KEY is not set");

  const results: number[][] = new Array(texts.length);
  const uncachedPositions: number[] = [];
  const uncachedTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const cached = cache.get(texts[i]);
    if (cached) {
      results[i] = cached;
    } else {
      uncachedPositions.push(i);
      uncachedTexts.push(texts[i].slice(0, 1500)); // stay well under token limits
    }
  }

  if (uncachedTexts.length === 0) return results;

  const response = await fetch(`${HARVARD_BASE}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: uncachedTexts }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Embeddings API ${response.status}: ${body}`);
  }

  const data = await response.json();
  const items: { index: number; embedding: number[] }[] = data.data;

  for (const { index, embedding } of items) {
    const originalPos = uncachedPositions[index];
    results[originalPos] = embedding;
    cache.set(texts[originalPos], embedding);
  }

  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
