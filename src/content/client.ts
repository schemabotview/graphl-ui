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
import type { ContentManifest } from '../types'

const BASE = (import.meta.env.VITE_CONTENT_BASE_URL ?? '/content').replace(/\/$/, '')

/** Resolve a content-relative asset path (e.g. audio) to a full URL. */
export function resolveAsset(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${BASE}/${path.replace(/^\//, '')}`
}

export async function fetchManifest(): Promise<ContentManifest> {
  const res = await fetch(`${BASE}/manifest.json`)
  if (!res.ok) {
    throw new Error(`Failed to load content manifest from ${BASE} (${res.status})`)
  }
  return (await res.json()) as ContentManifest
}
