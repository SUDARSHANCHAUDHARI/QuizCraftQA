# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in QuizCraftQA, please **do not** open a public GitHub issue.

Instead, report it privately by opening a [GitHub Security Advisory](https://github.com/SUDARSHANCHAUDHARI/QuizCraftQA/security/advisories/new).

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

You can expect an initial response within **72 hours**.

## Security Design

QuizCraftQA is designed with privacy and security in mind:

- **No backend** — all PDF processing runs entirely in your browser via pdf.js
- **No user data collected** — no accounts, no analytics, no telemetry
- **Local storage only** — quiz history and progress are stored in your browser's IndexedDB and never transmitted
- **Optional AI endpoints** — disabled by default; only activated when you configure your own API endpoint via environment variables. Any endpoint you configure is your own responsibility
- **No secrets in code** — API keys are never hardcoded; they are supplied via `.env` files which are excluded from version control

## Environment Variables

Never commit `.env` files. Use `.env.example` as a template and keep real values local only.
