import type { SceneGrid, SceneNodeSpec } from './types'

// Ported from graphl-mobile (originally NodeMap's `resolve()`). Emits top-left
// pixel boxes because React Flow positions nodes by their top-left corner.

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

// Fraction of a container's height reserved at the top for its title, capped so
// it never dominates a tall box. Children are laid out in the remaining body, so
// they sit clear of the label instead of being bottom-aligned by a coarse row.
const TITLE_BAND = 0.28
const TITLE_CAP = 46

/**
 * Resolve the scene tree into an id -> absolute Box map (top-left origin) for
 * React Flow. Top-level nodes are placed on the scene grid; a node with
 * `children` + `layout` resolves those children INSIDE its own pixel box
 * (recursively), so a container truly measures its contents.
 */
export function resolveGrid(
  nodes: SceneNodeSpec[],
  grid: SceneGrid,
  canvas: { width: number; height: number },
): Record<string, Box> {
  if (import.meta.env.DEV) validateLayout(nodes, grid)
  const out: Record<string, Box> = {}
  layoutLevel(nodes, grid, { x: 0, y: 0, w: canvas.width, h: canvas.height }, out)
  return out
}

/** Place one level of siblings within `box`, then recurse into their children. */
function layoutLevel(
  nodes: SceneNodeSpec[],
  grid: SceneGrid,
  box: Box,
  out: Record<string, Box>,
): void {
  const { cols, rows, gap = 0.2, padding = 0.4 } = grid

  // Relative gap/padding (grid units) → pixels, using one cell as the unit so
  // spacing scales with the box.
  const cellW = box.w / (cols + 2 * padding + (cols - 1) * gap)
  const cellH = box.h / (rows + 2 * padding + (rows - 1) * gap)
  const gapX = cellW * gap
  const gapY = cellH * gap
  const padX = cellW * padding
  const padY = cellH * padding

  for (const node of nodes) {
    const [c, r, cs = 1, rs = 1] = node.cell
    const nb: Box = {
      x: box.x + padX + c * (cellW + gapX),
      y: box.y + padY + r * (cellH + gapY),
      w: cs * cellW + (cs - 1) * gapX,
      h: rs * cellH + (rs - 1) * gapY,
    }
    out[node.id] = nb

    if (node.children?.length && node.layout) {
      // Reserve a title band for containers (groups are chrome-less).
      const title = node.kind === 'container' ? Math.min(nb.h * TITLE_BAND, TITLE_CAP) : 0
      const inner: Box = { x: nb.x, y: nb.y + title, w: nb.w, h: nb.h - title }
      layoutLevel(node.children, node.layout, inner, out)
    }
  }
}

type Rect = { id: string; c: number; r: number; cs: number; rs: number }

const rect = (n: SceneNodeSpec): Rect => {
  const [c, r, cs = 1, rs = 1] = n.cell
  return { id: n.id, c, r, cs, rs }
}

const overlaps = (a: Rect, b: Rect) =>
  a.c < b.c + b.cs && b.c < a.c + a.cs && a.r < b.r + b.rs && b.r < a.r + a.rs

const contains = (a: Rect, b: Rect) =>
  a.c <= b.c && a.r <= b.r && a.c + a.cs >= b.c + b.cs && a.r + a.rs >= b.r + b.rs

/**
 * Dev-only sanity check on authored cells: warns on nodes that run off their
 * grid or collide. Validation is per level: each node's `children` are checked
 * against the node's own `layout`. A `container`/`group` is a backdrop its peers
 * may sit on, so an overlap is a genuine collision only when neither node is a
 * container/group and neither fully contains the other.
 */
export function validateLayout(nodes: SceneNodeSpec[], grid: SceneGrid): void {
  const { cols, rows } = grid

  for (const { id, cell } of nodes) {
    const [c, r, cs = 1, rs = 1] = cell
    if (c < 0 || r < 0 || c + cs > cols || r + rs > rows) {
      console.warn(
        `[layout] "${id}" cell ${JSON.stringify(cell)} runs off the ${cols}×${rows} grid`,
      )
    }
  }

  const rects = nodes.map(rect)
  const isBackdrop = new Set(
    nodes.filter((n) => n.kind === 'container' || n.kind === 'group').map((n) => n.id),
  )
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i]
      const b = rects[j]
      if (isBackdrop.has(a.id) || isBackdrop.has(b.id)) continue
      if (!overlaps(a, b) || contains(a, b) || contains(b, a)) continue
      console.warn(`[layout] "${a.id}" and "${b.id}" overlap`)
    }
  }

  for (const node of nodes) {
    if (node.children?.length && node.layout) validateLayout(node.children, node.layout)
  }
}
