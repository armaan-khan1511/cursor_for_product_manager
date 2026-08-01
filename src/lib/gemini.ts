import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  // Thrown lazily at request time, not at build/import time, so `next build`
  // doesn't fail in environments where the key isn't set yet (e.g. CI).
  console.warn("[gemini] GEMINI_API_KEY is not set. API routes will fail until it is.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// Centralized so a future model bump (or Gemini -> another provider swap)
// only happens in one place.
export const GEMINI_MODEL = "gemini-flash-latest";

/**
 * Calls Gemini and forces a JSON response that matches the given schema.
 * Throws if the model key is missing or the response can't be parsed.
 */
export async function generateStructuredJSON<T>(params: {
  prompt: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: params.prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: params.schema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned malformed JSON.");
  }
}
