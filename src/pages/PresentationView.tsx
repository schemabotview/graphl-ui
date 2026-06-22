import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useManifest } from '../content/useManifest'
import { PageView } from '../components/PageView'

export function PresentationView() {
  const { presentationId, pageIndex } = useParams()
  const navigate = useNavigate()
  const state = useManifest()
  const [menuOpen, setMenuOpen] = useState(false)

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(index + 1)
      if (e.key === 'ArrowLeft') goTo(index - 1)
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, index])

  // Close the section menu whenever we land on a new page.
  useEffect(() => setMenuOpen(false), [index, presentationId])

  if (state.status === 'loading') return <Centered>Loading…</Centered>
  if (state.status === 'error') return <Centered>Error: {state.error}</Centered>
  if (!presentation) return <Centered>Presentation not found.</Centered>

  const page = presentation.pages[index]
  if (!page) return <Centered>Page {index} not found.</Centered>

  const scene = state.manifest.scenes[page.sceneId]
  if (!scene) return <Centered>Scene "{page.sceneId}" not found.</Centered>

  return (
    <div className="flex h-full flex-col">
      {/* Header: home · module title · jump-to-section menu (mirrors the mobile feed) */}
      <header className="relative flex items-center gap-3 border-b border-[#232323] px-4 py-2">
        <Link to="/" className="shrink-0 text-sm text-violet-400 hover:underline">
          ← Modules
        </Link>
        <span className="min-w-0 flex-1 truncate text-center text-sm font-medium text-slate-300">
          {presentation.title}
        </span>
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-md border border-[#232323] px-3 py-1 text-sm text-slate-300 transition hover:border-violet-500"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          Sections
        </button>

        {menuOpen && (
          <>
            {/* Backdrop closes the menu on an outside click. */}
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <nav
              className="absolute right-4 top-full z-20 mt-1 max-h-[70vh] w-80 overflow-y-auto rounded-lg border border-[#232323] bg-[#0d0d0d] py-1 shadow-xl"
              aria-label={`${presentation.title} sections`}
            >
              <p className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
                {total} sections
              </p>
              <ol>
                {presentation.pages.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-current={i === index}
                      onClick={() => goTo(i)}
                      className={`flex w-full items-baseline gap-3 px-3 py-2 text-left text-sm transition hover:bg-[#1a1a1a] ${
                        i === index ? 'text-violet-300' : 'text-slate-300'
                      }`}
                    >
                      <span className="w-5 shrink-0 tabular-nums text-slate-500">{i + 1}</span>
                      <span className="min-w-0">{p.slide.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </>
        )}
      </header>

      <div className="min-h-0 flex-1">
        <PageView page={page} scene={scene} />
      </div>

      <footer className="flex items-center justify-between border-t border-[#232323] px-4 py-2 text-sm text-slate-400">
        <span className="truncate text-slate-500">{page.slide.title}</span>
        <div className="flex items-center gap-3">
          <button onClick={() => goTo(index - 1)} disabled={index === 0} className="disabled:opacity-30">
            ◀
          </button>
          <span>
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

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-slate-500">{children}</div>
}
