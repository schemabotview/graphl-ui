import { Link } from 'react-router-dom'
import { useManifest } from '../content/useManifest'

export function HomePage() {
  const state = useManifest()

  return (
    <div className="mx-auto max-w-3xl p-10">
      <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">
        graphl-ui
      </h1>
      <p className="mb-8 text-slate-500">Interactive presentations for technical concepts.</p>

      {state.status === 'loading' && <p>Loading content…</p>}
      {state.status === 'error' && (
        <p className="text-red-600">Could not load content: {state.error}</p>
      )}
      {state.status === 'ready' && (
        <ul className="space-y-3">
          {state.manifest.presentations.map((p) => (
            <li key={p.id}>
              <Link
                to={`/p/${p.id}`}
                className="block rounded-lg border border-slate-200 p-4 transition hover:border-violet-400 hover:shadow dark:border-slate-700"
              >
                <span className="text-xs uppercase tracking-wide text-violet-500">
                  {p.topic}
                </span>
                <span className="block text-lg font-medium text-slate-900 dark:text-slate-100">
                  {p.title}
                </span>
                <span className="text-sm text-slate-500">{p.pages.length} pages</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
