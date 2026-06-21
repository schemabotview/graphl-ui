import { useEffect, useState } from 'react'
import type { ContentManifest } from '../types'
import { fetchManifest } from './client'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; manifest: ContentManifest }

/** Loads the content manifest once on mount. */
export function useManifest(): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let active = true
    fetchManifest()
      .then((manifest) => active && setState({ status: 'ready', manifest }))
      .catch((err) => active && setState({ status: 'error', error: String(err) }))
    return () => {
      active = false
    }
  }, [])

  return state
}
