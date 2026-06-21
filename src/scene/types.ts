/**
 * The SceneSpec — the declarative authoring contract for one scene. Ported from
 * graphl-mobile so both apps share one visual grammar. It is deliberately
 * render-free: nodes are placed on a grid by `cell` coordinates and the layout
 * engine (`grid.ts#resolveGrid`) resolves cells -> pixel boxes at render time.
 * Content repos publish this shape as data (JSON); the UI runs the algorithm —
 * no pixel geometry is ever hand-authored.
 */

export type NodeKind = 'symbol' | 'term' | 'container' | 'group' | 'code'

export interface SceneNodeSpec {
  id: string
  label: string
  /** [col, row, colSpan?, rowSpan?] within the PARENT's grid (scene grid at top level). */
  cell: [number, number, number?, number?]
  /** Palette name ('blue' | 'orange' | …) or a raw hex string. */
  color?: string
  /**
   * 'term' = filled chip whose text IS the concept; 'symbol' = labelled node;
   * 'container' = titled box whose `children` are laid out INSIDE its box (a
   * title band is reserved at the top); 'group' = an invisible container (no
   * chrome/label) used only to sub-arrange its children; 'code' = highlighted
   * snippet.
   */
  kind?: NodeKind
  /** Optional smaller caption under the label. */
  sub?: string
  /** For `kind: 'code'`: source language hint (currently informational; code
   *  renders as plain monospace text — syntax highlighting can be re-added). */
  lang?: string
  /**
   * Inner grid for this node's `children`. Children are resolved relative to
   * this node's pixel box (nesting), so containment is exact.
   */
  layout?: SceneGrid
  /** Child nodes laid out inside this node's box via `layout`. */
  children?: SceneNodeSpec[]
}

export interface SceneEdgeSpec {
  from: string
  to: string
  label?: string
  /** Palette name or hex. */
  color?: string
  /** Animate "flow in path" along this edge. Defaults to true. */
  animated?: boolean
  /** Optional node-handle ids to route through (React Flow). */
  sourceHandle?: string
  targetHandle?: string
}

export interface SceneGrid {
  cols: number
  rows: number
  /** Gap between cells, in grid units (relative). Default 0.2. */
  gap?: number
  /** Inner padding, in grid units (relative). Default 0.4. */
  padding?: number
}

export interface SceneSpec {
  id: string
  title?: string
  subtitle?: string
  /** Topic the scene belongs to (e.g. 'apache-spark'). Optional in the UI. */
  topic?: string
  grid: SceneGrid
  nodes: SceneNodeSpec[]
  edges: SceneEdgeSpec[]
}
