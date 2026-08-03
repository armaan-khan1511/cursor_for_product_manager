import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  // Thrown lazily at request time, not at build/import time, so `next build`
  // doesn't fail in environments where the key isn't set yet (e.g. CI).
  console.warn("[gemini] GEMINI_API_KEY is not set. API routes will fail until it is.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// Priority list of official Gemini models — automatically cycles if a model hits high demand, rate limits, or 404
export const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
];

export const GEMINI_MODEL = GEMINI_MODELS[0];

/**
 * Calls Gemini and forces a JSON response that matches the given schema.
 * Automatically retries with fallback models if a model experiences high demand or transient errors.
 */
export async function generateStructuredJSON<T>(params: {
  prompt: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
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
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      lastError = error instanceof Error ? error : new Error(errMsg);

      const isRetryable =
        errMsg.includes("high demand") ||
        errMsg.includes("429") ||
        errMsg.includes("503") ||
        errMsg.includes("500") ||
        errMsg.includes("404") ||
        errMsg.includes("NOT_FOUND") ||
        errMsg.includes("not found") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("overloaded");

      if (isRetryable) {
        console.warn(`[gemini] Model '${model}' failed (${errMsg}). Trying fallback model...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      // If non-retryable (e.g. invalid API key), rethrow immediately
      throw lastError;
    }
  }

  throw lastError || new Error("Gemini AI is currently experiencing high demand across models. Please try again shortly.");
}
