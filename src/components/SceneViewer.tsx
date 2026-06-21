/**
 * Renders a reusable Scene as a React Flow canvas, applying per-page overrides
 * (highlights, visibility, viewport) without mutating the shared Scene.
 */
import { useMemo } from 'react'
import { Background, ReactFlow, type Edge, type Node } from '@xyflow/react'
import type { Scene, SceneOverrides } from '../types'

interface SceneViewerProps {
  scene: Scene
  overrides?: SceneOverrides
}

export function SceneViewer({ scene, overrides }: SceneViewerProps) {
  const nodes = useMemo<Node[]>(() => {
    const highlight = new Set(overrides?.highlightNodeIds ?? [])
    const visible = overrides?.visibleNodeIds ? new Set(overrides.visibleNodeIds) : null
    return scene.nodes
      .filter((n) => !visible || visible.has(n.id))
      .map((n) => ({
        ...n,
        className: highlight.has(n.id) ? 'scene-node--highlight' : undefined,
      }))
  }, [scene.nodes, overrides])

  const edges = useMemo<Edge[]>(() => {
    const highlight = new Set(overrides?.highlightEdgeIds ?? [])
    const visible = overrides?.visibleNodeIds ? new Set(overrides.visibleNodeIds) : null
    return scene.edges
      .filter((e) => !visible || (visible.has(e.source) && visible.has(e.target)))
      .map((e) => ({ ...e, animated: highlight.has(e.id) || e.animated }))
  }, [scene.edges, overrides])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      defaultViewport={overrides?.viewport ?? scene.defaultViewport}
      fitView={!overrides?.viewport && !scene.defaultViewport}
      proOptions={{ hideAttribution: true }}
    >
      <Background />
    </ReactFlow>
  )
}
