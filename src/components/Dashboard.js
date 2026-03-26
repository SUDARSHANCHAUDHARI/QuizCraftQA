import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const h = React.createElement;

const TYPE_LABELS = {
  fillInBlank: "Fill in the Blank",
  trueFalse: "True / False",
  multipleChoice: "Multiple Choice",
};

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-50 text-emerald-600",
  medium: "bg-amber-50 text-amber-600",
  hard: "bg-red-50 text-red-600",
};

const SESSION_CONFIDENCE = [
  { id: "low", label: "Low", className: "bg-red-50 text-red-600" },
  { id: "medium", label: "Moderate", className: "bg-amber-50 text-amber-600" },
  { id: "high", label: "High", className: "bg-emerald-50 text-emerald-600" },
];

const CONFIDENCE_COLORS = {
  low: "bg-red-50 text-red-600",
  medium: "bg-amber-50 text-amber-600",
  high: "bg-emerald-50 text-emerald-600",
};

const DIFFICULTY_OPTIONS = [
  { id: "All", label: "All" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

function TrendBar({ label, value, max = 100, color = "bg-primary" }) {
  const percent = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return h(
    "div",
    { className: "space-y-1" },
    h("div", { className: "flex items-center justify-between text-xs text-slate-500" }, label, `${value}`),
    h("div", { className: "h-1.5 w-full rounded-full bg-slate-200" },
      h("div", { className: `h-full rounded-full ${color}`, style: { width: `${percent}%` } })
    )
  );
}

export default function Dashboard({
  pdfCount,
  totalAnswered,
  accuracy,
  history,
  filteredHistory,
  sessionHistory,
  topicStats,
  trendMetrics,
  dailyProgress,
  goalConfig,
  filters,
  availableTopics,
  onGoalChange,
  onFilterChange,
  onExport,
}) {
  const correctCount = React.useMemo(
    () => history.filter((entry) => entry.isCorrect).length,
    [history]
  );

  const recentHistory = React.useMemo(() => filteredHistory.slice(0, 8), [filteredHistory]);
  const recentSessions = React.useMemo(() => sessionHistory.slice(0, 5), [sessionHistory]);

  const stats = React.useMemo(
    () => [
      {
        label: "Uploaded PDFs",
        value: pdfCount,
        trend: pdfCount > 0 ? "Ready for quiz generation" : "Upload materials to begin",
        color: "from-primary/90 to-primary/70",
      },
      {
        label: "Total Questions",
        value: totalAnswered,
        trend: correctCount > 0 ? `${correctCount} answered correctly` : "Start generating questions",
        color: "from-accent/90 to-accent/70",
      },
      {
        label: "Accuracy",
        value: `${accuracy}%`,
        trend: totalAnswered > 0 ? "Keep practicing for mastery" : "Answer questions to see insights",
        color: "from-slate-600 to-slate-400",
      },
      {
        label: "Completed Sessions",
        value: sessionHistory.length,
        trend:
          sessionHistory.length > 0
            ? `Last: ${sessionHistory[0].questionCount} questions at ${sessionHistory[0].accuracy}%`
            : "Start a session to build streaks",
        color: "from-purple-600 to-purple-400",
      },
    ],
    [pdfCount, totalAnswered, accuracy, correctCount, sessionHistory]
  );

  return h(
    "section",
    { className: "space-y-6" },
    h(
      "div",
      {
        className:
          "rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur transition hover:shadow-xl",
      },
      h(
        "h3",
        { className: "text-xl font-semibold text-slate-800" },
        "Learning Dashboard"
      ),
      h(
        "p",
        { className: "text-sm text-slate-500" },
        "Track your ISTQB preparation journey. Upload materials, generate quizzes, and review performance history to stay exam-ready."
      )
    ),
    h(
      "div",
      { className: "grid gap-6 md:grid-cols-2 xl:grid-cols-4" },
      stats.map((stat) =>
        h(
          "div",
          {
            key: stat.label,
            className:
              "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl",
          },
          h("div", {
            "aria-hidden": "true",
            className: `pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${stat.color} opacity-10`,
          }),
          h(
            "div",
            { className: "space-y-3" },
            h(
              "p",
              { className: "text-sm font-medium text-slate-500" },
              stat.label
            ),
            h(
              "p",
              { className: "text-3xl font-semibold text-slate-800" },
              stat.value
            ),
            h(
              "p",
              {
                className: "text-xs font-medium uppercase tracking-wide text-slate-400",
              },
              stat.trend
            )
          )
        )
      )
    ),
    h(
      "div",
      {
        className:
          "rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur transition hover:shadow-xl",
      },
      h(
        "div",
        { className: "mb-4 flex flex-wrap items-center justify-between gap-3" },
        h(
          "h4",
          { className: "text-lg font-semibold text-slate-800" },
          "Filters"
        ),
        h(
          "select",
          {
            className:
              "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40",
            value: filters.topic,
            onChange: (event) => onFilterChange?.({ topic: event.target.value }),
          },
          availableTopics.map((topic) => h("option", { key: topic, value: topic }, topic))
        ),
        h(
          "select",
          {
            className:
              "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40",
            value: filters.difficulty,
            onChange: (event) => onFilterChange?.({ difficulty: event.target.value }),
          },
          DIFFICULTY_OPTIONS.map((option) =>
            h("option", { key: option.id, value: option.id }, option.label)
          )
        ),
        h(
          "label",
          { className: "inline-flex items-center gap-2 text-xs font-semibold text-slate-600" },
          h("input", {
            type: "checkbox",
            checked: filters.flaggedOnly,
            onChange: (event) => onFilterChange?.({ flaggedOnly: event.target.checked }),
            className: "h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary/40",
          }),
          "Flagged only"
        )
      )
    ),
    h(
      "div",
      {
        className:
          "rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur transition hover:shadow-xl",
      },
      h(
        "div",
        { className: "mb-4 flex items-center justify-between" },
        h(
          "h4",
          { className: "text-lg font-semibold text-slate-800" },
          "Topic Mastery"
        ),
        h(
          "div",
          { className: "flex items-center gap-2" },
          h(
            "button",
            {
              type: "button",
              onClick: () => onExport?.("csv"),
              className:
                "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-primary/40",
            },
            "Export CSV"
          ),
          h(
            "button",
            {
              type: "button",
              onClick: () => onExport?.("json"),
              className:
                "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-primary/40",
            },
            "Export JSON"
          )
        )
      ),
      topicStats.length > 0
        ? h(
            "div",
            { className: "space-y-3" },
            topicStats
              .sort((a, b) => b.total - a.total)
              .slice(0, 8)
              .map((topic) =>
                h(
                  "div",
                  {
                    key: (topic.sectionNumbering || "") + topic.sectionTitle,
                    className:
                      "rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-inner",
                  },
                  h(
                    "div",
                    { className: "flex flex-wrap items-center justify-between gap-3" },
                    h(
                      "span",
                      { className: "text-sm font-semibold text-slate-800" },
                      topic.sectionNumbering
                        ? `${topic.sectionNumbering} ${topic.sectionTitle}`
                        : topic.sectionTitle
                    ),
                    h(
                      "span",
                      { className: "text-xs text-slate-400" },
                      `${topic.accuracy}% accuracy`
                    )
                  ),
                  h(
                    "div",
                    { className: "mt-2 flex flex-wrap items-center gap-2 text-xs" },
                    h(
                      "span",
                      {
                        className:
                          "inline-flex items-center rounded-full bg-primary/5 px-3 py-1 font-semibold text-primary",
                      },
                      `Attempts: ${topic.total}`
                    ),
                    h(
                      "span",
                      {
                        className:
                          "inline-flex items-center rounded-full bg-accent/10 px-3 py-1 font-semibold text-accent",
                      },
                      `Correct: ${topic.correct}`
                    ),
                    h(
                      "span",
                      {
                        className:
                          "inline-flex items-center rounded-full bg-red-50 px-3 py-1 font-semibold text-red-600",
                      },
                      `Flagged: ${topic.flagged}`
                    ),
                    topic.reference
                      ? h(
                          "a",
                          {
                            href: topic.reference.url,
                            target: "_blank",
                            rel: "noreferrer",
                            className:
                              "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline",
                          },
                          topic.reference.label || "Reference",
                          h("span", { "aria-hidden": true }, "→")
                        )
                      : null
                  ),
                  h(
                    "div",
                    { className: "mt-2 grid gap-2 text-xs sm:grid-cols-2" },
                    h(
                      "div",
                      { className: "space-y-1" },
                      h(
                        "p",
                        { className: "font-semibold text-slate-600" },
                        "Confidence"
                      ),
                      h(
                        "div",
                        { className: "flex items-center gap-1" },
                        ["low", "medium", "high"].map((level) =>
                          h(
                            "span",
                            {
                              key: level,
                              className:
                                "inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1 font-semibold " +
                                (CONFIDENCE_COLORS[level] || "bg-slate-100 text-slate-500"),
                            },
                            `${topic.confidence?.[level] ?? 0}`
                          )
                        )
                      )
                    ),
                    h(
                      "div",
                      { className: "space-y-1" },
                      h(
                        "p",
                        { className: "font-semibold text-slate-600" },
                        "Difficulty"
                      ),
                      h(
                        "div",
                        { className: "flex items-center gap-1" },
                        ["easy", "medium", "hard"].map((level) =>
                          h(
                            "span",
                            {
                              key: level,
                              className:
                                "inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1 font-semibold " +
                                (DIFFICULTY_STYLES[level] || "bg-slate-100 text-slate-500"),
                            },
                            `${topic.difficultyBreakdown?.[level] ?? 0}`
                          )
                        )
                      )
                    )
                  )
                )
              )
          )
        : h(
            "div",
            {
              className:
                "rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-sm text-slate-500",
            },
            "Answer questions to build topic mastery insights."
          )
    ),
    h(
      "div",
      {
        className:
          "rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur transition hover:shadow-xl",
      },
      h(
        "div",
        { className: "mb-4 flex items-center justify-between" },
        h(
          "h4",
          { className: "text-lg font-semibold text-slate-800" },
          "Daily Goal & Streak"
        ),
        h(
          "div",
          { className: "flex items-center gap-2" },
          h(
            "label",
            { className: "text-xs font-medium text-slate-500" },
            "Daily Goal"
          ),
          h(
            "input",
            {
              type: "number",
              min: 1,
              value: goalConfig.dailyGoal,
              onChange: (event) => onGoalChange?.(Number(event.target.value)),
              className:
                "w-20 rounded-full border border-slate-300 px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40",
            }
          )
        )
      ),
      h(
        "div",
        { className: "space-y-4 text-sm text-slate-600" },
        h(
          "div",
          { className: "rounded-2xl border border-slate-200 bg-slate-50 p-4" },
          h(
            "div",
            { className: "flex items-center justify-between" },
            h("span", { className: "font-semibold text-slate-700" }, "Today"),
            h(
              "span",
              { className: "text-xs text-slate-400" },
              `${dailyProgress.todayCount} / ${dailyProgress.goal}`
            )
          ),
          h(
            "div",
            { className: "mt-2 h-2 w-full rounded-full bg-slate-200" },
            h("div", {
              className: `h-full rounded-full ${dailyProgress.goalMet ? "bg-accent" : "bg-primary"}`,
              style: {
                width: `${Math.min(100, Math.round((dailyProgress.todayCount / dailyProgress.goal) * 100))}%`,
              },
            })
          ),
          dailyProgress.goalMet
            ? h(
                "p",
                { className: "mt-2 text-xs font-semibold text-accent" },
                "Goal met for today!"
              )
            : h(
                "p",
                { className: "mt-2 text-xs text-slate-500" },
                `${Math.max(dailyProgress.goal - dailyProgress.todayCount, 0)} questions to go.`
              )
        ),
        h(
          "div",
          { className: "grid gap-3 sm:grid-cols-2" },
          h(
            "div",
            { className: "rounded-2xl border border-slate-200 bg-slate-50 p-4" },
            h(
              "p",
              { className: "text-xs uppercase tracking-wide text-slate-400" },
              "Current Streak"
            ),
            h(
              "p",
              { className: "text-2xl font-semibold text-primary" },
              dailyProgress.streak
            )
          ),
          h(
            "div",
            { className: "rounded-2xl border border-slate-200 bg-slate-50 p-4" },
            h(
              "p",
              { className: "text-xs uppercase tracking-wide text-slate-400" },
              "Best Streak"
            ),
            h(
              "p",
              { className: "text-2xl font-semibold text-slate-800" },
              dailyProgress.bestStreak
            )
          )
        ),
        h(
          "div",
          { className: "space-y-2" },
          h(
            "p",
            { className: "text-xs uppercase tracking-wide text-slate-400" },
            "Recent Days"
          ),
          dailyProgress.days.length
            ? h(
                "div",
                { className: "grid gap-2 text-xs sm:grid-cols-3" },
                dailyProgress.days
                  .slice(-6)
                  .map(({ day, count }) =>
                    h(
                      "div",
                      {
                        key: day,
                        className:
                          "rounded-xl border border-slate-200 bg-white px-3 py-2 text-center",
                      },
                      h("div", { className: "font-semibold text-slate-700" }, day),
                      h("div", { className: "text-slate-500" }, `${count} questions`)
                    )
                  )
              )
            : h(
                "div",
                {
                  className:
                    "rounded-2xl border border-dashed border-slate-300 bg-slate-100 px-3 py-2 text-center",
                },
                "Answer questions to build your streak."
              )
        )
      )
    ),
    trendMetrics.daily.length
      ? h(
          "div",
          {
            className:
              "rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur transition hover:shadow-xl",
          },
          h(
            "div",
            { className: "mb-4 flex flex-wrap items-center justify-between gap-3" },
            h(
              "h4",
              { className: "text-lg font-semibold text-slate-800" },
              "Trend Overview"
            ),
            h(
              "span",
              { className: "text-xs font-medium text-slate-500" },
              "Last 8 days"
            )
          ),
          h(
            "div",
            { className: "grid gap-6 md:grid-cols-2" },
            h(
              "div",
              { className: "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner" },
              h("p", { className: "mb-2 text-xs uppercase tracking-wide text-slate-400" }, "Accuracy"),
              h(
                "div",
                { className: "h-48" },
                h(
                  ResponsiveContainer,
                  { width: "100%", height: "100%" },
                  h(
                    AreaChart,
                    { data: trendMetrics.daily.slice(-8) },
                    h(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e2e8f0" }),
                    h(XAxis, { dataKey: "day", tick: { fontSize: 10 }, stroke: "#94a3b8" }),
                    h(YAxis, { domain: [0, 100], tick: { fontSize: 10 }, stroke: "#94a3b8" }),
                    h(Tooltip, {
                      cursor: { strokeDasharray: "3 3" },
                      contentStyle: { fontSize: 12 },
                    }),
                    h(Area, {
                      type: "monotone",
                      dataKey: "accuracy",
                      stroke: "#2563eb",
                      fill: "#2563eb33",
                      strokeWidth: 2,
                    })
                  )
                )
              )
            ),
            h(
              "div",
              { className: "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner" },
              h(
                "p",
                { className: "mb-2 text-xs uppercase tracking-wide text-slate-400" },
                "Confidence & Questions"
              ),
              h(
                "div",
                { className: "h-48" },
                h(
                  ResponsiveContainer,
                  { width: "100%", height: "100%" },
                  h(
                    AreaChart,
                    { data: trendMetrics.daily.slice(-8) },
                    h(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e2e8f0" }),
                    h(XAxis, { dataKey: "day", tick: { fontSize: 10 }, stroke: "#94a3b8" }),
                    h(YAxis, { tick: { fontSize: 10 }, stroke: "#94a3b8" }),
                    h(Tooltip, {
                      cursor: { strokeDasharray: "3 3" },
                      contentStyle: { fontSize: 12 },
                    }),
                    h(Area, {
                      type: "monotone",
                      dataKey: "total",
                      stroke: "#10b981",
                      fill: "#10b98133",
                      strokeWidth: 2,
                    }),
                    h(Area, {
                      type: "monotone",
                      dataKey: "avgConfidence",
                      stroke: "#f59e0b",
                      fill: "#f59e0b33",
                      strokeWidth: 2,
                    })
                  )
                )
              )
            )
          )
        )
      : null,
    h(
      "div",
      {
        className:
          "rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur transition hover:shadow-xl",
      },
      h(
        "div",
        { className: "mb-4 flex items-center justify-between" },
        h(
          "h4",
          { className: "text-lg font-semibold text-slate-800" },
          "Recent Question History"
        ),
        totalAnswered > 0
          ? h(
              "span",
              { className: "text-xs font-medium uppercase tracking-wide text-slate-400" },
              `${Math.min(recentHistory.length, totalAnswered)} of ${totalAnswered} shown`
            )
          : null
      ),
      recentHistory.length > 0
        ? h(
            "div",
            { className: "space-y-3" },
            recentHistory.map((entry) =>
              h(
                "div",
                {
                  key: entry.id,
                  className:
                    "rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-inner",
                },
                h(
                  "div",
                  { className: "flex items-center justify-between gap-3" },
                  h(
                    "span",
                    {
                      className:
                        entry.isCorrect
                          ? "inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                          : "inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600",
                    },
                    entry.isCorrect ? "Correct" : "Incorrect"
                  ),
                  h(
                    "span",
                    { className: "text-xs text-slate-400" },
                    entry.timestamp
                      ? (entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp)).toLocaleString()
                      : "—"
                  )
                ),
                h(
                  "span",
                  {
                    className:
                      "mt-2 inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500",
                  },
                  TYPE_LABELS[entry.questionType] || "Question"
                ),
                entry.sectionTitle
                  ? h(
                      "span",
                      {
                        className:
                          "mt-2 inline-flex w-fit items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent",
                      },
                      entry.sectionNumbering
                        ? `${entry.sectionNumbering} ${entry.sectionTitle}`
                        : entry.sectionTitle
                    )
                  : null,
                entry.difficulty
                  ? h(
                      "span",
                      {
                        className:
                          "mt-2 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold " +
                          (DIFFICULTY_STYLES[entry.difficulty.id] || "bg-slate-100 text-slate-500"),
                      },
                      `${entry.difficulty.label} Difficulty`
                    )
                  : null,
                h("p", { className: "mt-2 font-medium text-slate-800" }, entry.prompt),
                h(
                  "div",
                  { className: "mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2" },
                  h(
                    "span",
                    null,
                    h("span", { className: "font-semibold text-slate-600" }, "Your answer:"),
                    ` ${entry.userAnswer}`
                  ),
                  h(
                    "span",
                    null,
                    h("span", { className: "font-semibold text-slate-600" }, "Correct answer:"),
                    ` ${entry.correctAnswer}`
                  )
                ),
                entry.explanation
                  ? h(
                      "p",
                      { className: "mt-2 text-xs italic text-slate-400" },
                      entry.explanation
                    )
                  : null,
                entry.contextSnippet
                  ? h(
                      "p",
                      {
                        className:
                          "mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600",
                      },
                      entry.contextSnippet
                    )
                  : null,
                entry.reference
                  ? h(
                      "a",
                      {
                        href: entry.reference.url,
                        target: "_blank",
                        rel: "noreferrer",
                        className:
                          "mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline",
                      },
                      entry.reference.label || "Official Reference",
                      h("span", { "aria-hidden": true }, "→")
                    )
                  : null,
                entry.note
                  ? h(
                      "p",
                      {
                        className:
                          "mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700",
                      },
                      entry.note
                    )
                  : null
              )
            )
          )
        : h(
            "div",
            {
              className:
                "rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-sm text-slate-500",
            },
            "Answer questions to start building your history log."
          )
    )
  );
}
