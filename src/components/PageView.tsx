/**
 * A single page: the screen split into two parts — the React Flow Scene (left)
 * and the Slide panel (right). See CLAUDE.md.
 */
import { ReactFlowProvider } from '@xyflow/react'
import type { Page, Scene } from '../types'
import { SceneViewer } from './SceneViewer'
import { SlidePanel } from './SlidePanel'

interface PageViewProps {
  page: Page
  scene: Scene
}

export function PageView({ page, scene }: PageViewProps) {
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[3fr_2fr]">
      <div className="h-full min-h-0 border-b border-slate-200 md:border-b-0 md:border-r dark:border-slate-700">
        <ReactFlowProvider>
          <SceneViewer scene={scene} overrides={page.overrides} />
        </ReactFlowProvider>
      </div>
      <SlidePanel slide={page.slide} narration={page.narration} />
    </div>
  )
}
