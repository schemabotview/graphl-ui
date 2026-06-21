import { BaseEdge, getBezierPath, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { GRAY } from './colors'

// A "flow in path" edge: a faint base bezier plus a dot that travels along it
// via SVG <animateMotion>, giving the sense of records/data moving through the
// graph. Set edge data.animated = false to draw a static line.
//
// Loop/feedback edges enter and leave on the SAME side (both nodes' right
// handles, see SceneNode); for those we use an orthogonal step path that hugs
// the side instead of a bezier that would cut back through the boxes.
export function FlowEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd } = props
  const geo = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }
  const [path] =
    sourcePosition === targetPosition
      ? getSmoothStepPath({ ...geo, borderRadius: 14, offset: 64 })
      : getBezierPath(geo)

  const color = (data?.color as string) ?? GRAY
  const animated = data?.animated !== false
  const highlighted = data?.highlighted === true

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{ stroke: color, strokeWidth: highlighted ? 3 : 2, opacity: highlighted ? 0.9 : 0.45 }}
      />
      {animated && (
        <circle r={4} fill={color}>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </>
  )
}
