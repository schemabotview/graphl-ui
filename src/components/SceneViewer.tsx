/**
 * Renders a reusable Scene by running the layout algorithm (scene/grid.ts) over
 * its declarative SceneSpec — resolving grid cells -> pixel boxes — then drawing
 * the result with the custom neon node/edge types. Per-page overrides
 * (highlights, visibility, viewport) are applied without mutating the Scene.
 */
import { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import type { Scene, SceneOverrides } from '../types'
import type { SceneNodeSpec } from '../scene/types'
import { resolveGrid } from '../scene/grid'
import { resolveColor } from '../scene/colors'
import { SceneNode, type SceneNodeData } from '../scene/SceneNode'
import { FlowEdge } from '../scene/FlowEdge'
import '../scene/scene.css'

const nodeTypes = { scene: SceneNode }
const edgeTypes = { flow: FlowEdge }

// Virtual canvas; React Flow's fitView scales it to the real panel.
const CANVAS = { width: 800, height: 1200 }

interface SceneViewerProps {
  scene: Scene
  overrides?: SceneOverrides
}

/** Flatten the scene tree, parent before each of its children (depth-first). */
function flattenNodes(nodes: SceneNodeSpec[]): SceneNodeSpec[] {
  const out: SceneNodeSpec[] = []
  for (const n of nodes) {
    out.push(n)
    if (n.children?.length) out.push(...flattenNodes(n.children))
  }
  return out
}

export function SceneViewer({ scene, overrides }: SceneViewerProps) {
  const direction = scene.grid.cols > scene.grid.rows ? 'horizontal' : 'vertical'

  const nodes = useMemo<Node<SceneNodeData>[]>(() => {
    const highlight = new Set(overrides?.highlightNodeIds ?? [])
    const hasHighlight = highlight.size > 0
    const visible = overrides?.visibleNodeIds ? new Set(overrides.visibleNodeIds) : null
    const boxes = resolveGrid(scene.nodes, scene.grid, CANVAS)
    // Depth-first, parent before child: React Flow paints in array order, so
    // containers land behind the children resolved inside them.
    return flattenNodes(scene.nodes)
      .filter((n) => !visible || visible.has(n.id))
      .map((n, i) => {
        const box = boxes[n.id]
        return {
          id: n.id,
          type: 'scene',
          position: { x: box.x, y: box.y },
          draggable: false,
          selectable: false,
          data: {
            label: n.label,
            sub: n.sub,
            color: resolveColor(n.color),
            kind: n.kind ?? 'symbol',
            lang: n.lang,
            direction,
            index: i,
            highlighted: highlight.has(n.id),
            dimmed: hasHighlight && !highlight.has(n.id),
            width: box.w,
            height: box.h,
          },
        }
      })
  }, [scene, direction, overrides])

  const edges = useMemo<Edge[]>(() => {
    const highlight = new Set(overrides?.highlightEdgeIds ?? [])
    const visible = overrides?.visibleNodeIds ? new Set(overrides.visibleNodeIds) : null
    return scene.edges
      .filter((e) => !visible || (visible.has(e.from) && visible.has(e.to)))
      .map((e) => {
        const id = `${e.from}-${e.to}`
        const color = resolveColor(e.color)
        return {
          id,
          source: e.from,
          target: e.to,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          type: 'flow',
          label: e.label,
          data: { color, animated: e.animated, highlighted: highlight.has(id) },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        }
      })
  }, [scene, overrides])

  return (
    <div className="scene-viewer">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={overrides?.viewport ?? scene.defaultViewport}
        fitView={!overrides?.viewport && !scene.defaultViewport}
        fitViewOptions={{ padding: 0.12 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="#1b1d29" />
      </ReactFlow>
    </div>
  )
}
