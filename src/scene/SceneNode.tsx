import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { NodeKind } from './types'

export interface SceneNodeData {
  label: string
  sub?: string
  /** Resolved hex color. */
  color: string
  kind: NodeKind
  /** For `kind: 'code'`: source language hint (informational; code renders as plain text). */
  lang?: string
  /** Dominant flow direction of the scene, sets handle placement. */
  direction: 'horizontal' | 'vertical'
  /** Stagger order for the entrance animation. */
  index: number
  /** Emphasized by this page's `highlightNodeIds`. */
  highlighted: boolean
  /** Faded because another node on this page is highlighted. */
  dimmed: boolean
  width: number
  height: number
  [key: string]: unknown
}

export function SceneNode({ data }: NodeProps) {
  const d = data as SceneNodeData
  const horizontal = d.direction === 'horizontal'
  const targetPos = horizontal ? Position.Left : Position.Top
  const sourcePos = horizontal ? Position.Right : Position.Bottom

  const className = [
    'scene-node',
    `scene-node--${d.kind}`,
    d.highlighted && 'scene-node--highlight',
    d.dimmed && 'scene-node--dimmed',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      style={{
        width: d.width,
        height: d.height,
        borderColor: d.color,
        ['--node-color' as string]: d.color,
        animationDelay: `${d.index * 0.04}s`,
      }}
    >
      <Handle type="target" position={targetPos} className="scene-handle" isConnectable={false} />
      {d.kind === 'code' ? (
        <>
          <pre className="scene-node__code">
            <code>{d.label}</code>
          </pre>
          {d.sub && <span className="scene-node__sub">{d.sub}</span>}
        </>
      ) : (
        <>
          {d.kind !== 'group' && <span className="scene-node__label">{d.label}</span>}
          {d.kind !== 'group' && d.sub && <span className="scene-node__sub">{d.sub}</span>}
        </>
      )}
      <Handle type="source" position={sourcePos} className="scene-handle" isConnectable={false} />
      {/* Extra id'd side handles for loop/feedback edges and embedded left→right
          rows; the id-less handles above stay the default for normal flow. */}
      <Handle type="source" id="r-source" position={Position.Right} className="scene-handle" isConnectable={false} />
      <Handle type="target" id="r-target" position={Position.Right} className="scene-handle" isConnectable={false} />
      <Handle type="source" id="l-source" position={Position.Left} className="scene-handle" isConnectable={false} />
      <Handle type="target" id="l-target" position={Position.Left} className="scene-handle" isConnectable={false} />
    </div>
  )
}
