import React from "react";
import { generateRandomQuestionFromPdfs, checkAnswerWithExplanation } from "./quizService.js";
import { generateStudyPlan } from "./ai/studyPlan.js";
import { generateVariantQuestion } from "./ai/generateVariantQuestion.js";
import {
  loadStoredPDFs,
  storePDFs,
  loadQuestionHistory,
  storeQuestionHistory,
  loadSettings,
  storeSettings,
} from "./storage.js";
import PDFUploader from "./components/PDFUploader.js";
import QuizQuestion from "./components/QuizQuestion.js";
import Dashboard from "./components/Dashboard.js";

const h = React.createElement;

const TABS = [
  { id: "quiz", label: "Quiz" },
  { id: "pdfs", label: "My PDFs" },
  { id: "dashboard", label: "Dashboard" },
  { id: "settings", label: "Settings" },
];

const DEFAULT_SETTINGS = {
  telemetryOptIn: false,
  aiSuggestionsEnabled: false,
  dailyGoal: 5,
};

// ─── Pure helpers ──────────────────────────────────────────────────────────────

function formatDayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(date)
  );
}

function computeTopicStats(history) {
  const statsMap = {};
  history.forEach((entry) => {
    const key = entry.sectionTitle || "General";
    if (!statsMap[key]) {
      statsMap[key] = {
        sectionTitle: key,
        sectionNumbering: entry.sectionNumbering || null,
        total: 0,
        correct: 0,
        accuracy: 0,
        flagged: 0,
        reference: entry.reference || null,
        confidence: { low: 0, medium: 0, high: 0 },
        difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
      };
    }
    const stat = statsMap[key];
    stat.total += 1;
    if (entry.isCorrect) stat.correct += 1;
    if (entry.isFlagged) stat.flagged += 1;
    if (entry.confidence && stat.confidence[entry.confidence] !== undefined) {
      stat.confidence[entry.confidence] += 1;
    }
    const diffId = entry.difficulty?.id;
    if (diffId && stat.difficultyBreakdown[diffId] !== undefined) {
      stat.difficultyBreakdown[diffId] += 1;
    }
    if (!stat.reference && entry.reference) stat.reference = entry.reference;
  });
  return Object.values(statsMap).map((stat) => ({
    ...stat,
    accuracy: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0,
  }));
}

function computeTrendMetrics(history) {
  const byDay = {};
  history.forEach((entry) => {
    const key = formatDayKey(entry.timestamp);
    if (!byDay[key]) {
      byDay[key] = {
        day: formatDayLabel(entry.timestamp),
        total: 0,
        correct: 0,
        confidenceSum: 0,
        confidenceCount: 0,
      };
    }
    byDay[key].total += 1;
    if (entry.isCorrect) byDay[key].correct += 1;
    const confMap = { low: 1, medium: 2, high: 3 };
    if (entry.confidence && confMap[entry.confidence]) {
      byDay[key].confidenceSum += confMap[entry.confidence];
      byDay[key].confidenceCount += 1;
    }
  });
  const daily = Object.entries(byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, d]) => ({
      day: d.day,
      total: d.total,
      accuracy: d.total ? Math.round((d.correct / d.total) * 100) : 0,
      avgConfidence: d.confidenceCount
        ? Math.round((d.confidenceSum / d.confidenceCount) * 10) / 10
        : 0,
    }));
  return { daily };
}

