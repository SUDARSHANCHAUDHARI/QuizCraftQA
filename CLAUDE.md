# QuizCraftQA — Claude Code Notes

## What is this project?
ISTQB exam prep web app. Uploads PDF syllabi and generates Fill-in-the-Blank, True/False, and Multiple Choice questions. Offline-capable PWA.

## Tech Stack
- React 19 (no JSX build step — uses `React.createElement`)
- Vite 4 + vite-plugin-pwa
- Tailwind CSS 3
- pdf.js for PDF parsing
- idb-keyval for IndexedDB storage
- Recharts for charts
- Vitest + jsdom for tests

## Key Files
- `src/quizService.js` — question generation logic (rule-based)
- `src/pdfService.js` — PDF text extraction
- `src/storage.js` — IndexedDB persistence
- `src/App.js` — root component, state, routing
- `src/ai/apiClient.js` — HTTP client for optional AI endpoints
- `src/ai/studyPlan.js` — study plan generator
- `src/ai/generateVariantQuestion.js` — question variant generator

## Commands
```bash
npm install       # install dependencies
npm run dev       # start dev server (http://localhost:5173)
npm test          # run 85 unit tests
npm run build     # production build
npm run preview   # preview production build
```

## Environment Variables
```
VITE_AI_STUDY_ENDPOINT=    # optional — POST endpoint for study plan AI
VITE_AI_VARIANT_ENDPOINT=  # optional — POST endpoint for question variants
```
Both are optional. App works fully without them.

## Related Projects
- [QuizCraftQA-AI](../QuizCraftQA-AI) — Gemini API backend (Python/FastAPI)
- [QuizCraftQA-NotebookLM](../QuizCraftQA-NotebookLM) — Manual NotebookLM workflow

## Live Demo
https://sudarshanchaudhari.github.io/QuizCraftQA/
