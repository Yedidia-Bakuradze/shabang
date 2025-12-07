import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';

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
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Default cardinality labels
  const sourceCardinality = data?.sourceCardinality || '1';
  const targetCardinality = data?.targetCardinality || 'N';

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {/* Source Cardinality Label */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + (labelX - sourceX) * 0.2}px,${sourceY + (labelY - sourceY) * 0.2}px)`,
            fontSize: 12,
            fontWeight: 'bold',
            pointerEvents: 'all',
          }}
          className="nodrag nopan bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        >
          {sourceCardinality}
        </div>
        
        {/* Target Cardinality Label */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${targetX + (labelX - targetX) * 0.2}px,${targetY + (labelY - targetY) * 0.2}px)`,
            fontSize: 12,
            fontWeight: 'bold',
            pointerEvents: 'all',
          }}
          className="nodrag nopan bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        >
          {targetCardinality}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default ErdEdge;