function computeDailyProgress(history, dailyGoal) {
  const todayKey = formatDayKey(new Date());
  const byDay = {};
  history.forEach((entry) => {
    const key = formatDayKey(entry.timestamp);
    if (!byDay[key]) byDay[key] = { label: formatDayLabel(entry.timestamp), count: 0 };
    byDay[key].count += 1;
  });

  const todayCount = byDay[todayKey]?.count || 0;
  const sortedKeys = Object.keys(byDay).sort();

  // Compute current streak (consecutive days ending today or yesterday)
  const nowKey = formatDayKey(new Date());
  let streak = 0;
  let checkKey = nowKey;
  while (byDay[checkKey]) {
    streak += 1;
    const prev = new Date(checkKey + "T00:00:00");
    prev.setDate(prev.getDate() - 1);
    checkKey = formatDayKey(prev);
  }

  // Compute best streak
  let bestStreak = 0;
  let tempStreak = 0;
  let prevKey = null;
  sortedKeys.forEach((key) => {
    if (!prevKey) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(prevKey + "T00:00:00");
      const currDate = new Date(key + "T00:00:00");
      const diff = Math.round((currDate - prevDate) / 86400000);
      tempStreak = diff === 1 ? tempStreak + 1 : 1;
    }
    bestStreak = Math.max(bestStreak, tempStreak);
    prevKey = key;
  });

  return {
    todayCount,
    goal: dailyGoal,
    goalMet: todayCount >= dailyGoal,
    streak,
    bestStreak,
    days: sortedKeys.map((key) => ({ day: byDay[key].label, count: byDay[key].count })),
  };
}

// ─── App component ─────────────────────────────────────────────────────────────

