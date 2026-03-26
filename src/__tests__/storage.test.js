import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock idb-keyval before importing storage
vi.mock("idb-keyval", () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

import { get, set } from "idb-keyval";
import {
  loadStoredPDFs,
  storePDFs,
  loadQuestionHistory,
  storeQuestionHistory,
  loadSettings,
  storeSettings,
} from "../storage.js";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── loadStoredPDFs ────────────────────────────────────────────────────────────

describe("loadStoredPDFs", () => {
  it("returns empty array when nothing stored", async () => {
    get.mockResolvedValue(undefined);
    const result = await loadStoredPDFs();
    expect(result).toEqual([]);
  });

  it("returns empty array when stored value is not an array", async () => {
    get.mockResolvedValue("bad data");
    const result = await loadStoredPDFs();
    expect(result).toEqual([]);
  });

  it("converts uploadedAt ISO string to Date", async () => {
    const iso = "2024-01-15T10:00:00.000Z";
    get.mockResolvedValue([{ id: "1", name: "test.pdf", uploadedAt: iso }]);
    const result = await loadStoredPDFs();
    expect(result[0].uploadedAt).toBeInstanceOf(Date);
    expect(result[0].uploadedAt.toISOString()).toBe(iso);
  });

  it("falls back to current date when uploadedAt is missing", async () => {
    get.mockResolvedValue([{ id: "1", name: "test.pdf" }]);
    const before = Date.now();
    const result = await loadStoredPDFs();
    const after = Date.now();
    expect(result[0].uploadedAt).toBeInstanceOf(Date);
    expect(result[0].uploadedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(result[0].uploadedAt.getTime()).toBeLessThanOrEqual(after);
  });

  it("returns empty array and warns when storage throws", async () => {
    get.mockRejectedValue(new Error("IndexedDB unavailable"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await loadStoredPDFs();
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ── storePDFs ─────────────────────────────────────────────────────────────────

describe("storePDFs", () => {
  it("serialises Date to ISO string before storing", async () => {
    set.mockResolvedValue(undefined);
    const date = new Date("2024-03-01T12:00:00.000Z");
    await storePDFs([{ id: "1", name: "test.pdf", uploadedAt: date }]);
    const stored = set.mock.calls[0][1];
    expect(stored[0].uploadedAt).toBe("2024-03-01T12:00:00.000Z");
  });

  it("leaves non-Date uploadedAt values unchanged", async () => {
    set.mockResolvedValue(undefined);
    await storePDFs([{ id: "1", name: "test.pdf", uploadedAt: "already-string" }]);
    const stored = set.mock.calls[0][1];
    expect(stored[0].uploadedAt).toBe("already-string");
  });

  it("does not throw when storage fails", async () => {
    set.mockRejectedValue(new Error("Storage full"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(storePDFs([])).resolves.toBeUndefined();
  });
});

// ── loadQuestionHistory ───────────────────────────────────────────────────────

describe("loadQuestionHistory", () => {
  it("returns empty array when nothing stored", async () => {
    get.mockResolvedValue(undefined);
    expect(await loadQuestionHistory()).toEqual([]);
  });

  it("converts timestamp strings to Date objects", async () => {
    const iso = "2024-06-01T08:00:00.000Z";
    get.mockResolvedValue([{ id: "h1", isCorrect: true, timestamp: iso }]);
    const result = await loadQuestionHistory();
    expect(result[0].timestamp).toBeInstanceOf(Date);
  });

  it("uses current date when timestamp is missing", async () => {
    get.mockResolvedValue([{ id: "h1", isCorrect: false }]);
    const result = await loadQuestionHistory();
    expect(result[0].timestamp).toBeInstanceOf(Date);
  });
});

// ── storeQuestionHistory ──────────────────────────────────────────────────────

describe("storeQuestionHistory", () => {
  it("serialises Date timestamp to ISO string", async () => {
    set.mockResolvedValue(undefined);
    const date = new Date("2024-06-01T08:00:00.000Z");
    await storeQuestionHistory([{ id: "h1", timestamp: date }]);
    const stored = set.mock.calls[0][1];
    expect(stored[0].timestamp).toBe("2024-06-01T08:00:00.000Z");
  });
});

// ── loadSettings ──────────────────────────────────────────────────────────────

describe("loadSettings", () => {
  it("returns stored settings object", async () => {
    get.mockResolvedValue({ dailyGoal: 10 });
    const result = await loadSettings();
    expect(result.dailyGoal).toBe(10);
  });

  it("returns default when nothing stored", async () => {
    get.mockResolvedValue(null);
    const result = await loadSettings();
    expect(result).toEqual({ dailyGoal: 5 });
  });

  it("returns default when stored value is not an object", async () => {
    get.mockResolvedValue(42);
    const result = await loadSettings();
    expect(result).toEqual({ dailyGoal: 5 });
  });
});

// ── storeSettings ─────────────────────────────────────────────────────────────

describe("storeSettings", () => {
  it("calls set with the settings object", async () => {
    set.mockResolvedValue(undefined);
    await storeSettings({ dailyGoal: 15 });
    expect(set).toHaveBeenCalledWith(
      expect.any(String),
      { dailyGoal: 15 }
    );
  });
});
