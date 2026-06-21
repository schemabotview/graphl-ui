import { useCallback, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useManifest } from '../content/useManifest'
import { PageView } from '../components/PageView'

export function PresentationView() {
  const { presentationId, pageIndex } = useParams()
  const navigate = useNavigate()
  const state = useManifest()

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
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, index])

  if (state.status === 'loading') return <Centered>Loading…</Centered>
  if (state.status === 'error') return <Centered>Error: {state.error}</Centered>
  if (!presentation) return <Centered>Presentation not found.</Centered>

  const page = presentation.pages[index]
  if (!page) return <Centered>Page {index} not found.</Centered>

  const scene = state.manifest.scenes[page.sceneId]
  if (!scene) return <Centered>Scene "{page.sceneId}" not found.</Centered>

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <PageView page={page} scene={scene} />
      </div>
      <footer className="flex items-center justify-between border-t border-[#232323] px-4 py-2 text-sm text-slate-400">
        <Link to="/" className="text-violet-400 hover:underline">
          ← All presentations
        </Link>
        <span className="font-medium text-slate-300">
          {presentation.title}
        </span>
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
