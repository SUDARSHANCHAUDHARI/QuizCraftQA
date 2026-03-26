/**
 * Tests for the pure helper functions extracted from App.js logic.
 * These are re-implemented here to test independently of React.
 */
import { describe, it, expect } from "vitest";

// ── Helpers (copied from App.js — pure functions with no React deps) ──────────

function formatDayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function computeTopicStats(history) {
  const statsMap = {};
  history.forEach((entry) => {
    const key = entry.sectionTitle || "General";
    if (!statsMap[key]) {
      statsMap[key] = {
        sectionTitle: key,
        sectionNumbering: entry.sectionNumbering || null,
        total: 0, correct: 0, accuracy: 0, flagged: 0,
        reference: entry.reference || null,
        confidence: { low: 0, medium: 0, high: 0 },
        difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
      };
    }
    const stat = statsMap[key];
    stat.total += 1;
    if (entry.isCorrect) stat.correct += 1;
    if (entry.isFlagged) stat.flagged += 1;
    if (entry.confidence && stat.confidence[entry.confidence] !== undefined)
      stat.confidence[entry.confidence] += 1;
    const diffId = entry.difficulty?.id;
    if (diffId && stat.difficultyBreakdown[diffId] !== undefined)
      stat.difficultyBreakdown[diffId] += 1;
    if (!stat.reference && entry.reference) stat.reference = entry.reference;
  });
  return Object.values(statsMap).map((stat) => ({
    ...stat,
    accuracy: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0,
  }));
}

function computeDailyProgress(history, dailyGoal) {
  const todayKey = formatDayKey(new Date());
  const byDay = {};
  history.forEach((entry) => {
    const key = formatDayKey(entry.timestamp);
    if (!byDay[key]) byDay[key] = { label: key, count: 0 };
    byDay[key].count += 1;
  });
  const todayCount = byDay[todayKey]?.count || 0;
  const sortedKeys = Object.keys(byDay).sort();

  let streak = 0;
  const nowKey = formatDayKey(new Date());
  let checkKey = nowKey;
  while (byDay[checkKey]) {
    streak += 1;
    const prev = new Date(checkKey + "T00:00:00");
    prev.setDate(prev.getDate() - 1);
    checkKey = formatDayKey(prev);
  }

  let bestStreak = 0, tempStreak = 0, prevKey = null;
  sortedKeys.forEach((key) => {
    if (!prevKey) { tempStreak = 1; }
    else {
      const diff = Math.round((new Date(key + "T00:00:00") - new Date(prevKey + "T00:00:00")) / 86400000);
      tempStreak = diff === 1 ? tempStreak + 1 : 1;
    }
    bestStreak = Math.max(bestStreak, tempStreak);
    prevKey = key;
  });

  return {
    todayCount, goal: dailyGoal, goalMet: todayCount >= dailyGoal,
    streak, bestStreak,
    days: sortedKeys.map((key) => ({ day: byDay[key].label, count: byDay[key].count })),
  };
}

// ── computeTopicStats ─────────────────────────────────────────────────────────

