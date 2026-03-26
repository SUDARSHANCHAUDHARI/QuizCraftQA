/**
 * Generates a variant (alternate phrasing) of a quiz question.
 *
 * If VITE_AI_VARIANT_ENDPOINT is set, the request is forwarded to that endpoint.
 * Otherwise a deterministic fallback variant is returned so the feature is always
 * functional without any backend.
 */
import { callAiEndpoint } from "./apiClient.js";

const env = typeof import.meta !== "undefined" ? import.meta.env || {} : {};
const VARIANT_ENDPOINT = env.VITE_AI_VARIANT_ENDPOINT;

/**
 * Builds a deterministic variant without an AI call.
 * @param {{ prompt: string, explanation: string, correctAnswer: string, context: string }} params
 * @returns {{ variantPrompt: string, explanation: string, correctAnswer: string }}
 */
function fallbackVariant({ prompt, explanation, correctAnswer, context }) {
  const contextPhrase = context
    ? `Based on the passage: "${context.trim().slice(0, 200)}${context.length > 200 ? "…" : ""}" — `
    : "";
  const variantPrompt = `${contextPhrase}Which term correctly completes the following statement?\n\n"${prompt.replace(/^Fill in the blank:\s*/i, "").replace(/^True or false\?\s*/i, "").replace(/^Select the correct term.*\.\s*/i, "")}"`;

  return {
    variantPrompt,
    explanation: explanation || `The correct answer is "${correctAnswer}".`,
    correctAnswer,
  };
}

/**
 * @param {{ prompt: string, explanation: string, correctAnswer: string, context: string }} params
 * @returns {Promise<{ variantPrompt: string, explanation: string, correctAnswer: string }>}
 */
export async function generateVariantQuestion(params) {
  if (VARIANT_ENDPOINT) {
    try {
      const data = await callAiEndpoint({
        endpoint: VARIANT_ENDPOINT,
        endpointName: "variant-question",
        payload: params,
      });
      if (data?.variantPrompt && data?.correctAnswer) {
        return data;
      }
    } catch (error) {
      console.warn("AI variant endpoint failed, using fallback:", error?.message);
    }
  }

  // Simulate a brief async delay so callers always get a Promise
  await new Promise((resolve) => setTimeout(resolve, 200));
  return fallbackVariant(params);
}
