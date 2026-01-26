# QuizCraftQA Roadmap

This roadmap captures the enhancement ideas we discussed. Each item is grouped by theme so we can tackle them one by one and track progress as we go.

## Legend
- [ ] Not started
- [~] In progress
- [x] Completed

## 1. Question Quality & Coverage
- [x] Q1. Introduce multiple question types (true/false, scenario-based, multi-select).
- [x] Q2. Parse PDF headings/topics to map questions to syllabus sections.
- [x] Q3. Add difficulty tagging (e.g., Bloom's taxonomy levels) for each question.

## 2. Quiz Flow & UX
- [x] U1. Support multi-question quiz sessions with progress bar and per-session summary.
- [x] U2. Add confidence tracking (user self-assessment after each question).
- [x] U3. Provide bookmarking/flagging to revisit difficult questions quickly.

## 3. Analytics & Reporting
- [x] A1. Build topic mastery dashboard (accuracy by syllabus area).
- [x] A2. Add daily streaks or custom daily goal tracking.
- [x] A3. Enable export of question history (CSV/JSON).

## 4. Performance & Architecture
- [x] P1. Move Tailwind from CDN to a build pipeline (CLI/PostCSS) for production readiness.
- [x] P2. Offload PDF parsing to a Web Worker to keep the UI responsive on large files.
- [x] P3. Add optional service worker caching (PWA) so quizzes function offline with cached PDFs.

## 5. Content Enrichment
- [x] C1. Surface richer explanations (pull additional context snippets from PDFs).
- [x] C2. Link each question to relevant ISTQB glossary entries or official references.
- [x] C3. Allow manual notes per question to capture learner insights.

## 6. Advanced Analytics & Experience
- [ ] D1. Visualize progress trends (line charts for accuracy, streak progression, confidence over time).
- [ ] D2. Topic filtering and difficulty drill-down in the dashboard.
- [ ] D3. Session enhancements: retry flagged questions, edit notes from summary, custom session templates.

---

### Next Step
Pick the next roadmap code (e.g., D1) when you're ready and I’ll queue it up.
