# graphl-ui

The presentation **UI application** — React + Vite + Tailwind + React Flow.
It renders interactive presentations for technical concepts (Apache Spark, Scala,
Python, ML, …). Content lives in separate repos (e.g.
[`apache-spark-ct`](../apache-spark-ct)) and is loaded at runtime.

Each page is split into two parts:

- **Scene** — an interactive React Flow canvas (left)
- **Slide** — a PowerPoint-style key-points panel (right)

A scene is authored once and reused across many pages, each pairing it with a
different slide and optional per-page overrides (highlights / viewport).

## Run it

```sh
# 1. Serve a content repo on :5174 (in another terminal)
cd ../apache-spark-ct && npx serve -l 5174 .

# 2. Start the UI
npm install
npm run dev          # http://localhost:5173
```

In dev, `/content` is proxied to the content server (see `vite.config.ts`).
For prod, set `VITE_CONTENT_BASE_URL` to where content is hosted.

## Scripts

- `npm run dev` – dev server
- `npm run build` – type-check + production build
- `npm run preview` – preview the build
- `npm run lint` – ESLint

## Architecture

See [`CLAUDE.md`](./CLAUDE.md) for the domain model and conventions.
