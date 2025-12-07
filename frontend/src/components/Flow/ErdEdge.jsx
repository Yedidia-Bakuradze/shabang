import React from 'react';
import {
  BaseEdge,
  getBezierPath,
  getStraightPath,
  EdgeLabelRenderer
} from 'reactflow';

// Map cardinalities to marker IDs
const getMarkerId = (c) => {
  switch (c) {
    case 'MANY': return 'url(#marker-many)';
    case 'ONE': return 'url(#marker-one)';
    case 'ZERO_ONE': return 'url(#marker-zero-one)';
    case 'ZERO_MANY': return 'url(#marker-zero-many)';
    default: return 'url(#marker-one)';
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

  const [edgePath, labelX, labelY] = isAttributeEdge
    ? getStraightPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
    : getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  /*-------------------------------------------------------------------------
      ATTRIBUTE EDGE (Dashed, still high visibility)
  -------------------------------------------------------------------------*/
  if (isAttributeEdge) {
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        className={
          selected
            ? "stroke-blue-400 stroke-[2.2px]"
            : "stroke-gray-500 dark:stroke-gray-300 stroke-[1.8px]"
        }
        style={{ ...style, strokeDasharray: '5,5' }}
      />
    );
  }

  /*-------------------------------------------------------------------------
      RELATIONSHIP EDGE (Thick + bright in dark mode)
  -------------------------------------------------------------------------*/
  const markerStartId = getMarkerId(data?.sourceCardinality);
  const markerEndId = getMarkerId(data?.targetCardinality);

  const isIdentifying = data?.isIdentifying;

  let edgeColorClass =
    "stroke-gray-500 dark:stroke-gray-200 text-gray-600 dark:text-gray-200";

  if (isIdentifying)
    edgeColorClass = "stroke-orange-500 text-orange-500";
  if (selected)
    edgeColorClass = "stroke-blue-500 text-blue-500";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerStartId}
        markerEnd={markerEndId}
        className={`${edgeColorClass} stroke-[3px] transition-colors duration-300`}
        style={style}
      />

      {/* EDGE LABEL */}
      {data?.role && (
        <EdgeLabelRenderer>
          <div
            className="
                nodrag nopan
                px-2 py-1 text-xs font-semibold
                bg-white dark:bg-gray-900
                text-gray-700 dark:text-gray-200
                border border-gray-300 dark:border-gray-700
                rounded shadow-sm
            "
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all'
            }}
          >
            {data.role}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default ErdEdge;
