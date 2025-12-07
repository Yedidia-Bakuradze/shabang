import React from 'react';
import { BaseEdge, getBezierPath, getStraightPath, EdgeLabelRenderer } from 'reactflow';

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
  const isAttributeEdge = data?.edgeType === 'attribute';
  
  // Use straight path for attributes, bezier for relationships
  const [edgePath, labelX, labelY] = isAttributeEdge 
    ? getStraightPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
    : getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  // Attribute edges: simple gray lines, no markers
  // Relationship edges: crow's foot markers with colors
  if (isAttributeEdge) {
    const strokeColor = selected ? '#6b7280' : '#9ca3af';
    const strokeWidth = selected ? 2 : 1.5;

    return (
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
          strokeDasharray: '5,5', // Dashed line for attributes
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
        }}
      />
    );
  }

  // Relationship edges with crow's foot notation
  const markerStartId = getMarkerId(data?.sourceCardinality);
  const markerEndId = getMarkerId(data?.targetCardinality);

  // Tailwind colors: Slate-600 for normal, Blue-500 for selected, Orange-500 for identifying
  const isIdentifying = data?.isIdentifying;
  const strokeColor = selected ? '#3b82f6' : (isIdentifying ? '#f97316' : '#475569');
  const strokeWidth = selected ? 2.5 : (isIdentifying ? 2.5 : 2);

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

      {/* Role Label (for recursive and named relationships) */}
      {data?.role && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: '600',
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            {data.role}
          </div>
        </EdgeLabelRenderer>
      )}

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
          ))}\n        </g>
      )}
    </>
  );
};

export default ErdEdge;
