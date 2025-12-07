import React from 'react';
import {
  BaseEdge,
  getBezierPath,
  getStraightPath,
  EdgeLabelRenderer
} from 'reactflow';

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
  label, // The text label (1, N, 0..1) comes from here
  selected,
}) => {

  const isAttributeEdge = data?.edgeType === 'attribute';

  const [edgePath, labelX, labelY] = isAttributeEdge
    ? getStraightPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
    : getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  /*-------------------------------------------------------------------------
      ATTRIBUTE EDGE (Dashed)
  -------------------------------------------------------------------------*/
  if (isAttributeEdge) {
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        className={
          selected
            ? "stroke-blue-400 stroke-[2.2px]"
            : "stroke-gray-400 dark:stroke-gray-500 stroke-[1.5px]"
        }
        style={{ ...style, strokeDasharray: '5,5' }}
      />
    );
  }

  /*-------------------------------------------------------------------------
      RELATIONSHIP EDGE (Solid Line + Text Label, No Shapes)
  -------------------------------------------------------------------------*/

  const isIdentifying = data?.isIdentifying;

  let edgeColorClass =
    "stroke-gray-600 dark:stroke-gray-300";

  if (isIdentifying)
    edgeColorClass = "stroke-orange-500";
  if (selected)
    edgeColorClass = "stroke-blue-500";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        // Markers removed here to avoid "shapes"
        className={`${edgeColorClass} stroke-[2px] transition-colors duration-300`}
        style={style}
      />

      {/* CARDINALITY LABEL (1, N, etc) - Rendered as a badge */}
      {label && (
        <EdgeLabelRenderer>
          <div
            className={`
                nodrag nopan
                px-2 py-0.5 text-xs font-bold
                rounded-full shadow-sm
                border transition-transform
                ${selected
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700'
                : 'bg-white text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600'
              }
            `}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 10
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* ROLE LABEL (Works For, etc) */}
      {data?.role && (
        <EdgeLabelRenderer>
          <div
            className="
                nodrag nopan
                px-2 py-1 text-[10px] font-medium uppercase tracking-wider
                bg-gray-50 dark:bg-gray-900
                text-gray-500 dark:text-gray-400
                rounded
            "
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 24}px)`,
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