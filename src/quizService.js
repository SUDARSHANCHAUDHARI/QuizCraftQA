import { getPdfText } from "./pdfService.js";
import { getPdfAnalysis } from "./pdfService.js";
import { findReferenceForSection } from "./referenceMap.js";

const FALLBACK_DISTRACTORS = ["Quality", "Testing", "Planning", "Automation", "Strategy"];
const QUESTION_TYPES = ["fillInBlank", "trueFalse", "multipleChoice"];
const COMPLEX_CUES = ["why", "explain", "describe", "analyse", "analyze", "compare", "evaluate", "justify"];

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildDistractors(correctWord, vocabulary) {
  const target = correctWord.toLowerCase();
  const pool = Array.from(new Set(vocabulary)).filter((word) => word.toLowerCase() !== target);
  const sampled = [];

  while (pool.length > 0 && sampled.length < 3) {
    const index = Math.floor(Math.random() * pool.length);
    sampled.push(pool.splice(index, 1)[0]);
  }

  while (sampled.length < 3) {
    const candidate = pickRandom(FALLBACK_DISTRACTORS);
    if (!sampled.some((word) => word.toLowerCase() === candidate.toLowerCase()) && candidate.toLowerCase() !== target) {
      sampled.push(candidate);
    }
  }

  return sampled;
}

function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length >= 6);
}

