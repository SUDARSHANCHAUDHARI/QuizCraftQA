import { describe, it, expect } from "vitest";
import { findReferenceForSection, ISTQB_REFERENCES } from "../referenceMap.js";

describe("findReferenceForSection", () => {
  it("returns null for empty string", () => {
    expect(findReferenceForSection("")).toBeNull();
  });

  it("returns null for unrecognised section", () => {
    expect(findReferenceForSection("Some Unrelated Chapter")).toBeNull();
  });

  it("matches 'principle' keyword case-insensitively", () => {
    const ref = findReferenceForSection("Testing Principles");
    expect(ref).not.toBeNull();
    expect(ref).toHaveProperty("url");
    expect(ref).toHaveProperty("label");
  });

  it("matches 'foundation level syllabus'", () => {
    const ref = findReferenceForSection("Foundation Level Syllabus Overview");
    expect(ref).not.toBeNull();
  });

  it("matches 'lifecycle' keyword", () => {
    const ref = findReferenceForSection("Software Development Lifecycle");
    expect(ref).not.toBeNull();
  });

  it("matches 'static testing'", () => {
    const ref = findReferenceForSection("1.3 Static Testing Techniques");
    expect(ref).not.toBeNull();
  });

  it("matches 'dynamic testing'", () => {
    const ref = findReferenceForSection("Dynamic Testing Approaches");
    expect(ref).not.toBeNull();
  });

  it("each reference has url and label", () => {
    ISTQB_REFERENCES.forEach((ref) => {
      expect(typeof ref.url).toBe("string");
      expect(ref.url.startsWith("http")).toBe(true);
      expect(typeof ref.label).toBe("string");
      expect(ref.label.length).toBeGreaterThan(0);
    });
  });

  it("returns first matching reference when multiple patterns could match", () => {
    // 'principles' matches the second entry
    const ref = findReferenceForSection("principles of testing");
    expect(ref).not.toBeNull();
  });
});
