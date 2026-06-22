import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useManifest } from '../content/useManifest'
import { PageView } from '../components/PageView'

/** "apache-spark" -> "Apache Spark" */
const prettyTopic = (t: string) =>
  t.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

type MenuLevel = 'topic' | 'module' | 'section'

export function PresentationView() {
  const { presentationId, pageIndex } = useParams()
  const navigate = useNavigate()
  const state = useManifest()
  const [openMenu, setOpenMenu] = useState<MenuLevel | null>(null)

  const presentation =
    state.status === 'ready'
      ? state.manifest.presentations.find((p) => p.id === presentationId)
      : undefined

  const index = Math.max(0, Number(pageIndex ?? '0') || 0)
  const total = presentation?.pages.length ?? 0

  const goTo = useCallback(
    (i: number) => {
      if (i >= 0 && i < total) navigate(`/p/${presentationId}/${i}`)
    },
    [navigate, presentationId, total],
  )

  const presentations =
    state.status === 'ready' ? state.manifest.presentations : []

  // Sibling sets for the breadcrumb dropups.
  const topics = useMemo(
    () => Array.from(new Set(presentations.map((p) => p.topic))),
    [presentations],
  )
  const modules = useMemo(
    () => presentations.filter((p) => p.topic === presentation?.topic),
    [presentations, presentation?.topic],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(index + 1)
      if (e.key === 'ArrowLeft') goTo(index - 1)
      if (e.key === 'Escape') setOpenMenu(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, index])

  // Close any open dropup when we move to a new page.
  useEffect(() => setOpenMenu(null), [index, presentationId])

  if (state.status === 'loading') return <Centered>Loading…</Centered>
  if (state.status === 'error') return <Centered>Error: {state.error}</Centered>
  if (!presentation) return <Centered>Presentation not found.</Centered>

  const page = presentation.pages[index]
  if (!page) return <Centered>Page {index} not found.</Centered>

  const scene = state.manifest.scenes[page.sceneId]
  if (!scene) return <Centered>Scene "{page.sceneId}" not found.</Centered>

  const firstModuleOf = (topic: string) =>
    presentations.find((p) => p.topic === topic)?.id ?? presentation.id

  const toggle = (level: MenuLevel) =>
    setOpenMenu((cur) => (cur === level ? null : level))

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <PageView page={page} scene={scene} />
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-[#232323] px-4 py-2 text-sm text-slate-400">
        {/* Breadcrumb: Concepts › Topic › Module › Section — each a dropup of siblings */}
        <nav className="flex min-w-0 items-center gap-1.5" aria-label="Breadcrumb">
          <Link to="/" className="shrink-0 text-slate-400 hover:text-violet-400">
            Concepts
          </Link>

          <Sep />
          <Crumb
            label={prettyTopic(presentation.topic)}
            open={openMenu === 'topic'}
            onToggle={() => toggle('topic')}
            onClose={() => setOpenMenu(null)}
            items={topics.map((t) => ({
              id: t,
              label: prettyTopic(t),
              current: t === presentation.topic,
              onPick: () => navigate(`/p/${firstModuleOf(t)}/0`),
            }))}
          />

          <Sep />
          <Crumb
            label={presentation.title}
            open={openMenu === 'module'}
            onToggle={() => toggle('module')}
            onClose={() => setOpenMenu(null)}
            items={modules.map((m) => ({
              id: m.id,
              label: m.title,
              current: m.id === presentation.id,
              onPick: () => navigate(`/p/${m.id}/0`),
            }))}
          />

          <Sep />
          <Crumb
            label={page.slide.title}
            open={openMenu === 'section'}
            onToggle={() => toggle('section')}
            onClose={() => setOpenMenu(null)}
            truncate
            items={presentation.pages.map((p, i) => ({
              id: p.id,
              label: p.slide.title,
              num: i + 1,
              current: i === index,
              onPick: () => goTo(i),
            }))}
          />
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <button onClick={() => goTo(index - 1)} disabled={index === 0} className="disabled:opacity-30">
            ◀
          </button>
          <span className="tabular-nums">
            {index + 1} / {total}
          </span>
          <button onClick={() => goTo(index + 1)} disabled={index >= total - 1} className="disabled:opacity-30">
            ▶
          </button>
        </div>
      </footer>
    </div>
  )
}

interface CrumbItem {
  id: string
  label: string
  num?: number
  current?: boolean
  onPick: () => void
}

/** One breadcrumb segment. Opens a dropup of siblings; a single sibling renders
 *  as plain text (nothing to switch to). */
function Crumb({
  label,
  items,
  open,
  onToggle,
  onClose,
  truncate,
}: {
  label: string
  items: CrumbItem[]
  open: boolean
  onToggle: () => void
  onClose: () => void
  truncate?: boolean
}) {
  if (items.length <= 1) {
    return (
      <span className={`text-slate-300 ${truncate ? 'min-w-0 truncate' : 'shrink-0'}`}>
        {label}
      </span>
    )
  }
  return (
    <span className={`relative ${truncate ? 'min-w-0' : 'shrink-0'}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
        className={`flex max-w-full items-center gap-1 text-slate-300 hover:text-violet-400 ${
          truncate ? 'min-w-0' : ''
        }`}
      >
        <span className={truncate ? 'truncate' : ''}>{label}</span>
        <span className="shrink-0 text-[10px] text-slate-500">▴</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <nav
            className="absolute bottom-full left-0 z-20 mb-1.5 max-h-[70vh] w-80 max-w-[80vw] overflow-y-auto rounded-lg border border-[#232323] bg-[#0d0d0d] py-1 shadow-xl"
            aria-label={`${label} — siblings`}
          >
            <ol>
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    aria-current={it.current}
                    onClick={() => {
                      it.onPick()
                      onClose()
                    }}
                    className={`flex w-full items-baseline gap-2 px-3 py-2 text-left transition hover:bg-[#1a1a1a] ${
                      it.current ? 'text-violet-300' : 'text-slate-300'
                    }`}
                  >
                    {it.num !== undefined && (
                      <span className="w-5 shrink-0 tabular-nums text-slate-500">{it.num}</span>
                    )}
                    <span className="min-w-0">{it.label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </>
      )}
    </span>
  )
}

function Sep() {
  return <span className="shrink-0 text-slate-600">›</span>
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-slate-500">{children}</div>
}
