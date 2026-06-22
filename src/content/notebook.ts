/**
 * Notebook-backed presentations. A content repo can describe a module as a
 * reference to a Jupyter notebook (`.ipynb`) plus a per-section overlay, instead
 * of hand-authored pages. The notebook is the single source of truth for prose +
 * code; the overlay wires each `##` section to a scene, highlights, and audio.
 *
 * `notebookToPages` splits the notebook at each level-2 heading into sections,
 * renders markdown cells as-is and code cells as fenced ```python blocks, then
 * matches each section to its overlay (by heading) to produce normalized Pages —
 * the same shape the rest of the app already renders.
 */
import type { Page, SceneOverrides } from '../types'

interface NotebookCell {
  cell_type: string
  source: string | string[]
}
export interface NotebookJson {
  cells: NotebookCell[]
}

/** Per-section overlay authored in the manifest for a notebook-based module. */
export interface SectionOverlay {
  /** The notebook's `## ` heading text this overlay applies to (matched loosely). */
  heading: string
  id?: string
  /** Override the slide title (defaults to the notebook heading). */
  title?: string
  /** Scene id for this section (defaults to the module's `defaultScene`). */
  scene?: string
  highlightNodeIds?: string[]
  /** Path to the per-section TTS script (authoring input; not rendered). */
  tts?: string
  /** Path to the per-section pre-rendered audio; lights up the player when set. */
  audio?: string
}

export interface NotebookModule {
  defaultScene?: string
  sections?: SectionOverlay[]
}

const cellText = (c: NotebookCell): string =>
  Array.isArray(c.source) ? c.source.join('') : (c.source ?? '')

const normHeading = (h: string): string =>
  h.toLowerCase().replace(/`/g, '').replace(/\s+/g, ' ').trim()

const slug = (h: string): string =>
  normHeading(h).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section'

interface ParsedSection {
  heading: string
  body: string
}

/** Split a notebook into sections at each level-2 (`## `) heading. */
export function parseNotebook(nb: NotebookJson): ParsedSection[] {
  const sections: ParsedSection[] = []
  let cur: { heading: string; parts: string[] } | null = null
  const flush = () => {
    if (cur) sections.push({ heading: cur.heading, body: cur.parts.join('\n\n').trim() })
  }

  for (const cell of nb.cells) {
    const text = cellText(cell)
    if (cell.cell_type === 'markdown') {
      let buf: string[] = []
      const pushBuf = () => {
        if (cur && buf.join('\n').trim()) cur.parts.push(buf.join('\n').trim())
        buf = []
      }
      for (const line of text.split('\n')) {
        const h2 = /^##\s+(.+?)\s*$/.exec(line)
        if (h2) {
          pushBuf()
          flush()
          cur = { heading: h2[1].trim(), parts: [] }
          continue
        }
        if (/^#\s+/.test(line)) continue // drop the module/part H1 (title lives on the page)
        buf.push(line)
      }
      pushBuf()
    } else if (cell.cell_type === 'code') {
      const code = text.replace(/\s+$/, '')
      if (cur && code) cur.parts.push('```python\n' + code + '\n```')
    }
  }
  flush()
  return sections
}

/** Parse a notebook and apply the module's overlay to produce normalized Pages. */
export function notebookToPages(nb: NotebookJson, module: NotebookModule): Page[] {
  const parsed = parseNotebook(nb)
  const byHeading = new Map(
    (module.sections ?? []).map((o) => [normHeading(o.heading), o]),
  )

  return parsed.map((s, i) => {
    const o = byHeading.get(normHeading(s.heading))
    const sceneId = o?.scene ?? module.defaultScene ?? ''
    const overrides: SceneOverrides | undefined = o?.highlightNodeIds?.length
      ? { highlightNodeIds: o.highlightNodeIds }
      : undefined
    return {
      id: o?.id ?? slug(s.heading) ?? `section-${i}`,
      sceneId,
      slide: { title: o?.title ?? s.heading.replace(/`/g, ''), body: s.body },
      ...(overrides ? { overrides } : {}),
      ...(o?.audio ? { narration: { audioSrc: o.audio } } : {}),
    }
  })
}
