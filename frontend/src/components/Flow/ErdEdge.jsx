import React from 'react';
import { BaseEdge, getBezierPath } from 'reactflow';

// Helper to map cardinality data to marker IDs defined in EditorCanvas
const getMarkerId = (cardinality) => {
  switch (cardinality) {
    case 'MANY': return 'url(#marker-many)';
    case 'ONE': return 'url(#marker-one)';
    case 'ZERO_ONE': return 'url(#marker-zero-one)';
    case 'ZERO_MANY': return 'url(#marker-zero-many)';
    default: return 'url(#marker-one)'; // Default fallback
  }
};

const ErdEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const markerStartId = getMarkerId(data?.sourceCardinality);
  const markerEndId = getMarkerId(data?.targetCardinality);

  // Tailwind colors: Slate-400 for normal, Blue-500 for selected
  const strokeColor = selected ? '#3b82f6' : '#94a3b8';
  const strokeWidth = selected ? 2 : 1.5;

  return (
    <>
      {/* The main edge line */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerStartId}
        markerEnd={markerEndId}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
          color: strokeColor, // Markers inherit this color
        }}
      />

      {/* Particle Animation (Only visible when selected) */}
      {selected && (
        <g>
          {[0, 1, 2].map((i) => (
            <circle key={i} r="3" fill="url(#edge-gradient)">
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                begin={`-${i * 0.7}s`} // Stagger the particles
                path={edgePath}
              />
            </circle>
          ))}
        </g>
      )}
    </>
  );
};

export default ErdEdge;
