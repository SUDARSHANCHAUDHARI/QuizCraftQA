import React from "react";
import { findReferenceForSection } from "../referenceMap.js";

const h = React.createElement;

const TYPE_LABELS = {
  fillInBlank: "Fill in the Blank",
  trueFalse: "True / False",
  multipleChoice: "Multiple Choice",
};

const CONFIDENCE_OPTIONS = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Moderate" },
  { id: "high", label: "High" },
];

function OptionButton({ label, index, selected, disabled, correctState, onClick }) {
  const baseClasses =
    "w-full rounded-2xl border px-5 py-3 text-left text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const hoverClasses = disabled ? "" : " hover:-translate-y-0.5 hover:shadow-lg";
  let stateClasses = " border-slate-200 bg-white text-slate-700 focus-visible:ring-primary/40";

  if (selected) {
    stateClasses = correctState
      ? " border-accent/60 bg-accent/10 text-accent focus-visible:ring-accent/40"
      : " border-red-500/40 bg-red-500/10 text-red-600 focus-visible:ring-red-500/50";
  }

  return h(
    "button",
    {
      type: "button",
      onClick: () => onClick(index),
      disabled,
      className: `${baseClasses}${hoverClasses} ${stateClasses}`,
    },
    h(
      "span",
      { className: "flex items-center justify-between gap-3" },
      h("span", { className: "text-xs font-semibold uppercase text-slate-400" }, `Option ${index + 1}`),
      h("span", null, label)
    )
  );
}

