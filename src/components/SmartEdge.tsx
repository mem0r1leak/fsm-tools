import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

export const SmartEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
}: EdgeProps) => {
  const { index = 0, hasReverse = false, isSelfLoop = false, hasMultiple = false } = (data as any) || {};

  // 1. Handle Self Loops
  if (isSelfLoop) {
    const x = sourceX;
    const y = sourceY;
    const radius = 35 + index * 15;
    
    let path = '';
    let labelPos = { x, y };

    // Adjust loop direction based on handle position
    switch (sourcePosition) {
      case 'top':
        path = `M ${x} ${y} C ${x - radius} ${y - radius * 2} ${x + radius} ${y - radius * 2} ${x} ${y}`;
        labelPos = { x, y: y - radius * 1.5 };
        break;
      case 'bottom':
        path = `M ${x} ${y} C ${x - radius} ${y + radius * 2} ${x + radius} ${y + radius * 2} ${x} ${y}`;
        labelPos = { x, y: y + radius * 1.5 };
        break;
      case 'left':
        path = `M ${x} ${y} C ${x - radius * 2} ${y - radius} ${x - radius * 2} ${y + radius} ${x} ${y}`;
        labelPos = { x: x - radius * 1.5, y };
        break;
      case 'right':
        path = `M ${x} ${y} C ${x + radius * 2} ${y - radius} ${x + radius * 2} ${y + radius} ${x} ${y}`;
        labelPos = { x: x + radius * 1.5, y };
        break;
      default:
        path = `M ${x} ${y} C ${x - radius} ${y - radius * 2} ${x + radius} ${y - radius * 2} ${x} ${y}`;
        labelPos = { x, y: y - radius * 1.5 };
    }
    
    return (
      <>
        <BaseEdge path={path} markerEnd={markerEnd} style={style} />
        {label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelPos.x}px,${labelPos.y}px)`,
                fontSize: 11,
                fontWeight: 700,
                pointerEvents: 'all',
              }}
              className="nodrag nopan bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-zinc-200 text-zinc-800 shadow-sm"
            >
              {label}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }

  // 2. Handle Curved Edges (Multiple edges or Reverse edges)
  if (index > 0 || hasReverse || hasMultiple) {
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    // Normal vector
    const nx = -dy / len;
    const ny = dx / len;
    
    // Curvature amount
    // We use a base offset and then add for each additional edge
    const baseOffset = 30;
    const stepOffset = 25;
    
    // If it's the first edge (index 0) but has a reverse, we curve it.
    // We'll use a positive offset for index 0, 1, 2...
    // The reverse edge will also have its own index 0, 1, 2... and will curve in its own 'right-hand' direction
    // which effectively curves it away from the first edge.
    const offset = baseOffset + index * stepOffset;
    
    const cx = midX + nx * offset;
    const cy = midY + ny * offset;
    
    const path = `M ${sourceX} ${sourceY} Q ${cx} ${cy} ${targetX} ${targetY}`;
    
    return (
      <>
        <BaseEdge path={path} markerEnd={markerEnd} style={style} />
        {label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${cx}px,${cy}px)`,
                fontSize: 11,
                fontWeight: 700,
                pointerEvents: 'all',
              }}
              className="nodrag nopan bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-zinc-200 text-zinc-800 shadow-sm"
            >
              {label}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }

  // 3. Default Bezier Path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: 700,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-zinc-200 text-zinc-800 shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
