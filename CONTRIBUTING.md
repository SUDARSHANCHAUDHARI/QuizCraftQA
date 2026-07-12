# Contributing to QuizCraftQA

Thank you for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/SUDARSHANCHAUDHARI/QuizCraftQA.git
cd QuizCraftQA
pnpm install
pnpm run dev
```

## Development Workflow

1. Create a branch from `main`
2. Make your changes
3. Run the test suite — all tests must pass before opening a PR
4. Push your branch and open a pull request

## Running Tests

```bash
pnpm test              # run all tests once
pnpm run test:watch    # re-run on file changes
pnpm run test:coverage # generate coverage report
```

## Project Conventions

- **No build-time JSX** — the project uses `React.createElement` / `h()` directly. Do not add a Babel/TSX JSX transform.
- **Pure functions first** — keep business logic (question generation, stats computation) in plain JS modules so they can be tested without React.
- **Fallbacks required** — any AI-powered feature must have a deterministic fallback so the app works without a backend.
- **No new dependencies without discussion** — the bundle is intentionally lean.

## Adding New Question Types

New question types live in `src/quizService.js` inside the `GENERATORS` map. Each generator receives a `base` object and must return `{ prompt, options?, correctAnswer, explanation, type }` or `null` if it cannot generate a question from the given sentence.

## Adding New Test Files

Place test files in `src/__tests__/` with the `.test.js` extension. Mock external dependencies (`idb-keyval`, `pdfjs-dist`, `fetch`) at the top of the file using `vi.mock`.

## Reporting Bugs

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behaviour
- Browser and OS version