export default function QuizQuestion({
  hasPdfs,
  loading,
  question,
  error,
  onGenerate,
  onSelectOption,
  selectedOptionIndex,
  isAnswerCorrect,
  answerLoading,
  explanation,
  totalAnswered,
  accuracy,
  correctCount,
  onNext,
  session,
  sessionSummary,
  sessionSummaryEntries,
  sessionConfig,
  onStartSession,
  onAbortSession,
  confidencePending,
  onConfidenceSelect,
  currentConfidence,
  onToggleFlag,
  isCurrentFlagged,
  onNoteChange,
  currentNote,
  reference,
  contextSnippet,
  currentHistoryEntryId,
  onFocusFlagged,
}) {
  const [pendingCount, setPendingCount] = React.useState(
    sessionConfig?.questionCount || 5
  );

  React.useEffect(() => {
    if (sessionConfig?.questionCount) {
      setPendingCount(sessionConfig.questionCount);
    }
  }, [sessionConfig?.questionCount]);

  const handleGenerateClick = React.useCallback(() => {
    if (!loading && !answerLoading) {
      onGenerate();
    }
  }, [loading, answerLoading, onGenerate]);

  const sessionActive = Boolean(session);
  const progressPercent = sessionActive
    ? Math.min(100, Math.round((session.answered / session.questionCount) * 100))
    : 0;
  const questionsRemaining = sessionActive
    ? Math.max(session.questionCount - session.answered, 0)
    : 0;
  const canGenerate = hasPdfs && !loading && !answerLoading;
  const answeringDisabled = answerLoading || selectedOptionIndex !== null;
  const questionTypeLabel = question ? TYPE_LABELS[question.type] || "Question" : null;
  const sectionLabel = question?.sectionTitle || null;
  const sectionNumbering = question?.sectionNumbering || null;
  const difficultyLabel = question?.difficulty?.label || null;
  const difficultyId = question?.difficulty?.id || null;
  const displayContext =
    question && question.displaySentence ? question.displaySentence : question?.context;
  const sessionCompleted = !sessionActive && Boolean(sessionSummary);
  const sectionReference = reference || (question?.reference ? question.reference : question?.sectionTitle ? findReferenceForSection(question.sectionTitle) : null);

  const handleStartSessionClick = () => {
    onStartSession?.(pendingCount);
  };

  return h(
    "section",
    {
      className:
        "rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur transition hover:shadow-xl",
    },
    h(
      "div",
      { className: "flex flex-col gap-6" },
      h(
        "div",
        {
          className:
            "flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md",
        },
        h(
          "div",
          { className: "flex flex-wrap items-center justify-between gap-4" },
          h("h3", { className: "text-xl font-semibold text-slate-800" }, "Quiz Sessions"),
          sessionActive
            ? h(
                "button",
                {
                  type: "button",
                  onClick: onAbortSession,
                  className:
                    "inline-flex items-center rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50",
                },
                "End Session"
              )
            : h(
                "div",
                { className: "flex items-center gap-3" },
                h(
                  "label",
                  { className: "text-sm font-medium text-slate-600" },
                  "Questions"
                ),
                h(
                  "select",
                  {
                    className:
                      "rounded-full border border-slate-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40",
                    value: pendingCount,
                    onChange: (event) => setPendingCount(Number(event.target.value)),
                  },
                  [5, 10, 15, 20].map((count) =>
                    h("option", { key: count, value: count }, `${count}`)
                  )
                ),
                h(
                  "button",
                  {
                    type: "button",
                    onClick: handleStartSessionClick,
                    disabled: !hasPdfs,
                    className:
                      "inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60",
                  },
                  "Start Session"
                )
              )
        ),
        sessionActive
          ? h(
              "div",
              { className: "space-y-3 text-sm text-slate-600" },
              h(
                "div",
                { className: "flex items-center justify-between" },
                h(
                  "span",
                  { className: "font-medium text-slate-800" },
                  `Question ${Math.min(session.answered + 1, session.questionCount)} of ${session.questionCount}`
                ),
                h("span", { className: "text-xs text-slate-400" }, `${progressPercent}% complete`)
              ),
              h(
                "div",
                { className: "h-2 w-full rounded-full bg-slate-200" },
                h("div", {
                  className: "h-full rounded-full bg-primary transition-all duration-300",
                  style: { width: `${progressPercent}%` },
                })
              ),
              h(
                "div",
                { className: "flex flex-wrap items-center gap-4 text-xs text-slate-500" },
                h(
                  "span",
                  null,
                  `Answered: ${session.answered}`
                ),
                h(
                  "span",
                  null,
                  `Remaining: ${questionsRemaining}`
                ),
                h(
                  "span",
                  null,
                  `Correct so far: ${session.correct}`
                )
              )
            )
          : null,
        sessionCompleted
          ? h(
              "div",
              { className: "space-y-4 text-sm text-slate-600" },
              h(
                "div",
                { className: "flex flex-wrap items-center justify-between gap-3" },
                h(
                  "h4",
                  { className: "text-base font-semibold text-slate-800" },
                  "Session Summary"
                ),
                h(
                  "div",
                  { className: "flex items-center gap-2" },
                  h(
                    "button",
                    {
                      type: "button",
                      onClick: () => onStartSession?.(sessionConfig.questionCount),
                      className:
                        "inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90",
                    },
                    "Start New Session"
                  ),
                  sessionSummary?.flaggedIds?.length
                    ? h(
                        "button",
                        {
                          type: "button",
                          onClick: onFocusFlagged,
                          className:
                            "inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-400",
                        },
                        "Review Flagged"
                      )
                    : null
                )
              ),
              h(
                "div",
                { className: "grid gap-3 sm:grid-cols-3" },
                h(
                  "div",
                  { className: "rounded-2xl border border-slate-200 bg-slate-50 p-3" },
                  h(
                    "p",
                    { className: "text-xs uppercase tracking-wide text-slate-400" },
                    "Questions"
                  ),
                  h(
                    "p",
                    { className: "text-xl font-semibold text-slate-800" },
                    sessionSummary.questionCount
                  )
                ),
                h(
                  "div",
                  { className: "rounded-2xl border border-slate-200 bg-slate-50 p-3" },
                  h(
                    "p",
                    { className: "text-xs uppercase tracking-wide text-slate-400" },
                    "Accuracy"
                  ),
                  h(
                    "p",
                    { className: "text-xl font-semibold text-primary" },
                    `${sessionSummary.accuracy}%`
                  )
                ),
                h(
                  "div",
                  { className: "rounded-2xl border border-slate-200 bg-slate-50 p-3" },
                  h(
                    "p",
                    { className: "text-xs uppercase tracking-wide text-slate-400" },
                    "Flagged"
                  ),
                  h(
                    "p",
                    { className: "text-xl font-semibold text-red-500" },
                    sessionSummary.flaggedIds?.length || 0
                  )
                )
              ),
              h(
                "div",
                { className: "space-y-2" },
                h(
                  "p",
                  { className: "text-xs uppercase tracking-wide text-slate-400" },
                  "Notes"
                ),
                sessionSummaryEntries && sessionSummaryEntries.length
                  ? h(
                      "div",
                      { className: "space-y-3" },
                      sessionSummaryEntries.map((entry) =>
                        h(
                          "div",
                          {
                            key: entry.id,
                            className:
                              "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600",
                          },
                          h(
                            "div",
                            { className: "flex flex-wrap items-center justify-between gap-2" },
                            h(
                              "span",
                              { className: "font-semibold text-slate-700" },
                              entry.prompt
                            ),
                            entry.isFlagged
                              ? h(
                                  "span",
                                  {
                                    className:
                                      "inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700",
                                  },
                                  "Flagged"
                                )
                              : null
                          ),
                          entry.contextSnippet
                            ? h(
                                "p",
                                { className: "mt-2 text-slate-500" },
                                entry.contextSnippet
                              )
                            : null,
                          h(
                            "textarea",
                            {
                              value: entry.note || "",
                              onChange: (event) => onNoteChange?.(event.target.value, entry.id),
                              placeholder: "Add personal notes or mnemonics...",
                              className:
                                "mt-2 h-20 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30",
                            }
                          )
                        )
                      )
                    )
                  : h(
                      "p",
                      { className: "text-xs text-slate-500" },
                      "No questions answered in this session yet."
                    )
              )
            )
          : null
      ),
      h(
        "div",
        { className: "space-y-3" },
        h("h3", { className: "text-xl font-semibold text-slate-800" }, "Quiz Workspace"),
        h(
          "p",
          { className: "text-sm text-slate-500" },
          "Generate adaptive multiple-choice questions from your uploaded ISTQB study materials."
        )
      ),
      h(
        "div",
        { className: "grid gap-4 md:grid-cols-3" },
        h(
          "div",
          {
            className:
              "rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-center text-sm text-slate-600",
          },
          h("p", { className: "text-xs uppercase tracking-wide text-slate-400" }, "Total Answered"),
          h("p", { className: "text-2xl font-semibold text-slate-800" }, totalAnswered)
        ),
        h(
          "div",
          {
            className:
              "rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-center text-sm text-slate-600",
          },
          h("p", { className: "text-xs uppercase tracking-wide text-slate-400" }, "Correct Answers"),
          h("p", { className: "text-2xl font-semibold text-accent" }, correctCount)
        ),
        h(
          "div",
          {
            className:
              "rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-center text-sm text-slate-600",
          },
          h("p", { className: "text-xs uppercase tracking-wide text-slate-400" }, "Accuracy"),
          h("p", { className: "text-2xl font-semibold text-primary" }, `${accuracy}%`)
        )
      ),
      h(
        "div",
        {
          className:
            "flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600",
        },
        h(
          "button",
          {
            type: "button",
            onClick: handleGenerateClick,
            disabled: !canGenerate,
            className:
              "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
          },
          loading
            ? h(
                "span",
                { className: "flex items-center gap-2" },
                h(
                  "svg",
                  {
                    className: "h-4 w-4 animate-spin",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    xmlns: "http://www.w3.org/2000/svg",
                  },
                  h("circle", {
                    className: "opacity-25",
                    cx: "12",
                    cy: "12",
                    r: "10",
                    stroke: "currentColor",
                    strokeWidth: "4",
                  }),
                  h("path", {
                    className: "opacity-75",
                    fill: "currentColor",
                    d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z",
                  })
                ),
                "Generating..."
              )
            : "Generate Random Question"
        ),
        !hasPdfs
          ? h(
              "p",
              { className: "text-xs font-medium text-slate-500" },
              "Upload at least one PDF in the My PDFs tab to begin generating questions."
            )
          : null
      ),
      error
        ? h(
            "div",
            {
              className:
                "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600",
            },
            error
          )
        : null,
      question
        ? h(
            "div",
            { className: "space-y-5" },
            h(
              "div",
              { className: "space-y-3" },
              h(
                "div",
                { className: "flex flex-wrap items-center gap-3" },
                h(
                  "p",
                  { className: "text-sm font-semibold text-primary" },
                  `Source: ${question.sourcePdf}`
                ),
                h(
                  "span",
                  {
                    className:
                      "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500",
                  },
                  questionTypeLabel
                ),
                sectionLabel
                  ? h(
                      "span",
                      {
                        className:
                          "inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent",
                      },
                      sectionNumbering ? `${sectionNumbering} ${sectionLabel}` : sectionLabel
                    )
                  : null,
                difficultyLabel
                  ? h(
                      "span",
                      {
                        className:
                          difficultyId === "easy"
                            ? "inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600"
                            : difficultyId === "medium"
                            ? "inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600"
                            : "inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600",
                      },
                      `${difficultyLabel} Difficulty`
                    )
                  : null
              ),
              h(
                "p",
                { className: "text-lg font-semibold text-slate-800" },
                question.prompt
              ),
              question.type !== "fillInBlank"
                ? h(
                    "div",
                    {
                      className:
                        "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600",
                    },
                    displayContext
                  )
                : null
            ),
            h(
              "div",
              { className: "grid gap-3" },
              question.options.map((option, index) =>
                h(OptionButton, {
                  key: option + index,
                  label: option,
                  index,
                  selected: selectedOptionIndex === index,
                  disabled: answeringDisabled,
                  correctState:
                    selectedOptionIndex === index ? isAnswerCorrect === true : false,
                  onClick: onSelectOption,
                })
              )
            ),
            answerLoading
              ? h(
                  "div",
                  {
                    className:
                      "flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600",
                  },
                  h(
                    "svg",
                    {
                      className: "h-4 w-4 animate-spin text-primary",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      xmlns: "http://www.w3.org/2000/svg",
                    },
                    h("circle", {
                      className: "opacity-25",
                      cx: "12",
                      cy: "12",
                      r: "10",
                      stroke: "currentColor",
                      strokeWidth: "4",
                    }),
                    h("path", {
                      className: "opacity-75",
                      fill: "currentColor",
                      d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z",
                    })
                  ),
                  "Checking answer..."
                )
              : null,
            selectedOptionIndex !== null && !answerLoading
              ? h(
                  "div",
                  {
                    className:
                      "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm",
                  },
                  h(
                    "span",
                    {
                      className:
                        isAnswerCorrect
                          ? "font-semibold text-accent"
                          : "font-semibold text-red-600",
                    },
                    isAnswerCorrect ? "Correct!" : "Not quite—review the material and try again."
                  ),
                  explanation
                    ? h("span", { className: "text-xs text-slate-500" }, explanation)
                    : null,
                  contextSnippet
                    ? h(
                        "div",
                        { className: "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600" },
                        h("p", { className: "font-semibold text-slate-500" }, "In context"),
                        contextSnippet
                      )
                    : null,
                  sectionReference
                    ? h(
                        "a",
                        {
                          href: sectionReference.url,
                          target: "_blank",
                          rel: "noreferrer",
                          className:
                            "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline",
                        },
                        "Open reference",
                        h(
                          "span",
                          { "aria-hidden": true, className: "text-primary/70" },
                          "→"
                        )
                      )
                    : null,
                  h(
                    "span",
                    { className: "text-xs font-medium text-slate-600" },
                    `Correct answer: ${question.correctAnswer}`
                  ),
                  h(
                    "div",
                    { className: "space-y-2" },
                    h(
                      "p",
                      { className: "text-xs uppercase tracking-wide text-slate-400" },
                      "Confidence"
                    ),
                    h(
                      "div",
                      { className: "flex flex-wrap items-center gap-2" },
                      CONFIDENCE_OPTIONS.map((option) =>
                        h(
                          "button",
                          {
                            key: option.id,
                            type: "button",
                            onClick: () => onConfidenceSelect?.(option.id),
                            className:
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition " +
                              (currentConfidence === option.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-slate-200 bg-white text-slate-600 hover:border-primary/40"),
                          },
                          option.label
                        )
                      )
                    ),
                    confidencePending
                      ? h(
                          "p",
                          { className: "text-xs text-amber-600" },
                          "Select your confidence level to continue."
                        )
                      : null
                  ),
                  h(
                    "div",
                    { className: "space-y-2" },
                    h(
                      "label",
                      { className: "text-xs uppercase tracking-wide text-slate-400" },
                      "Notes"
                    ),
                    h("textarea", {
                      value: currentNote || "",
                      onChange: (event) => onNoteChange?.(event.target.value, currentHistoryEntryId),
                      placeholder: "Add personal notes or mnemonics...",
                      className:
                        "h-20 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30",
                    })
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      onClick: onToggleFlag,
                      className:
                        "inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition " +
                        (isCurrentFlagged
                          ? "border border-amber-300 bg-amber-100 text-amber-700"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-amber-300"),
                    },
                    isCurrentFlagged ? "Unflag Question" : "Flag for Review"
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      onClick: onNext,
                      disabled: answerLoading || confidencePending || (sessionActive && session?.answered >= session.questionCount),
                      className:
                        "mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2",
                    },
                    sessionActive && session?.answered >= session.questionCount
                      ? "Session Complete"
                      : "Next Question"
                  )
                )
              : null
          )
        : null
    )
  );
}
