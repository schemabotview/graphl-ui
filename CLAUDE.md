# CLAUDE.md — graphl-ui

The presentation **UI application**. Renders interactive, diagram-driven
presentations for technical concepts. Content is loaded at runtime from a
separate content repo (e.g. `../apache-spark-ct`) — no content lives here.

## Domain model

```
Presentation -> ordered Page[] -> each Page = (sceneId + Slide + overrides + narration)
Scene        -> reusable SceneSpec (declarative grid), referenced by id from many Pages
```

- **Scene** — reusable `SceneSpec` (`{ id, grid, nodes, edges }`). Nodes carry a
  logical `cell` (not pixels); `src/scene/grid.ts#resolveGrid` resolves cells →
  pixel boxes at render time, and `SceneViewer` draws them with the custom neon
  node/edge types (`src/scene/`). Authored once, referenced by many pages.
- **Slide** — PowerPoint-style panel for one page (title, bullets, code, notes).
- **Page** — pairs one `sceneId` + one `Slide` + optional `overrides`
  (highlights / visible subset / viewport) + optional `narration` (TTS text +
  audio).
- **Presentation** — ordered list of pages on one topic.

Types live in `src/types/index.ts` and are the single source of truth.

> Rule: visual + reusable → **Scene**. Page-specific (text, highlights, focus,
> narration) → **Page**. Never bake page context into a Scene; apply it via
> `SceneOverrides`.

## Stack

- React + TypeScript + Vite
- Tailwind v4 (via `@tailwindcss/vite`; `@import "tailwindcss"` in `index.css`)
- React Flow (`@xyflow/react`)
- React Router (`/p/:presentationId/:pageIndex` — pages are deep-linkable)

## Structure

```
src/
  types/         # domain types (Scene, Slide, Page, Presentation, ...)
  scene/         # the visual engine: SceneSpec types, grid resolver, layout
                 #   patterns, SceneNode/FlowEdge render + scene.css
  content/       # client.ts (fetch + resolveAsset), useManifest.ts
  components/    # SceneViewer, SlidePanel, PageView (the 2-part split)
  pages/         # HomePage, PresentationView (routed screens)
```

The `src/scene/` engine is ported from `graphl-mobile` so both apps share one
visual grammar (see `../apache-spark-ct/README.md` for the SceneSpec data shape).

## Content loading

- Content is fetched from `VITE_CONTENT_BASE_URL` (`src/content/client.ts`).
- Dev: `/content` is proxied to the content server (`vite.config.ts`,
  `.env.development.local`). Prod: set the env var to the hosted content URL.
- `<base>/manifest.json` lists scene ids + presentations; each scene is loaded
  from `<base>/scenes/<id>.json` (a `SceneSpec`). An inline `scenes` map is still
  accepted for back-compat.
- Audio/asset paths in content are resolved via `resolveAsset()` relative to the
  same base.

## Conventions

- Scenes are data-first (declarative `SceneSpec`) and decoupled from pages.
- The shared custom node/edge types live in `src/scene/` (`SceneNode`,
  `FlowEdge`); author scene shape with the `src/scene/patterns.ts` helpers.
- Apply per-page differences through `SceneOverrides`, not by editing scenes.

## Commands

- `npm run dev` · `npm run build` (tsc + vite) · `npm run preview` · `npm run lint`
