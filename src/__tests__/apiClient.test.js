import { describe, it, expect, vi, beforeEach } from "vitest";
import { callAiEndpoint, redactString } from "../ai/apiClient.js";

// ── redactString ──────────────────────────────────────────────────────────────

describe("redactString", () => {
  it("returns the string unchanged when no credentials present", () => {
    expect(redactString("hello world")).toBe("hello world");
  });

  it("returns non-string values unchanged", () => {
    expect(redactString(null)).toBeNull();
    expect(redactString(undefined)).toBeUndefined();
    expect(redactString(42)).toBe(42);
  });

  it("redacts Bearer tokens", () => {
    const result = redactString("Authorization: Bearer secret-token-abc123");
    expect(result).not.toContain("secret-token-abc123");
    // The Authorization: pattern runs after Bearer, so the full header is redacted
    expect(result).not.toContain("Bearer secret-token-abc123");
    expect(result).toContain("[REDACTED]");
  });

  it("redacts api_key patterns", () => {
    const result = redactString("api_key: my-secret-key");
    expect(result).not.toContain("my-secret-key");
  });

  it("handles empty string", () => {
    expect(redactString("")).toBe("");
  });
});

// ── callAiEndpoint ────────────────────────────────────────────────────────────

describe("callAiEndpoint", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when endpoint is empty", async () => {
    await expect(
      callAiEndpoint({ endpoint: "", endpointName: "test", payload: {} })
    ).rejects.toThrow("No endpoint configured");
  });

  it("throws when endpoint is null", async () => {
    await expect(
      callAiEndpoint({ endpoint: null, endpointName: "test", payload: {} })
    ).rejects.toThrow("No endpoint configured");
  });

  it("returns parsed JSON on success", async () => {
    const mockData = { summary: "test plan", focusAreas: [] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    }));
    const result = await callAiEndpoint({
      endpoint: "https://api.example.com/plan",
      endpointName: "study-plan",
      payload: { accuracy: 80 },
    });
    expect(result).toEqual(mockData);
  });

  it("sends POST request with JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    await callAiEndpoint({
      endpoint: "https://api.example.com/plan",
      endpointName: "study-plan",
      payload: { accuracy: 80 },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/plan",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accuracy: 80 }),
      })
    );
  });

  it("throws on non-ok HTTP response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    }));
    await expect(
      callAiEndpoint({
        endpoint: "https://api.example.com/plan",
        endpointName: "study-plan",
        payload: {},
      })
    ).rejects.toThrow("500");
  });

  it("throws on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(
      callAiEndpoint({
        endpoint: "https://api.example.com/plan",
        endpointName: "study-plan",
        payload: {},
      })
    ).rejects.toThrow("network request failed");
  });

  it("throws on invalid JSON response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new SyntaxError("Unexpected token"); },
    }));
    await expect(
      callAiEndpoint({
        endpoint: "https://api.example.com/plan",
        endpointName: "study-plan",
        payload: {},
      })
    ).rejects.toThrow("parse JSON");
  });
});
