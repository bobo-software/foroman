# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Foroman is a React + TypeScript SPA (Vite dev server on port 5178) for invoice/quotation management. The entire backend is an external BaaS called **Skaftin** — there are no local backend services, databases, or Docker Compose files in this repo.

### Environment variables

A `.env` file is required at the project root with at least:

```
VITE_SKAFTIN_API_URL=http://localhost:4006
VITE_SKAFTIN_API_KEY=sk_your_api_key_here
```

The `.env` file is gitignored. Without valid Skaftin credentials, the frontend will load but API calls (auth, CRUD) will fail.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 5178) |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Preview prod build | `npm run preview` |

### Gotchas

- The ESLint config was renamed from `eslint.config.js` to `eslint.config.cjs` because the project uses `"type": "module"` in `package.json` but the ESLint config uses CommonJS `require()` syntax. If you see ESLint failures about `require is not defined`, ensure the config file has the `.cjs` extension.
- `eslint-plugin-react` is needed as a devDependency (it's referenced in the ESLint config). If `npm install` doesn't install it, run `npm install --save-dev eslint-plugin-react`.
- The project uses `rolldown-vite` (aliased as `vite` via npm overrides). This requires Node 20.19+ or 22.12+.
- There are no automated tests in this repo — validation is done via lint, TypeScript type-checking (`tsc -b`), and manual browser testing.
