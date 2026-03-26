/**
 * Helper for generating personalized study plans from quiz analytics.
 * If no AI endpoint is configured, returns a deterministic plan based on stats.
 */
const env = typeof import.meta !== "undefined" ? import.meta.env || {} : {};
const STUDY_PLAN_ENDPOINT = env.VITE_AI_STUDY_ENDPOINT;
import { callAiEndpoint, redactString } from "./apiClient.js";

function fallbackStudyPlan({ accuracy, recentSessions = [], topicStats = [] }) {
  const weakestTopics = topicStats
    .filter((topic) => topic.total >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map((topic) => `${topic.sectionTitle || "General"} (${topic.accuracy}% accuracy)`);

  const averageAccuracy = typeof accuracy === "number" ? accuracy : null;
  const sessionCount = recentSessions.length;
  const flaggedSessions = recentSessions.filter((session) => session.flaggedCount > 0);

  return {
    summary: `You have answered ${sessionCount} sessions with ${averageAccuracy ?? "--"}% accuracy.`,
    focusAreas: weakestTopics.length
      ? weakestTopics
      : ["Revisit foundational ISTQB syllabus sections to reinforce core concepts."],
    nextSteps: [
      "Schedule a focused review session on the weakest topic in the next 48 hours.",
      "Create 3 practice questions of your own on each focus area to deepen understanding.",
    ],
    reinforcement: flaggedSessions.length
      ? `Review ${flaggedSessions.length} session(s) with flagged questions to close knowledge gaps.`
      : "Great job keeping questions unflagged! Maintain momentum with a mixed-skill session.",
  };
}

export async function generateStudyPlan(payload) {
  if (!STUDY_PLAN_ENDPOINT) {
    return fallbackStudyPlan(payload);
  }
  try {
    const data = await callAiEndpoint({
      endpoint: STUDY_PLAN_ENDPOINT,
      endpointName: "study-plan",
      payload,
    });
    if (data?.summary && Array.isArray(data?.focusAreas)) {
      return data;
    }
    return fallbackStudyPlan(payload);
  } catch (error) {
    console.warn("AI study plan error, using fallback:", error?.message);
    return fallbackStudyPlan(payload);
  }
}
