/**
 * Core domain model. See CLAUDE.md for the conceptual overview.
 *
 *   Presentation -> ordered Page[] -> each Page = (sceneId + Slide + overrides)
 *   Scene        -> reusable React Flow graph, referenced by id from many Pages
 */
import type { Viewport } from '@xyflow/react'
import type { SceneSpec } from '../scene/types'

export type { SceneSpec, SceneNodeSpec, SceneEdgeSpec, SceneGrid, NodeKind } from '../scene/types'

/**
 * A reusable scene: declarative `SceneSpec` data (grid + nodes-with-cells +
 * edges). The UI resolves cells -> pixel geometry at render time
 * (`scene/grid.ts`); no positions are stored. Authored once, referenced by many
 * pages.
 */
export type Scene = SceneSpec & {
  /** Default viewport when no page override is supplied. */
  defaultViewport?: Viewport
}

/** Page-specific tweaks applied on top of a shared Scene (never mutate the Scene). */
export interface SceneOverrides {
  /** Node ids to visually emphasize on this page. */
  highlightNodeIds?: string[]
  /** Edge ids to visually emphasize on this page. */
  highlightEdgeIds?: string[]
  /** Subset of node ids to reveal (others dimmed/hidden) for step-by-step builds. */
  visibleNodeIds?: string[]
  /** Override viewport (focus/zoom) for this page. */
  viewport?: Viewport
}

/** Optional narration for a page (text-to-speech script + pre-rendered audio). */
export interface Narration {
  /** TTS script text. */
  text?: string
  /** Path/URL (relative to the content base) of the pre-rendered audio file. */
  audioSrc?: string
}

/** PowerPoint-style content panel for a single page. */
export interface Slide {
  title: string
  /** Key talking points. */
  bullets?: string[]
  /** Optional code snippet shown on the slide. */
  code?: { language: string; source: string }
  /** Optional longer-form notes / speaker notes. */
  notes?: string
}

/** A page pairs one shared Scene with one Slide and optional per-page tweaks. */
export interface Page {
  id: string
  sceneId: string
  slide: Slide
  overrides?: SceneOverrides
  narration?: Narration
}

/** A deck: an ordered list of pages on one topic. */
export interface Presentation {
  id: string
  title: string
  topic: string
  pages: Page[]
}

/** Top-level manifest a content repo exposes: its scenes + presentations. */
export interface ContentManifest {
  scenes: Record<string, Scene>
  presentations: Presentation[]
}
