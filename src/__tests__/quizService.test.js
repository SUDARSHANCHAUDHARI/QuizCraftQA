import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies before importing the module under test ──────────────────
vi.mock("../pdfService.js", () => ({
  getPdfAnalysis: vi.fn(),
}));
vi.mock("../referenceMap.js", () => ({
  findReferenceForSection: vi.fn(() => null),
}));

import { getPdfAnalysis } from "../pdfService.js";
import {
  generateRandomQuestionFromPdfs,
  checkAnswerWithExplanation,
} from "../quizService.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SAMPLE_TEXT =
  "Static testing is a technique that examines the software without executing it. " +
  "Dynamic testing involves running the software to observe behaviour during execution. " +
  "Test planning defines the scope, approach, resources and schedule of testing activities. " +
  "A test case specifies preconditions, inputs, actions, expected results and postconditions. " +
  "Regression testing verifies that recent changes have not broken previously working features. " +
  "Exploratory testing is a simultaneous process of learning, test design and test execution.";

const MOCK_PDF = {
  id: "pdf-1",
  name: "istqb.pdf",
  dataUrl: "data:application/pdf;base64,abc",
};

const MOCK_ANALYSIS = {
  text: SAMPLE_TEXT,
  headings: [
    { title: "1 Static Testing", level: 1, charIndex: 0 },
    { title: "2 Dynamic Testing", level: 1, charIndex: 80 },
  ],
};

// ── generateRandomQuestionFromPdfs ────────────────────────────────────────────

describe("generateRandomQuestionFromPdfs", () => {
  beforeEach(() => {
    getPdfAnalysis.mockResolvedValue(MOCK_ANALYSIS);
  });

  it("throws when pdfs array is empty", async () => {
    await expect(generateRandomQuestionFromPdfs([])).rejects.toThrow(
      "No PDFs uploaded"
    );
  });

  it("throws when pdfs array is null/undefined", async () => {
    await expect(generateRandomQuestionFromPdfs(null)).rejects.toThrow();
    await expect(generateRandomQuestionFromPdfs(undefined)).rejects.toThrow();
  });

  it("throws when no PDF has a dataUrl", async () => {
    await expect(
      generateRandomQuestionFromPdfs([{ id: "x", name: "x.pdf" }])
    ).rejects.toThrow("missing data");
  });

  it("returns a question with required fields", async () => {
    const question = await generateRandomQuestionFromPdfs([MOCK_PDF]);
    expect(question).toHaveProperty("id");
    expect(question).toHaveProperty("type");
    expect(question).toHaveProperty("prompt");
    expect(question).toHaveProperty("options");
    expect(question).toHaveProperty("answerIndex");
    expect(question).toHaveProperty("correctAnswer");
    expect(question).toHaveProperty("difficulty");
  });

  it("returns one of the three valid question types", async () => {
    const question = await generateRandomQuestionFromPdfs([MOCK_PDF]);
    expect(["fillInBlank", "trueFalse", "multipleChoice"]).toContain(question.type);
  });

  it("options array contains the correct answer", async () => {
    const question = await generateRandomQuestionFromPdfs([MOCK_PDF]);
    expect(question.options[question.answerIndex]).toBe(question.correctAnswer);
  });

  it("difficulty has label and id", async () => {
    const question = await generateRandomQuestionFromPdfs([MOCK_PDF]);
    expect(["Easy", "Medium", "Hard"]).toContain(question.difficulty.label);
    expect(["easy", "medium", "hard"]).toContain(question.difficulty.id);
  });

  it("sets sourcePdf to the PDF name", async () => {
    const question = await generateRandomQuestionFromPdfs([MOCK_PDF]);
    expect(question.sourcePdf).toBe("istqb.pdf");
  });

  it("works with multiple PDFs by picking one", async () => {
    const pdfs = [
      MOCK_PDF,
      { id: "pdf-2", name: "istqb2.pdf", dataUrl: "data:application/pdf;base64,def" },
    ];
    const question = await generateRandomQuestionFromPdfs(pdfs);
    expect(["istqb.pdf", "istqb2.pdf"]).toContain(question.sourcePdf);
  });
});

// ── checkAnswerWithExplanation ────────────────────────────────────────────────

describe("checkAnswerWithExplanation", () => {
  const baseQuestion = {
    type: "fillInBlank",
    prompt: "Fill in the blank: _____ testing examines software without executing it.",
    options: ["Static", "Dynamic", "Regression", "Exploratory"],
    answerIndex: 0,
    correctAnswer: "Static",
    keyTerm: "Static",
    context: "Static testing examines software without executing it.",
    sourcePdf: "istqb.pdf",
    sectionTitle: null,
    reference: null,
    contextSnippet: "Static testing is a technique.",
  };

  it("throws when question is null", async () => {
    await expect(checkAnswerWithExplanation(null, 0)).rejects.toThrow(
      "Question payload missing"
    );
  });

  it("returns isCorrect true for correct answer index", async () => {
    const result = await checkAnswerWithExplanation(baseQuestion, 0);
    expect(result.isCorrect).toBe(true);
  });

  it("returns isCorrect false for wrong answer index", async () => {
    const result = await checkAnswerWithExplanation(baseQuestion, 1);
    expect(result.isCorrect).toBe(false);
  });

  it("result contains explanation string", async () => {
    const result = await checkAnswerWithExplanation(baseQuestion, 0);
    expect(typeof result.explanation).toBe("string");
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it("result contains correctAnswer", async () => {
    const result = await checkAnswerWithExplanation(baseQuestion, 1);
    expect(result.correctAnswer).toBe("Static");
  });

  it("handles trueFalse question type", async () => {
    const tfQuestion = {
      ...baseQuestion,
      type: "trueFalse",
      options: ["True", "False"],
      answerIndex: 0,
      correctAnswer: "True",
      isTrueStatement: true,
      falseWord: null,
      statement: "Static testing examines software without executing it.",
    };
    const result = await checkAnswerWithExplanation(tfQuestion, 0);
    expect(result.isCorrect).toBe(true);
    expect(result.explanation).toMatch(/true/i);
  });

  it("handles multipleChoice question type", async () => {
    const mcQuestion = { ...baseQuestion, type: "multipleChoice" };
    const result = await checkAnswerWithExplanation(mcQuestion, 0);
    expect(result.isCorrect).toBe(true);
  });

  it("includes section title in explanation when present", async () => {
    const q = { ...baseQuestion, sectionTitle: "1 Static Testing" };
    const result = await checkAnswerWithExplanation(q, 0);
    expect(result.explanation).toContain("1 Static Testing");
  });

  it("includes reference label in explanation when present", async () => {
    const q = {
      ...baseQuestion,
      reference: { label: "ISTQB CTFL", url: "https://istqb.org" },
    };
    const result = await checkAnswerWithExplanation(q, 0);
    expect(result.explanation).toContain("ISTQB CTFL");
  });

  it("contextSnippet is returned in result", async () => {
    const result = await checkAnswerWithExplanation(baseQuestion, 0);
    expect(result.contextSnippet).toBe("Static testing is a technique.");
  });
});