export default function App() {
  // ─── Persistent state ─────────────────────────────────────
  const [uploadedPdfs, setUploadedPdfs] = React.useState([]);
  const [questionHistory, setQuestionHistory] = React.useState([]);
  const [userSettings, setUserSettings] = React.useState(DEFAULT_SETTINGS);

  // ─── UI state ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState("quiz");
  const [telemetryLog, setTelemetryLog] = React.useState([]);
  const telemetryOptInRef = React.useRef(false);

  // ─── Quiz state ───────────────────────────────────────────
  const [question, setQuestion] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = React.useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = React.useState(null);
  const [answerLoading, setAnswerLoading] = React.useState(false);
  const [explanation, setExplanation] = React.useState(null);
  const [currentHistoryEntry, setCurrentHistoryEntry] = React.useState(null);
  const [currentNote, setCurrentNote] = React.useState("");

  // ─── Session state ─────────────────────────────────────────
  const [session, setSession] = React.useState(null);
  const [sessionSummary, setSessionSummary] = React.useState(null);
  const [sessionConfig, setSessionConfig] = React.useState({ questionCount: 5 });
  const [currentSessionEntries, setCurrentSessionEntries] = React.useState([]);
  const [sessionHistory, setSessionHistory] = React.useState([]);

  // ─── Confidence state ──────────────────────────────────────
  const [confidencePending, setConfidencePending] = React.useState(false);
  const [currentConfidence, setCurrentConfidence] = React.useState(null);

  // ─── AI state ─────────────────────────────────────────────
  const [aiVariant, setAiVariant] = React.useState(null);
  const [aiVariantLoading, setAiVariantLoading] = React.useState(false);
  const [aiVariantError, setAiVariantError] = React.useState(null);
  const [studyPlan, setStudyPlan] = React.useState(null);
  const [studyPlanLoading, setStudyPlanLoading] = React.useState(false);
  const [studyPlanError, setStudyPlanError] = React.useState(null);

  // ─── Dashboard filters ─────────────────────────────────────
  const [filters, setFilters] = React.useState({
    topic: "All",
    difficulty: "All",
    flaggedOnly: false,
  });

  // ─── Bootstrap: load persisted data ───────────────────────
  React.useEffect(() => {
    loadStoredPDFs().then((pdfs) => setUploadedPdfs(pdfs));
    loadQuestionHistory().then((history) => setQuestionHistory(history));
    loadSettings().then((stored) =>
      setUserSettings((prev) => ({ ...prev, ...stored }))
    );
  }, []);

  // ─── Keep telemetry ref in sync ────────────────────────────
  React.useEffect(() => {
    telemetryOptInRef.current = userSettings.telemetryOptIn;
  }, [userSettings.telemetryOptIn]);

  // ─── Computed values ───────────────────────────────────────
  const totalAnswered = questionHistory.length;

  const correctCount = React.useMemo(
    () => questionHistory.filter((e) => e.isCorrect).length,
    [questionHistory]
  );

  const accuracy = React.useMemo(
    () => (totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0),
    [correctCount, totalAnswered]
  );

  const filteredHistory = React.useMemo(
    () =>
      questionHistory.filter((entry) => {
        const topicMatch =
          filters.topic === "All" || entry.sectionTitle === filters.topic;
        const diffMatch =
          filters.difficulty === "All" || entry.difficulty?.id === filters.difficulty;
        const flaggedMatch = !filters.flaggedOnly || entry.isFlagged;
        return topicMatch && diffMatch && flaggedMatch;
      }),
    [questionHistory, filters]
  );

  const availableTopics = React.useMemo(() => {
    const topics = new Set(["All"]);
    questionHistory.forEach((e) => {
      if (e.sectionTitle) topics.add(e.sectionTitle);
    });
    return Array.from(topics);
  }, [questionHistory]);

  const topicStats = React.useMemo(
    () => computeTopicStats(questionHistory),
    [questionHistory]
  );

  const trendMetrics = React.useMemo(
    () => computeTrendMetrics(questionHistory),
    [questionHistory]
  );

  const dailyProgress = React.useMemo(
    () => computeDailyProgress(questionHistory, userSettings.dailyGoal),
    [questionHistory, userSettings.dailyGoal]
  );

  const isCurrentFlagged = React.useMemo(
    () => Boolean(currentHistoryEntry?.isFlagged),
    [currentHistoryEntry]
  );

  const sessionSummaryEntries = React.useMemo(
    () => (sessionSummary ? currentSessionEntries : []),
    [sessionSummary, currentSessionEntries]
  );

  // ─── Telemetry ─────────────────────────────────────────────
  const logTelemetry = React.useCallback(
    (event, options = {}) => {
      const { force = false } = options;
      setTelemetryLog((prev) => {
        if (!force && !telemetryOptInRef.current) {
          return prev;
        }
        const entry = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          ...event,
        };
        return [entry, ...prev].slice(0, 200);
      });
    },
    []
  );

  // ─── Settings handlers ─────────────────────────────────────
  const handleTelemetryToggle = React.useCallback(
    (enabled) => {
      setUserSettings((prev) => ({ ...prev, telemetryOptIn: Boolean(enabled) }));
      if (!enabled) {
        setTelemetryLog([]);
      }
      logTelemetry(
        {
          category: "telemetry",
          severity: "info",
          message: enabled ? "Telemetry opt-in enabled" : "Telemetry opt-in disabled",
        },
        { force: true }
      );
    },
    [logTelemetry]
  );

  const handleGoalChange = React.useCallback((newGoal) => {
    const goal = Math.min(200, Math.max(1, Number(newGoal) || 5));
    setUserSettings((prev) => {
      const updated = { ...prev, dailyGoal: goal };
      storeSettings(updated);
      return updated;
    });
  }, []);

  const handleAiToggle = React.useCallback((enabled) => {
    setUserSettings((prev) => {
      const updated = { ...prev, aiSuggestionsEnabled: Boolean(enabled) };
      storeSettings(updated);
      return updated;
    });
  }, []);

  // ─── PDF handlers ──────────────────────────────────────────
  const handleUpload = React.useCallback((newPdfs) => {
    setUploadedPdfs((prev) => {
      const updated = [...prev, ...newPdfs];
      storePDFs(updated);
      return updated;
    });
  }, []);

  const handleDelete = React.useCallback((pdfId) => {
    setUploadedPdfs((prev) => {
      const updated = prev.filter((pdf) => pdf.id !== pdfId);
      storePDFs(updated);
      return updated;
    });
  }, []);

  // ─── Quiz generation ───────────────────────────────────────
  const handleGenerate = React.useCallback(async () => {
    if (loading || answerLoading) return;
    setLoading(true);
    setError(null);
    setQuestion(null);
    setSelectedOptionIndex(null);
    setIsAnswerCorrect(null);
    setExplanation(null);
    setCurrentHistoryEntry(null);
    setCurrentNote("");
    setConfidencePending(false);
    setCurrentConfidence(null);
    setAiVariant(null);
    setAiVariantError(null);
    try {
      const generated = await generateRandomQuestionFromPdfs(uploadedPdfs);
      setQuestion(generated);
      logTelemetry({
        category: "quiz",
        severity: "info",
        message: "Question generated",
        context: { type: generated.type, difficulty: generated.difficulty?.id },
      });
    } catch (err) {
      setError(err?.message || "Failed to generate a question.");
      logTelemetry({
        category: "quiz",
        severity: "error",
        message: "Question generation failed",
        context: { error: err?.message },
      });
    } finally {
      setLoading(false);
    }
  }, [loading, answerLoading, uploadedPdfs, logTelemetry]);

  // ─── Answer selection ──────────────────────────────────────
  const handleSelectOption = React.useCallback(
    async (index) => {
      if (selectedOptionIndex !== null || answerLoading || !question) return;
      setSelectedOptionIndex(index);
      setAnswerLoading(true);
      try {
        const result = await checkAnswerWithExplanation(question, index);
        setIsAnswerCorrect(result.isCorrect);
        setExplanation(result.explanation);
        setConfidencePending(true);
        setCurrentConfidence(null);

        const historyEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          prompt: question.prompt,
          questionType: question.type,
          sourcePdf: question.sourcePdf,
          sectionTitle: question.sectionTitle || null,
          sectionNumbering: question.sectionNumbering || null,
          difficulty: question.difficulty || null,
          selectedOptionIndex: index,
          userAnswer: question.options?.[index] ?? String(index),
          isCorrect: result.isCorrect,
          explanation: result.explanation,
          correctAnswer: result.correctAnswer,
          contextSnippet: result.contextSnippet || null,
          reference: result.reference || null,
          isFlagged: false,
          note: "",
          confidence: null,
          sessionId: session?.id || null,
        };

        setCurrentHistoryEntry(historyEntry);
        setCurrentSessionEntries((prev) => [...prev, historyEntry]);
        setQuestionHistory((prev) => {
          const updated = [historyEntry, ...prev];
          storeQuestionHistory(updated);
          return updated;
        });

        if (session) {
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              answered: prev.answered + 1,
              correct: prev.correct + (result.isCorrect ? 1 : 0),
            };
          });
        }

        logTelemetry({
          category: "quiz",
          severity: "info",
          message: result.isCorrect ? "Correct answer" : "Incorrect answer",
          context: { type: question.type, difficulty: question.difficulty?.id },
        });
      } catch (err) {
        setError(err?.message || "Failed to check answer.");
        logTelemetry({
          category: "quiz",
          severity: "error",
          message: "Answer check failed",
          context: { error: err?.message },
        });
      } finally {
        setAnswerLoading(false);
      }
    },
    [selectedOptionIndex, answerLoading, question, session, logTelemetry]
  );

  // ─── Confidence selection ──────────────────────────────────
  const handleConfidenceSelect = React.useCallback((confidenceId) => {
    setCurrentConfidence(confidenceId);
    setConfidencePending(false);
    setCurrentHistoryEntry((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, confidence: confidenceId };
      setCurrentSessionEntries((entries) =>
        entries.map((e) => (e.id === prev.id ? updated : e))
      );
      setQuestionHistory((history) => {
        const updatedHistory = history.map((e) => (e.id === prev.id ? updated : e));
        storeQuestionHistory(updatedHistory);
        return updatedHistory;
      });
      return updated;
    });
  }, []);

  // ─── Flagging ─────────────────────────────────────────────
  const handleToggleFlag = React.useCallback(() => {
    setCurrentHistoryEntry((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, isFlagged: !prev.isFlagged };
      setCurrentSessionEntries((entries) =>
        entries.map((e) => (e.id === prev.id ? updated : e))
      );
      setSession((s) => {
        if (!s) return s;
        const flaggedIds = new Set(s.flaggedIds || []);
        if (updated.isFlagged) flaggedIds.add(prev.id);
        else flaggedIds.delete(prev.id);
        return { ...s, flaggedIds: Array.from(flaggedIds) };
      });
      setQuestionHistory((history) => {
        const updatedHistory = history.map((e) => (e.id === prev.id ? updated : e));
        storeQuestionHistory(updatedHistory);
        return updatedHistory;
      });
      return updated;
    });
  }, []);

  // ─── Notes ────────────────────────────────────────────────
  const handleNoteChange = React.useCallback((note, entryId) => {
    if (!entryId) return;
    setCurrentNote(note);
    setCurrentHistoryEntry((prev) => {
      if (!prev || prev.id !== entryId) return prev;
      return { ...prev, note };
    });
    setCurrentSessionEntries((entries) =>
      entries.map((e) => (e.id === entryId ? { ...e, note } : e))
    );
    setQuestionHistory((history) => {
      const updated = history.map((e) => (e.id === entryId ? { ...e, note } : e));
      storeQuestionHistory(updated);
      return updated;
    });
  }, []);

  // ─── Next question ─────────────────────────────────────────
  const handleNext = React.useCallback(() => {
    if (confidencePending) return;
    if (session && session.answered >= session.questionCount) return;
    handleGenerate();
  }, [confidencePending, session, handleGenerate]);

  // ─── Session management ────────────────────────────────────
  const handleStartSession = React.useCallback(
    (questionCount) => {
      const count = Math.max(1, Number(questionCount) || 5);
      setSession({
        id: crypto.randomUUID(),
        questionCount: count,
        answered: 0,
        correct: 0,
        flaggedIds: [],
        startedAt: new Date(),
      });
      setSessionSummary(null);
      setCurrentSessionEntries([]);
      setSessionConfig({ questionCount: count });
      handleGenerate();
    },
    [handleGenerate]
  );

  const handleAbortSession = React.useCallback(() => {
    setSession((prev) => {
      if (!prev) return null;
      const summary = {
        questionCount: prev.answered,
        accuracy:
          prev.answered > 0
            ? Math.round((prev.correct / prev.answered) * 100)
            : 0,
        flaggedIds: prev.flaggedIds || [],
        flaggedCount: (prev.flaggedIds || []).length,
        sessionId: prev.id,
        endedAt: new Date(),
      };
      setSessionSummary(summary);
      setSessionHistory((h) => [summary, ...h]);
      return null;
    });
  }, []);

  // Auto-complete session when all questions answered
  React.useEffect(() => {
    if (!session) return;
    if (session.answered < session.questionCount) return;
    const summary = {
      questionCount: session.questionCount,
      accuracy:
        session.questionCount > 0
          ? Math.round((session.correct / session.questionCount) * 100)
          : 0,
      flaggedIds: session.flaggedIds || [],
      flaggedCount: (session.flaggedIds || []).length,
      sessionId: session.id,
      endedAt: new Date(),
    };
    setSessionSummary(summary);
    setSessionHistory((h) => [summary, ...h]);
    setSession(null);
  }, [session]);

  const handleFocusFlagged = React.useCallback(() => {
    setActiveTab("dashboard");
    setFilters((prev) => ({ ...prev, flaggedOnly: true }));
  }, []);

  // ─── Export ────────────────────────────────────────────────
  const handleExport = React.useCallback(
    (format) => {
      if (filteredHistory.length === 0) return;
      const rows = filteredHistory.map((entry) => ({
        timestamp: entry.timestamp.toISOString(),
        prompt: entry.prompt,
        type: entry.questionType,
        section: entry.sectionTitle || "",
        difficulty: entry.difficulty?.label || "",
        userAnswer: entry.userAnswer,
        correctAnswer: entry.correctAnswer,
        isCorrect: entry.isCorrect,
        confidence: entry.confidence || "",
        isFlagged: entry.isFlagged,
        note: entry.note || "",
      }));

      let content, mimeType, filename;
      if (format === "csv") {
        const headers = Object.keys(rows[0]).join(",");
        const body = rows.map((row) =>
          Object.values(row)
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
        );
        content = [headers, ...body].join("\n");
        mimeType = "text/csv";
        filename = "quizcraftqa-history.csv";
      } else {
        content = JSON.stringify(rows, null, 2);
        mimeType = "application/json";
        filename = "quizcraftqa-history.json";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      logTelemetry({
        category: "export",
        severity: "info",
        message: `Exported history as ${format}`,
      });
    },
    [filteredHistory, logTelemetry]
  );

  // ─── Filter change ─────────────────────────────────────────
  const handleFilterChange = React.useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  // ─── AI: variant question ──────────────────────────────────
  const handleRequestVariant = React.useCallback(async () => {
    if (!userSettings.aiSuggestionsEnabled) {
      setAiVariantError("Enable AI assistance in settings to request variants.");
      return;
    }
    const entry = currentHistoryEntry;
    if (!entry) {
      setAiVariantError("Answer a question before generating a variant.");
      return;
    }
    setAiVariantLoading(true);
    setAiVariantError(null);
    try {
      const variant = await generateVariantQuestion({
        prompt: entry.prompt,
        explanation: entry.explanation,
        correctAnswer: entry.correctAnswer,
        context: entry.contextSnippet || entry.context || "",
      });
      setAiVariant(variant);
      logTelemetry({
        category: "ai",
        severity: "info",
        message: "Generated alternate question",
      });
    } catch (error) {
      setAiVariantError(error?.message || "Failed to generate alternate question.");
      logTelemetry({
        category: "ai",
        severity: "error",
        message: "Variant question request failed",
        context: { error: error?.message || String(error) },
      });
    } finally {
      setAiVariantLoading(false);
    }
  }, [userSettings.aiSuggestionsEnabled, currentHistoryEntry, logTelemetry]);

  // ─── AI: study plan ────────────────────────────────────────
  const handleGenerateStudyPlan = React.useCallback(async () => {
    setStudyPlanLoading(true);
    setStudyPlanError(null);
    try {
      const plan = await generateStudyPlan({
        accuracy,
        recentSessions: sessionHistory.slice(0, 5),
        topicStats,
      });
      setStudyPlan(plan);
      logTelemetry({ category: "ai", severity: "info", message: "Study plan generated" });
    } catch (err) {
      setStudyPlanError(err?.message || "Failed to generate study plan.");
      logTelemetry({
        category: "ai",
        severity: "error",
        message: "Study plan generation failed",
        context: { error: err?.message },
      });
    } finally {
      setStudyPlanLoading(false);
    }
  }, [accuracy, sessionHistory, topicStats, logTelemetry]);

  // ─── Render ────────────────────────────────────────────────
  const hasPdfs = uploadedPdfs.length > 0;

  return h(
    "div",
    { className: "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" },

    // Header / navigation
    h(
      "header",
      {
        className:
          "sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-6 py-4 shadow-sm backdrop-blur",
      },
      h(
        "div",
        { className: "mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4" },
        h(
          "div",
          null,
          h("h1", { className: "text-xl font-bold text-slate-800" }, "QuizCraftQA"),
          h("p", { className: "text-xs text-slate-500" }, "ISTQB Exam Preparation")
        ),
        h(
          "nav",
          { className: "flex items-center gap-1" },
          TABS.map((tab) =>
            h(
              "button",
              {
                key: tab.id,
                type: "button",
                onClick: () => setActiveTab(tab.id),
                className:
                  "rounded-full px-4 py-2 text-sm font-medium transition " +
                  (activeTab === tab.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"),
              },
              tab.label
            )
          )
        )
      )
    ),

    // Main content
    h(
      "main",
      { className: "mx-auto max-w-5xl px-6 py-8" },

      // ── Quiz tab ────────────────────────────────────────
      activeTab === "quiz"
        ? h(
            "div",
            { className: "space-y-6" },
            h(QuizQuestion, {
              hasPdfs,
              loading,
              question,
              error,
              onGenerate: handleGenerate,
              onSelectOption: handleSelectOption,
              selectedOptionIndex,
              isAnswerCorrect,
              answerLoading,
              explanation,
              totalAnswered,
              accuracy,
              correctCount,
              onNext: handleNext,
              session,
              sessionSummary,
              sessionSummaryEntries,
              sessionConfig,
              onStartSession: handleStartSession,
              onAbortSession: handleAbortSession,
              confidencePending,
              onConfidenceSelect: handleConfidenceSelect,
              currentConfidence,
              onToggleFlag: handleToggleFlag,
              isCurrentFlagged,
              onNoteChange: handleNoteChange,
              currentNote,
              reference: currentHistoryEntry?.reference || null,
              contextSnippet: currentHistoryEntry?.contextSnippet || null,
              currentHistoryEntryId: currentHistoryEntry?.id || null,
              onFocusFlagged: handleFocusFlagged,
            }),

            // AI variant panel (shown after answering if AI is enabled)
            userSettings.aiSuggestionsEnabled && currentHistoryEntry
              ? h(
                  "div",
                  {
                    className:
                      "rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur",
                  },
                  h(
                    "div",
                    { className: "flex flex-wrap items-center justify-between gap-3" },
                    h(
                      "div",
                      null,
                      h(
                        "h4",
                        { className: "text-base font-semibold text-slate-800" },
                        "AI Question Variant"
                      ),
                      h(
                        "p",
                        { className: "text-xs text-slate-500" },
                        "Generate an alternate phrasing of this question to reinforce learning."
                      )
                    ),
                    h(
                      "button",
                      {
                        type: "button",
                        onClick: handleRequestVariant,
                        disabled: aiVariantLoading,
                        className:
                          "inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60 hover:bg-primary/90",
                      },
                      aiVariantLoading ? "Generating…" : "Generate Variant"
                    )
                  ),
                  aiVariantError
                    ? h(
                        "p",
                        { className: "mt-3 text-xs text-red-600" },
                        aiVariantError
                      )
                    : null,
                  aiVariant
                    ? h(
                        "div",
                        {
                          className:
                            "mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700",
                        },
                        h(
                          "p",
                          { className: "font-semibold text-slate-800" },
                          aiVariant.variantPrompt
                        ),
                        aiVariant.explanation
                          ? h(
                              "p",
                              { className: "mt-2 text-xs italic text-slate-500" },
                              aiVariant.explanation
                            )
                          : null
                      )
                    : null
                )
              : null
          )
        : null,

      // ── PDFs tab ────────────────────────────────────────
      activeTab === "pdfs"
        ? h(PDFUploader, {
            pdfs: uploadedPdfs,
            onUpload: handleUpload,
            onDelete: handleDelete,
          })
        : null,

      // ── Dashboard tab ───────────────────────────────────
      activeTab === "dashboard"
        ? h(Dashboard, {
            pdfCount: uploadedPdfs.length,
            totalAnswered,
            accuracy,
            history: questionHistory,
            filteredHistory,
            sessionHistory,
            topicStats,
            trendMetrics,
            dailyProgress,
            goalConfig: { dailyGoal: userSettings.dailyGoal },
            filters,
            availableTopics,
            onGoalChange: handleGoalChange,
            onFilterChange: handleFilterChange,
            onExport: handleExport,
          })
        : null,

      // ── Settings tab ────────────────────────────────────
      activeTab === "settings"
        ? h(
            "section",
            {
              className:
                "space-y-8 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur",
            },
            h("h3", { className: "text-xl font-semibold text-slate-800" }, "Settings"),

            // AI assistance toggle
            h(
              "div",
              {
                className:
                  "flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4",
              },
              h(
                "div",
                null,
                h(
                  "p",
                  { className: "text-sm font-semibold text-slate-700" },
                  "AI Assistance"
                ),
                h(
                  "p",
                  { className: "text-xs text-slate-500" },
                  "Enables study plan generation and question variant features."
                )
              ),
              h("input", {
                type: "checkbox",
                checked: userSettings.aiSuggestionsEnabled,
                onChange: (e) => handleAiToggle(e.target.checked),
                className:
                  "h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary/40",
              })
            ),

            // Telemetry toggle
            h(
              "div",
              {
                className:
                  "flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4",
              },
              h(
                "div",
                null,
                h(
                  "p",
                  { className: "text-sm font-semibold text-slate-700" },
                  "Usage Telemetry"
                ),
                h(
                  "p",
                  { className: "text-xs text-slate-500" },
                  "Share anonymous usage events to help improve the app."
                )
              ),
              h("input", {
                type: "checkbox",
                checked: userSettings.telemetryOptIn,
                onChange: (e) => handleTelemetryToggle(e.target.checked),
                className:
                  "h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary/40",
              })
            ),

            // Study plan (only when AI is enabled)
            userSettings.aiSuggestionsEnabled
              ? h(
                  "div",
                  { className: "space-y-4" },
                  h(
                    "div",
                    { className: "flex flex-wrap items-center justify-between gap-3" },
                    h(
                      "div",
                      null,
                      h(
                        "p",
                        { className: "text-sm font-semibold text-slate-700" },
                        "Study Plan"
                      ),
                      h(
                        "p",
                        { className: "text-xs text-slate-500" },
                        "Generates a personalised plan based on your quiz history."
                      )
                    ),
                    h(
                      "button",
                      {
                        type: "button",
                        onClick: handleGenerateStudyPlan,
                        disabled: studyPlanLoading,
                        className:
                          "inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60 hover:bg-primary/90",
                      },
                      studyPlanLoading ? "Generating…" : "Generate Study Plan"
                    )
                  ),
                  studyPlanError
                    ? h("p", { className: "text-xs text-red-600" }, studyPlanError)
                    : null,
                  studyPlan
                    ? h(
                        "div",
                        {
                          className:
                            "rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 space-y-3",
                        },
                        h(
                          "p",
                          { className: "font-semibold text-slate-800" },
                          studyPlan.summary
                        ),
                        studyPlan.focusAreas?.length
                          ? h(
                              "div",
                              null,
                              h(
                                "p",
                                {
                                  className:
                                    "mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400",
                                },
                                "Focus Areas"
                              ),
                              h(
                                "ul",
                                { className: "list-inside list-disc space-y-1 text-xs" },
                                studyPlan.focusAreas.map((area, i) =>
                                  h("li", { key: i }, area)
                                )
                              )
                            )
                          : null,
                        studyPlan.nextSteps?.length
                          ? h(
                              "div",
                              null,
                              h(
                                "p",
                                {
                                  className:
                                    "mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400",
                                },
                                "Next Steps"
                              ),
                              h(
                                "ol",
                                { className: "list-inside list-decimal space-y-1 text-xs" },
                                studyPlan.nextSteps.map((step, i) =>
                                  h("li", { key: i }, step)
                                )
                              )
                            )
                          : null,
                        studyPlan.reinforcement
                          ? h(
                              "p",
                              { className: "text-xs italic text-slate-400" },
                              studyPlan.reinforcement
                            )
                          : null
                      )
                    : null
                )
              : null,

            // Telemetry log viewer (only when opted in and log has entries)
            userSettings.telemetryOptIn && telemetryLog.length > 0
              ? h(
                  "div",
                  { className: "space-y-2" },
                  h(
                    "p",
                    { className: "text-sm font-semibold text-slate-700" },
                    "Telemetry Log"
                  ),
                  h(
                    "div",
                    {
                      className:
                        "max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 space-y-1",
                    },
                    telemetryLog.slice(0, 20).map((entry) =>
                      h(
                        "div",
                        { key: entry.id, className: "flex items-baseline gap-2" },
                        h(
                          "span",
                          { className: "shrink-0 text-slate-400" },
                          entry.timestamp.toLocaleTimeString()
                        ),
                        h(
                          "span",
                          {
                            className:
                              entry.severity === "error"
                                ? "font-semibold text-red-500"
                                : "text-slate-600",
                          },
                          `[${entry.category}] ${entry.message}`
                        )
                      )
                    )
                  )
                )
              : null
          )
        : null
    )
  );
}
