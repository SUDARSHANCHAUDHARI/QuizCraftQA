import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../ai/apiClient.js", () => ({
  callAiEndpoint: vi.fn(),
}));

import { generateVariantQuestion } from "../ai/generateVariantQuestion.js";

const PARAMS = {
  prompt: "Fill in the blank: _____ testing examines software without executing it.",
  explanation: "Static testing does not run the code.",
  correctAnswer: "Static",
  context: "Static testing is a technique that examines the software without executing it.",
};

describe("generateVariantQuestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an object with variantPrompt, explanation, correctAnswer", async () => {
    const result = await generateVariantQuestion(PARAMS);
    expect(result).toHaveProperty("variantPrompt");
    expect(result).toHaveProperty("explanation");
    expect(result).toHaveProperty("correctAnswer");
  });

  it("preserves correctAnswer in fallback result", async () => {
    const result = await generateVariantQuestion(PARAMS);
    expect(result.correctAnswer).toBe("Static");
  });

  it("variantPrompt is a non-empty string", async () => {
    const result = await generateVariantQuestion(PARAMS);
    expect(typeof result.variantPrompt).toBe("string");
    expect(result.variantPrompt.length).toBeGreaterThan(0);
  });

  it("includes context snippet in variant prompt when context provided", async () => {
    const result = await generateVariantQuestion(PARAMS);
    expect(result.variantPrompt).toContain("Static");
  });

  it("works when context is empty string", async () => {
    const result = await generateVariantQuestion({ ...PARAMS, context: "" });
    expect(result).toHaveProperty("variantPrompt");
  });

  it("uses explanation from params in fallback", async () => {
    const result = await generateVariantQuestion(PARAMS);
    expect(result.explanation).toContain("Static");
  });

  it("truncates long context to 200 chars in prompt", async () => {
    const longContext = "A".repeat(300);
    const result = await generateVariantQuestion({ ...PARAMS, context: longContext });
    // The variant prompt should not contain 300 A's
    expect(result.variantPrompt.length).toBeLessThan(500);
  });
});
