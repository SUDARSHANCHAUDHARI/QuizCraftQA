# QuizCraftQA

[![CI](https://github.com/SUDARSHANCHAUDHARI/QuizCraftQA/actions/workflows/ci.yml/badge.svg)](https://github.com/SUDARSHANCHAUDHARI/QuizCraftQA/actions/workflows/ci.yml)
[![Deploy](https://github.com/SUDARSHANCHAUDHARI/QuizCraftQA/actions/workflows/deploy.yml/badge.svg)](https://github.com/SUDARSHANCHAUDHARI/QuizCraftQA/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://sudarshanchaudhari.github.io/QuizCraftQA/)

ISTQB exam preparation tool that turns your PDF study materials into adaptive quizzes.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Sample PDFs for Testing](#sample-pdfs-for-testing)
- [Build for Production](#build-for-production)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Privacy Policy](#privacy-policy)
- [About](#about)

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
pnpm install
pnpm run dev
```

Open `http://localhost:5173` in your browser.

## Sample PDFs for Testing

The `ISTQB/` folder contains official ISTQB syllabus PDFs you can use immediately to test the app:

| File | Syllabus |
|------|----------|
| `ISTQB_CTFL_Syllabus_v4.0.1.pdf` | Foundation Level v4.0.1 *(start here)* |
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
pnpm run build
pnpm run preview
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
pnpm test

# Watch mode (re-runs on file changes)
pnpm run test:watch

# With coverage report
pnpm run test:coverage
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

## Privacy Policy

See [Privacy Policy](https://github.com/SUDARSHANCHAUDHARI/quizcraftqa-privacy-policy) for details on data handling.

---

## About

I'm Sudarshan Chaudhari, a Senior Quality Engineer, Test Automation specialist, and AI systems builder based in Bangkok, Thailand.

I have 13+ years of experience in software quality engineering, working across SaaS, fintech, gaming, web, mobile, cloud, and digital signage platforms. My background combines hands-on test automation with QA leadership, test strategy, CI/CD, release quality, production investigation, and cross-platform validation.

Alongside my professional QA career, I run [SudarshanTechLabs](https://sudarshantechlabs.com/), my independent engineering and product lab where I design, build, test, and ship software across Android, web, AI, cybersecurity, developer tooling, and cross-platform applications.

### What I work on

- ⚙️ **Quality Engineering & Test Automation** — Playwright, Selenium, Cypress, Appium, API testing, automation frameworks, end-to-end testing, CI/CD, release gates, GitHub Actions, risk-based testing, and production validation
- 🤖 **AI Systems & Automation** — AI agents, multi-agent orchestration, MCP servers, AI-assisted QA, prompt tooling, developer workflows, automation systems, and Claude Code plugins
- 📱 **Mobile & Cross-Platform Applications** — Android applications built with Kotlin and Jetpack Compose, Google Play releases, automated build and publishing pipelines, and cross-platform development spanning iOS, web, Windows, and macOS
- 🌐 **Web Applications & Platforms** — Full-stack applications using Next.js, TypeScript, Firebase, Cloudflare, REST APIs, and modern web infrastructure
- 🛠️ **Developer Tooling & CLI Engineering** — Rust, Python, TypeScript, CLI utilities, multi-repository tooling, build automation, release tooling, and engineering productivity systems
- 🛡️ **Cybersecurity & Observability** — Threat detection, log analysis, security auditing, vulnerability assessment, monitoring, and security-focused developer tools
- 📺 **Digital Signage & Device Platforms** — Content validation, playback testing, device compatibility, production investigation, monitoring, and QA across diverse hardware and operating-system environments

My work sits at the intersection of quality engineering, automation, AI, and software development. I approach products with a QA mindset from the beginning: understanding failure modes, designing for testability, automating repetitive work, and building release confidence into the engineering process.

Through SudarshanTechLabs, I also build products and tools from idea to production, covering architecture, development, testing, CI/CD, release automation, monitoring, and ongoing maintenance.

🌐 [sudarshantechlabs.com](https://sudarshantechlabs.com/) · 💼 [LinkedIn](https://linkedin.com/in/sudarshan-chaudhari) · 🐙 [GitHub](https://github.com/SUDARSHANCHAUDHARI) · ✉️ [sunny.sudarshan@gmail.com](mailto:sunny.sudarshan@gmail.com)
