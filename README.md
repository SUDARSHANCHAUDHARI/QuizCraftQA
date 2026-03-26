# QuizCraftQA

ISTQB exam preparation tool that turns your PDF study materials into adaptive quizzes.

## Features

- Upload ISTQB PDFs and auto-generate Fill-in-the-Blank, True/False, and Multiple Choice questions
- Difficulty scoring based on Bloom's taxonomy
- Multi-question sessions with progress tracking
- Confidence rating and question flagging
- Topic mastery dashboard with accuracy trends
- Daily goal and streak tracking
- Export question history as CSV or JSON
- Offline-capable PWA (service worker caching)
- Optional AI study plan and question variant generation

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Sample PDFs for Testing

The `ISTQB/` folder contains official ISTQB syllabus PDFs you can use immediately to test the app:

| File | Syllabus |
|------|----------|
| `ISTQB_CTFL_Syllabus_v4.0.1 (1).pdf` | Foundation Level v4.0.1 *(start here)* |
| `ISTQB-CTAL-TA-Syllabus-v4.0-EN.pdf` | Advanced Level — Test Analyst v4.0 |
| `ISTQB-CTAL-TTA_Syllabus_v4.0.pdf` | Advanced Level — Technical Test Analyst v4.0 |
| `ISTQB_CTAL-TM_Syllabus_v3.0_ALL_.pdf` | Advanced Level — Test Manager v3.0 |
| `ISTQB_CTAL-TAE_Syllabus_v2.0.pdf` | Advanced Level — Test Automation Engineer v2.0 |
| `ISTQB-CT-MAT_Syllabus_v1.0_2019_EN_.pdf` | Specialist — Mobile Application Testing |
| `ISTQB_CT-AI_Syllabus_v1.0.pdf` | Specialist — AI Testing |
| `ISTQB_CT-MBT_-_Syllabus_Version_v1.1.pdf` | Specialist — Model-Based Testing |
| `istqb-test-automation-strategy-syllabus.pdf` | Specialist — Test Automation Strategy |

**To load a sample PDF:**
1. Click **Upload PDF** in the app
2. Select any file from the `ISTQB/` folder
3. Click **Generate Question** to start quizzing

## Build for Production

```bash
npm run build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values as needed.

```bash
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `VITE_AI_STUDY_ENDPOINT` | POST endpoint for AI study plan generation | No |
| `VITE_AI_VARIANT_ENDPOINT` | POST endpoint for AI question variant generation | No |

Both AI endpoints are optional. When omitted, the app uses deterministic fallbacks so all features remain functional without a backend.

## Running Tests

```bash
# Run all unit tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

**85 tests** across 7 test files covering:
- Question generation and answer checking (`quizService`)
- PDF storage and serialization (`storage`)
- App helper functions — topic stats, daily progress, streaks (`appHelpers`)
- HTTP client and credential redaction (`apiClient`)
- AI study plan fallback logic (`studyPlan`)
- Question variant generation (`generateVariantQuestion`)
- ISTQB reference map lookups (`referenceMap`)

## Project Structure

```
ISTQB/                            # Sample ISTQB syllabus PDFs for testing
src/
├── App.js                        # Root component — state, handlers, routing
├── main.jsx                      # React entry point
├── quizService.js                # Question generation and answer checking
├── pdfService.js                 # PDF parsing (pdf.js, runs on main thread)
├── storage.js                    # IndexedDB persistence (idb-keyval)
├── referenceMap.js               # ISTQB syllabus reference links
├── index.css                     # Tailwind base styles
├── ai/
│   ├── apiClient.js              # Generic HTTP client for AI endpoints
│   ├── generateVariantQuestion.js  # Alternate question generator
│   └── studyPlan.js              # Personalised study plan generator
├── components/
│   ├── QuizQuestion.js           # Quiz workspace and session UI
│   ├── PDFUploader.js            # PDF upload and management
│   └── Dashboard.js              # Analytics and history dashboard
├── workers/
│   └── pdfWorker.js              # (Legacy — superseded by pdfService.js)
└── __tests__/
    ├── quizService.test.js
    ├── storage.test.js
    ├── appHelpers.test.js
    ├── apiClient.test.js
    ├── studyPlan.test.js
    ├── generateVariantQuestion.test.js
    └── referenceMap.test.js
```

## Tech Stack

- React 19 (no build-time JSX — uses `React.createElement`)
- Vite 4 + vite-plugin-pwa
- Tailwind CSS 3
- pdf.js for PDF text extraction
- idb-keyval for IndexedDB storage
- Recharts for analytics charts
- Vitest + jsdom for unit testing