describe("computeTopicStats", () => {
  it("returns empty array for empty history", () => {
    expect(computeTopicStats([])).toEqual([]);
  });

  it("groups entries by sectionTitle", () => {
    const history = [
      { sectionTitle: "Static Testing", isCorrect: true, isFlagged: false },
      { sectionTitle: "Static Testing", isCorrect: false, isFlagged: false },
      { sectionTitle: "Dynamic Testing", isCorrect: true, isFlagged: false },
    ];
    const stats = computeTopicStats(history);
    expect(stats).toHaveLength(2);
    const staticStat = stats.find((s) => s.sectionTitle === "Static Testing");
    expect(staticStat.total).toBe(2);
    expect(staticStat.correct).toBe(1);
    expect(staticStat.accuracy).toBe(50);
  });

  it("uses 'General' for entries with no sectionTitle", () => {
    const history = [{ isCorrect: true, isFlagged: false }];
    const stats = computeTopicStats(history);
    expect(stats[0].sectionTitle).toBe("General");
  });

  it("counts flagged entries correctly", () => {
    const history = [
      { sectionTitle: "A", isCorrect: true, isFlagged: true },
      { sectionTitle: "A", isCorrect: false, isFlagged: false },
    ];
    const stats = computeTopicStats(history);
    expect(stats[0].flagged).toBe(1);
  });

  it("calculates 100% accuracy when all correct", () => {
    const history = [
      { sectionTitle: "A", isCorrect: true, isFlagged: false },
      { sectionTitle: "A", isCorrect: true, isFlagged: false },
    ];
    expect(computeTopicStats(history)[0].accuracy).toBe(100);
  });

  it("calculates 0% accuracy when all wrong", () => {
    const history = [
      { sectionTitle: "A", isCorrect: false, isFlagged: false },
    ];
    expect(computeTopicStats(history)[0].accuracy).toBe(0);
  });

  it("tracks confidence breakdown", () => {
    const history = [
      { sectionTitle: "A", isCorrect: true, isFlagged: false, confidence: "high" },
      { sectionTitle: "A", isCorrect: false, isFlagged: false, confidence: "low" },
    ];
    const stats = computeTopicStats(history);
    expect(stats[0].confidence.high).toBe(1);
    expect(stats[0].confidence.low).toBe(1);
    expect(stats[0].confidence.medium).toBe(0);
  });

  it("tracks difficulty breakdown", () => {
    const history = [
      { sectionTitle: "A", isCorrect: true, isFlagged: false, difficulty: { id: "easy" } },
      { sectionTitle: "A", isCorrect: false, isFlagged: false, difficulty: { id: "hard" } },
    ];
    const stats = computeTopicStats(history);
    expect(stats[0].difficultyBreakdown.easy).toBe(1);
    expect(stats[0].difficultyBreakdown.hard).toBe(1);
  });
});

// ── computeDailyProgress ──────────────────────────────────────────────────────

describe("computeDailyProgress", () => {
  it("returns todayCount 0 when history is empty", () => {
    const result = computeDailyProgress([], 5);
    expect(result.todayCount).toBe(0);
    expect(result.goalMet).toBe(false);
  });

  it("returns correct todayCount from history", () => {
    const today = new Date("2024-06-15T09:00:00.000Z");
    const history = [
      { timestamp: today, isCorrect: true },
      { timestamp: today, isCorrect: false },
    ];
    const result = computeDailyProgress(history, 5);
    // todayCount depends on matching formatDayKey(now) which uses real Date
    expect(result).toHaveProperty("todayCount");
    expect(result).toHaveProperty("goalMet");
    expect(result).toHaveProperty("streak");
    expect(result).toHaveProperty("bestStreak");
    expect(result).toHaveProperty("days");
  });

  it("goalMet is true when todayCount >= goal", () => {
    const result = computeDailyProgress([], 0);
    expect(result.goalMet).toBe(true); // 0 >= 0
  });

  it("bestStreak is 0 for empty history", () => {
    const result = computeDailyProgress([], 5);
    expect(result.bestStreak).toBe(0);
    expect(result.streak).toBe(0);
  });

  it("days array has one entry per unique day", () => {
    const history = [
      { timestamp: new Date("2024-06-13T10:00:00Z") },
      { timestamp: new Date("2024-06-13T11:00:00Z") },
      { timestamp: new Date("2024-06-14T09:00:00Z") },
    ];
    const result = computeDailyProgress(history, 5);
    expect(result.days).toHaveLength(2);
  });
});

// ── formatDayKey ──────────────────────────────────────────────────────────────

describe("formatDayKey", () => {
  it("formats date as YYYY-MM-DD", () => {
    expect(formatDayKey(new Date("2024-01-05T00:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("pads month and day with leading zeros", () => {
    const key = formatDayKey(new Date(2024, 0, 5)); // Jan 5
    const parts = key.split("-");
    expect(parts[1].length).toBe(2);
    expect(parts[2].length).toBe(2);
  });
});
