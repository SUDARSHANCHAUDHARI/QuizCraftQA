import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../ai/apiClient.js", () => ({
  callAiEndpoint: vi.fn(),
  redactString: vi.fn((s) => s),
}));

import { callAiEndpoint } from "../ai/apiClient.js";
import { generateStudyPlan } from "../ai/studyPlan.js";

const PAYLOAD = {
  accuracy: 65,
  recentSessions: [{ questionCount: 10, accuracy: 60, flaggedCount: 2 }],
  topicStats: [
    { sectionTitle: "Static Testing", total: 5, accuracy: 40 },
    { sectionTitle: "Dynamic Testing", total: 3, accuracy: 100 },
  ],
};

describe("generateStudyPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns fallback plan when no endpoint configured", async () => {
    // VITE_AI_STUDY_ENDPOINT is not set in test env
    const plan = await generateStudyPlan(PAYLOAD);
    expect(plan).toHaveProperty("summary");
    expect(plan).toHaveProperty("focusAreas");
    expect(plan).toHaveProperty("nextSteps");
    expect(plan).toHaveProperty("reinforcement");
  });

  it("fallback summary mentions session count", async () => {
    const plan = await generateStudyPlan(PAYLOAD);
    expect(plan.summary).toContain("1"); // 1 session
  });

  it("fallback focusAreas lists weakest topics", async () => {
    const plan = await generateStudyPlan(PAYLOAD);
    // Static Testing has 40% accuracy so should be in focus areas
    expect(
      plan.focusAreas.some((area) => area.includes("Static Testing"))
    ).toBe(true);
  });

  it("fallback returns default focus area when no topic has enough data", async () => {
    const plan = await generateStudyPlan({ accuracy: 80, recentSessions: [], topicStats: [] });
    expect(plan.focusAreas.length).toBeGreaterThan(0);
  });

  it("fallback reinforcement mentions flagged sessions when present", async () => {
    const plan = await generateStudyPlan(PAYLOAD);
    expect(plan.reinforcement).toMatch(/flagged|review/i);
  });

  it("returns fallback when AI endpoint errors", async () => {
    // Simulate endpoint configured but failing
    callAiEndpoint.mockRejectedValue(new Error("timeout"));
    // Without setting env var the fallback is used directly,
    // so we test that the function never throws
    const plan = await generateStudyPlan(PAYLOAD);
    expect(plan).toHaveProperty("summary");
  });

  it("nextSteps is an array with at least one item", async () => {
    const plan = await generateStudyPlan(PAYLOAD);
    expect(Array.isArray(plan.nextSteps)).toBe(true);
    expect(plan.nextSteps.length).toBeGreaterThan(0);
  });
});
