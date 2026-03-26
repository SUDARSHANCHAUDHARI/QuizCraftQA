# Changelog

All notable changes to QuizCraftQA are documented here.

## [Unreleased]

## [1.1.0] - 2026-03-26

### Added
- 9 official ISTQB syllabus PDFs in `ISTQB/` folder for immediate testing (Foundation, Advanced, Specialist levels)
- Unit test suite — 85 tests across 7 files (Vitest + jsdom)
- `src/ai/apiClient.js` — generic HTTP client with credential redaction for AI endpoints
- `src/ai/generateVariantQuestion.js` — AI-powered question variant generator with deterministic fallback
- `.gitignore` to exclude `node_modules/`, `dist/`, `.DS_Store`, `.env`
- `.env.example` documenting optional AI endpoint variables
- `CONTRIBUTING.md` with development workflow and conventions
- `LICENSE` (MIT)

### Fixed
- PDF parsing moved from Web Worker to main thread in `pdfService.js`, resolving "document is not defined" and "GlobalWorkerOptions.workerSrc" errors
- `storage.js` — deserialise `uploadedAt` ISO string back to `Date` on load (was causing RangeError in `PDFUploader`)
- `PDFUploader.js` — defensive `formatDateTime` handles strings, Date objects, and invalid values; added 50 MB file size limit
- `quizService.js` — removed duplicate `fillInBlank` entry that caused 50 % bias toward fill-in-the-blank questions; fixed `sectionNumbering` regex double-call
- `studyPlan.js` — catch block now returns `fallbackStudyPlan()` instead of rethrowing, so AI errors never crash the app
- `tailwind.config.js` — added missing `primary` and `accent` custom colors (was causing all themed UI elements to render unstyled)
- `App.js` — added loading guard in `handleGenerate` to prevent duplicate requests; capped daily goal input at 200
- `index.html` — added inline SVG favicon to fix 404 on first load

### Changed
- `README.md` rewritten with quick-start guide, ISTQB PDF table, test instructions, and full project structure

## [1.0.0] - 2025-11-10

### Added
- Initial release
- PDF upload and text extraction via pdf.js
- Fill-in-the-blank, True/False, and Multiple Choice question generation
- Bloom's taxonomy difficulty tagging
- Multi-question quiz sessions with progress bar and per-session summary
- Confidence rating and question flagging
- Topic mastery dashboard (accuracy by syllabus section)
- Daily goal and streak tracking
- Export question history as CSV or JSON
- ISTQB syllabus reference links per question
- Manual notes per question
- Offline-capable PWA with service worker caching
- Optional AI study plan generation
- IndexedDB persistence via idb-keyval
- Analytics charts via Recharts
