/**
 * Loads presentation content from a content repo (e.g. apache-spark-ct) served
 * as static files. The base URL is configurable so the UI repo stays fully
 * decoupled from any single content repo.
 *
 *   dev  -> VITE_CONTENT_BASE_URL=http://localhost:5174  (content repo served statically)
 *   prod -> VITE_CONTENT_BASE_URL=https://content.example.com/apache-spark-ct
 *
 * A content repo is expected to expose `<base>/manifest.json` shaped as
 * `ContentManifest`. Audio paths inside the content are resolved relative to the
 * same base via `resolveAsset`.
 */
import type { ContentManifest, Presentation, Scene } from '../types'

const BASE = (import.meta.env.VITE_CONTENT_BASE_URL ?? '/content').replace(/\/$/, '')

/**
 * The on-disk manifest. `scenes` is either a list of scene ids (each loaded from
 * `scenes/<id>.json` — the declarative-data layout) or an inline `id -> Scene`
 * map (legacy). Either way the loader resolves it to `ContentManifest.scenes`.
 */
interface RawManifest {
  scenes: string[] | Record<string, Scene>
  presentations: Presentation[]
}

/** Resolve a content-relative asset path (e.g. audio) to a full URL. */
export function resolveAsset(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${BASE}/${path.replace(/^\//, '')}`
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  if (!res.ok) {
    throw new Error(`Failed to load ${path} from ${BASE} (${res.status})`)
  }
  return (await res.json()) as T
}

export async function fetchManifest(): Promise<ContentManifest> {
  const raw = await fetchJson<RawManifest>('manifest.json')

  // Per-scene files: fetch scenes/<id>.json for each id. Inline map: use as-is.
  let scenes: Record<string, Scene>
  if (Array.isArray(raw.scenes)) {
    const specs = await Promise.all(
      raw.scenes.map((id) => fetchJson<Scene>(`scenes/${id}.json`)),
    )
    scenes = Object.fromEntries(specs.map((s) => [s.id, s]))
  } else {
    scenes = raw.scenes
  }

  return { scenes, presentations: raw.presentations }
}