function extractVocabulary(text) {
  const matches = text.match(/\b[A-Za-z][A-Za-z'-]{3,}\b/g) || [];
  return Array.from(new Set(matches.map((word) => word.trim())));
}

function extractSentencesWithIndex(text) {
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = [];
  let match;
  while ((match = sentenceRegex.exec(text))) {
    const raw = match[0].trim();
    if (raw.split(/\s+/).length >= 6) {
      sentences.push({
        text: raw,
        index: match.index,
      });
    }
  }
  return sentences;
}

function findSectionForIndex(headings, index) {
  if (!headings?.length) return null;
  let best = null;
  for (const heading of headings) {
    if (heading.charIndex <= index) {
      if (!best || heading.charIndex >= best.charIndex) {
        best = heading;
      }
    } else {
      break;
    }
  }
  return best;
}

function detectClauses(sentence) {
  return sentence.split(/[;,]/).filter((part) => part.trim().length > 0).length;
}

function computeDifficultyScore(base, sentence, questionType) {
  let score = 0;

  const wordCount = sentence.split(/\s+/).length;
  const clauseCount = detectClauses(sentence);

  if (wordCount <= 12 && clauseCount <= 1) {
    score += 1;
  } else if (wordCount <= 24 || clauseCount <= 2) {
    score += 2;
  } else {
    score += 3;
  }

  const lowerSentence = sentence.toLowerCase();
  if (COMPLEX_CUES.some((cue) => lowerSentence.includes(cue))) {
    score += 2;
  }

  if (base.sectionLevel) {
    score += Math.min(base.sectionLevel, 3);
  }

  switch (questionType) {
    case "trueFalse":
      score += 1;
      break;
    case "fillInBlank":
      score += 2;
      break;
    case "multipleChoice":
      score += 2.5;
      break;
    default:
      score += 2;
      break;
  }

  if (base.distractors?.length >= 3 && questionType !== "trueFalse") {
    score += 1;
  }

  if (base.correctWord && /ness$|tion$|ment$|ance$|ity$/i.test(base.correctWord)) {
    score += 0.5;
  }

  return score;
}

function mapScoreToDifficulty(score) {
  if (score < 5) return { label: "Easy", id: "easy" };
  if (score < 8) return { label: "Medium", id: "medium" };
  return { label: "Hard", id: "hard" };
}

function createFillInBlankQuestion(base) {
  const regex = new RegExp(`\\b${escapeRegExp(base.correctWord)}\\b`, "i");
  if (!regex.test(base.sentence)) {
    return null;
  }
  const prompt = base.sentence.replace(regex, "_____");

  const score = computeDifficultyScore(base, base.sentence, "fillInBlank");
  const difficulty = mapScoreToDifficulty(score);

  return {
    id: crypto.randomUUID(),
    type: "fillInBlank",
    prompt: `Fill in the blank: ${prompt}`,
    options: base.options,
    answerIndex: base.answerIndex,
    correctAnswer: base.correctWord,
    keyTerm: base.correctWord,
    context: base.sentence,
    sourcePdf: base.sourcePdf,
    sectionTitle: base.sectionTitle,
    sectionLevel: base.sectionLevel,
    sectionNumbering: base.sectionNumbering,
    reference: base.reference,
    contextSnippet: base.contextSnippet,
    difficulty,
    difficultyScore: score,
  };
}

function createTrueFalseQuestion(base) {
  const options = ["True", "False"];
  const regex = new RegExp(`\\b${escapeRegExp(base.correctWord)}\\b`, "i");
  if (!regex.test(base.sentence)) {
    return null;
  }

  let statement = base.sentence;
  let isTrueStatement = true;
  let falseWord = null;

  if (base.distractors.length > 0 && Math.random() < 0.5) {
    const replacement = pickRandom(base.distractors);
    const replaced = statement.replace(regex, replacement);
    if (replaced !== statement) {
      statement = replaced;
      isTrueStatement = false;
      falseWord = replacement;
    }
  }

  const score = computeDifficultyScore(base, statement, "trueFalse");
  const difficulty = mapScoreToDifficulty(score);

  return {
    id: crypto.randomUUID(),
    type: "trueFalse",
    prompt: `True or false? ${statement}`,
    options,
    answerIndex: isTrueStatement ? 0 : 1,
    correctAnswer: isTrueStatement ? "True" : "False",
    keyTerm: base.correctWord,
    context: base.sentence,
    sourcePdf: base.sourcePdf,
    isTrueStatement,
    falseWord,
    statement,
    sectionTitle: base.sectionTitle,
    sectionLevel: base.sectionLevel,
    sectionNumbering: base.sectionNumbering,
    reference: base.reference,
    contextSnippet: base.contextSnippet,
    difficulty,
    difficultyScore: score,
  };
}

function createMultipleChoiceQuestion(base) {
  const regex = new RegExp(`\\b${escapeRegExp(base.correctWord)}\\b`, "i");
  if (!regex.test(base.sentence)) {
    return null;
  }
  const displaySentence = base.sentence.replace(regex, "_____");

  const score = computeDifficultyScore(base, base.sentence, "multipleChoice");
  const difficulty = mapScoreToDifficulty(score);

  return {
    id: crypto.randomUUID(),
    type: "multipleChoice",
    prompt: "Select the correct term to complete this statement.",
    options: base.options,
    answerIndex: base.answerIndex,
    correctAnswer: base.correctWord,
    keyTerm: base.correctWord,
    context: base.sentence,
    displaySentence,
    sourcePdf: base.sourcePdf,
    sectionTitle: base.sectionTitle,
    sectionLevel: base.sectionLevel,
    sectionNumbering: base.sectionNumbering,
    reference: base.reference,
    contextSnippet: base.contextSnippet,
    difficulty,
    difficultyScore: score,
  };
}

const GENERATORS = {
  fillInBlank: createFillInBlankQuestion,
  trueFalse: createTrueFalseQuestion,
  multipleChoice: createMultipleChoiceQuestion,
};

function findSurroundingContext(sentences, selectedIndex, windowSize = 1) {
  const context = [];
  for (let i = Math.max(0, selectedIndex - windowSize); i <= Math.min(sentences.length - 1, selectedIndex + windowSize); i += 1) {
    context.push(sentences[i].text);
  }
  return context.join(" ");
}

export async function generateRandomQuestionFromPdfs(pdfs) {
  if (!Array.isArray(pdfs) || pdfs.length === 0) {
    throw new Error("No PDFs uploaded yet. Please add study materials first.");
  }

  const availablePdfs = pdfs.filter((pdf) => pdf?.dataUrl);
  if (availablePdfs.length === 0) {
    throw new Error("Uploaded PDFs are missing data. Try re-uploading your files.");
  }

  const selectedPdf = pickRandom(availablePdfs);
  const analysis = await getPdfAnalysis(selectedPdf);
  const text = analysis.text;
  if (!text) {
    throw new Error(`Could not read text from ${selectedPdf.name}.`);
  }

  const sentencesWithIndex = extractSentencesWithIndex(text);
  if (sentencesWithIndex.length === 0) {
    throw new Error(`Not enough readable content in ${selectedPdf.name} to build questions.`);
  }

  const vocabulary = extractVocabulary(text);
  const selectedSentence = pickRandom(sentencesWithIndex);
  const sentenceIndex = sentencesWithIndex.indexOf(selectedSentence);
  const sentence = selectedSentence.text;
  const sentenceVocabulary = extractVocabulary(sentence);
  if (sentenceVocabulary.length === 0) {
    throw new Error("Failed to identify a suitable keyword to create a question.");
  }

  const sectionHeading = findSectionForIndex(analysis.headings, selectedSentence.index) || null;
  const reference = sectionHeading ? findReferenceForSection(sectionHeading.title) : null;
  const contextSnippet = findSurroundingContext(sentencesWithIndex, sentenceIndex, 1);

  const correctWord = pickRandom(sentenceVocabulary);
  const distractors = buildDistractors(correctWord, vocabulary.filter((word) => word !== correctWord));
  const options = shuffle([correctWord, ...distractors]);
  const answerIndex = options.findIndex((option) => option === correctWord);
  if (answerIndex === -1) return null; // correctWord missing from options — skip sentence

  const base = {
    sentence,
    correctWord,
    distractors,
    options,
    answerIndex,
    sourcePdf: selectedPdf.name,
    sectionTitle: sectionHeading?.title || null,
    sectionLevel: sectionHeading?.level || null,
    sectionNumbering: sectionHeading?.title?.match(/^(\d+(?:\.\d+)*)/)?.[1] ?? null,
    reference,
    contextSnippet,
  };

  for (const type of shuffle([...QUESTION_TYPES])) {
    const generated = GENERATORS[type]?.(base);
    if (generated) return generated;
  }

  // Final fallback — throws if no generator could produce a question.
  const fallback = createFillInBlankQuestion(base);
  if (!fallback) throw new Error("Could not generate a question from the selected sentence.");
  return fallback;
}

export async function checkAnswerWithExplanation(question, selectedIndex) {
  if (!question) {
    throw new Error("Question payload missing");
  }

  const isCorrect = selectedIndex === question.answerIndex;
  let explanation;
  let correctAnswer = question.correctAnswer;

  switch (question.type) {
    case "trueFalse": {
      if (question.isTrueStatement) {
        explanation = `The original sentence in ${question.sourcePdf} states: "${question.context.replace(/\s+/g, " ").trim()}". This matches the statement, so it is true.`;
      } else {
        explanation = `The original sentence in ${question.sourcePdf} states: "${question.context.replace(/\s+/g, " ").trim()}". It uses "${question.keyTerm}" rather than "${question.falseWord}", making the statement false.`;
      }
      correctAnswer = question.isTrueStatement ? "True" : "False";
      break;
    }
    case "multipleChoice": {
      explanation = `The sentence in ${question.sourcePdf} reads: "${question.context.replace(/\s+/g, " ").trim()}". The highlighted term is "${question.keyTerm}".`;
      break;
    }
    case "fillInBlank":
    default: {
      explanation = `The sentence in ${question.sourcePdf} states: "${question.context.replace(/\s+/g, " ").trim()}". The blank is filled by "${question.keyTerm}".`;
      break;
    }
  }

  if (question.sectionTitle) {
    explanation += ` Section: ${question.sectionTitle}.`;
  }
  if (question.reference?.label && question.reference?.url) {
    explanation += ` Reference: ${question.reference.label}.`;
  }

  // Simulate async API call latency
  await new Promise((resolve) => setTimeout(resolve, 350));

  return {
    isCorrect,
    explanation,
    correctAnswer,
    reference: question.reference || null,
    contextSnippet: question.contextSnippet,
  };
}
