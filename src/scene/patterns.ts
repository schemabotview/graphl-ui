import type { SceneGrid, SceneNodeSpec } from './types'

// Layout-pattern helpers (ported from graphl-mobile). Most scenes are one of a
// few shapes — a pipeline, a fan-out, layered bands, or a hub with spokes.
// These helpers own BOTH the grid sizing and the cells, so you describe the
// shape and get a non-overlapping, auto-centered placement back. They are an
// AUTHORING convenience: run them (e.g. in a content-repo build script) to emit
// the resolved SceneSpec data; the UI consumes that data and resolves geometry.

/** A node minus its `cell` — the helper fills that in. */
export type NodeSeed = Omit<SceneNodeSpec, 'cell'>

export interface PatternResult {
  grid: SceneGrid
  nodes: SceneNodeSpec[]
}

export interface PatternOpts {
  /** Override grid gap (grid units). */
  gap?: number
  /** Override grid padding (grid units). */
  padding?: number
  /** Drop the empty gap lanes between items, giving each chip ~2× the width. */
  tight?: boolean
}

function withCell(seed: NodeSeed, cell: SceneNodeSpec['cell']): SceneNodeSpec {
  return { ...seed, cell }
}

// With N items a track needs 2N-1 cells (item, gap, item, …) and a stage of k
// items inside `len` cells starts at `(len - (2k-1)) / 2`. `tight` drops the
// empty lanes (track = N cells), so each chip gets ~2× the width.
const trackLen = (count: number, tight: boolean) =>
  Math.max(tight ? count : 2 * count - 1, 1)
const trackStep = (tight: boolean) => (tight ? 1 : 2)
const startOffset = (len: number, count: number, tight: boolean) =>
  Math.floor((len - trackLen(count, tight)) / 2)

/** Multi-column flow, left → right. Each inner array is one column (top→bottom). */
export function columns(stages: NodeSeed[][], opts: PatternOpts = {}): PatternResult {
  const { tight = false, ...gridOpts } = opts
  const step = trackStep(tight)
  const maxCount = Math.max(...stages.map((s) => s.length), 1)
  const cols = trackLen(stages.length, tight)
  const rows = trackLen(maxCount, tight)
  const nodes = stages.flatMap((stage, s) => {
    const offset = startOffset(rows, stage.length, tight)
    return stage.map((seed, i) => withCell(seed, [step * s, offset + step * i]))
  })
  return { grid: { cols, rows, ...gridOpts }, nodes }
}

/** Multi-row flow, top → bottom — the transpose of `columns`. */
export function rows(bands: NodeSeed[][], opts: PatternOpts = {}): PatternResult {
  const { tight = false, ...gridOpts } = opts
  const step = trackStep(tight)
  const maxCount = Math.max(...bands.map((b) => b.length), 1)
  const rowCount = trackLen(bands.length, tight)
  const cols = trackLen(maxCount, tight)
  const nodes = bands.flatMap((band, r) => {
    const offset = startOffset(cols, band.length, tight)
    return band.map((seed, i) => withCell(seed, [offset + step * i, step * r]))
  })
  return { grid: { cols, rows: rowCount, ...gridOpts }, nodes }
}

/** A single straight line of nodes. `vertical` (default) stacks top→bottom. */
export function pipeline(
  seeds: NodeSeed[],
  axis: 'vertical' | 'horizontal' = 'vertical',
  opts: PatternOpts = {},
): PatternResult {
  return axis === 'vertical'
    ? rows(seeds.map((s) => [s]), opts)
    : columns(seeds.map((s) => [s]), opts)
}

/** One source feeding many targets. */
export function fanOut(
  source: NodeSeed,
  targets: NodeSeed[],
  axis: 'horizontal' | 'vertical' = 'horizontal',
  opts: PatternOpts = {},
): PatternResult {
  return axis === 'horizontal'
    ? columns([[source], targets], opts)
    : rows([[source], targets], opts)
}

/** A central hub ringed by up to 8 spokes on a 3×3 grid. */
export function hubSpoke(
  hub: NodeSeed,
  spokes: NodeSeed[],
  opts: PatternOpts = {},
): PatternResult {
  const ring: Array<[number, number]> = [
    [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1], [0, 0],
  ]
  if (spokes.length > ring.length) {
    console.warn(`[layout] hubSpoke supports ${ring.length} spokes, got ${spokes.length}`)
  }
  const nodes: SceneNodeSpec[] = [
    withCell(hub, [1, 1]),
    ...spokes.slice(0, ring.length).map((seed, i) => withCell(seed, [ring[i][0], ring[i][1]])),
  ]
  return { grid: { cols: 3, rows: 3, ...opts }, nodes }
}

/** Title/colour metadata for a `container` (or just `id` for a `group`). */
export interface ContainerMeta {
  id: string
  label: string
  color?: string
  sub?: string
}

/** Inner spacing for a wrapper's child grid (overrides the content grid's). */
export type WrapOpts = Pick<PatternOpts, 'gap' | 'padding'>

/** Wrap a helper result as a titled `container` node (children laid out inside). */
export function container(
  meta: ContainerMeta,
  content: PatternResult,
  opts: WrapOpts = {},
): SceneNodeSpec {
  return {
    ...meta,
    kind: 'container',
    cell: [0, 0],
    layout: { ...content.grid, ...opts },
    children: content.nodes,
  }
}

/** Like `container`, but an invisible wrapper (no border/label) — sub-arranges. */
export function group(id: string, content: PatternResult, opts: WrapOpts = {}): SceneNodeSpec {
  return {
    id,
    label: '',
    kind: 'group',
    cell: [0, 0],
    layout: { ...content.grid, ...opts },
    children: content.nodes,
  }
}

/** One band of a vertical `stack`. */
export interface StackBand {
  /** A leaf seed, or a `container()`/`group()` result. */
  node: NodeSeed
  /** Vertical row-span — proportional height of this band. Default 1. */
  rows?: number
}

/** Vertically arrange nodes into ONE grid (the scene root, or wrapper content). */
export function stack(
  bands: StackBand[],
  opts: PatternOpts & { cols?: number } = {},
): PatternResult {
  const { cols = 3, ...gridOpts } = opts
  const center = Math.floor((cols - 1) / 2)
  const nodes: SceneNodeSpec[] = []
  let row = 0
  for (const { node, rows: span = 1 } of bands) {
    const fills = node.kind === 'container' || node.kind === 'group' || node.kind === 'code'
    const cell: SceneNodeSpec['cell'] = fills ? [0, row, cols, span] : [center, row, 1, span]
    nodes.push({ ...node, cell })
    row += span
  }
  return { grid: { cols, rows: row, ...gridOpts }, nodes }
}

/** A leaf term-chip seed for `section` (id + label, optional color/sub). */
export interface Chip {
  id: string
  label: string
  color?: string
  sub?: string
}

/** A titled box holding bands of term-chips — the shared grammar for cheat-sheets. */
export function section(meta: ContainerMeta, bands: Chip[][], opts: WrapOpts = {}): SceneNodeSpec {
  const content = rows(
    bands.map((band) => band.map((c) => ({ color: meta.color, ...c, kind: 'term' as const }))),
    { tight: true },
  )
  return container(meta, content, opts)
}
