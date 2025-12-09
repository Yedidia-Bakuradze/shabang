import React, { useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '../../store/useFlowStore';

// Entity Node - Minimalist Title Card (Header Only)
// Attributes are shown ONLY in the Sidebar, not on the canvas
export const EntityNode = ({ id, data, selected }) => {
  const { updateNodeLabel, edges } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  const isWeak = data.isWeak || false;
  const attributes = data.attributes || [];
  
  // Count relationships connected to this entity (for dynamic handles)
  const relationshipCount = useMemo(() => {
    return edges.filter(e => 
      (e.source === id || e.target === id) && 
      e.data?.edgeType === 'relationship'
    ).length;
  }, [edges, id]);

  // Determine if we need extra handles (more than 3 relationships)
  const needsExtraHandles = relationshipCount > 3;

  return (
    <div 
      className={`
        rounded-lg shadow-md overflow-hidden transition-all duration-200
        ${isWeak ? 'border-double border-4' : 'border-2'}
        ${selected 
          ? 'border-blue-400 shadow-blue-500/30 shadow-lg ring-2 ring-blue-400/50' 
          : 'border-blue-600/50 hover:border-blue-500'
        }
      `}
      style={{ minWidth: '100px', maxWidth: '120px' }}
    >
      {/* Header: Entity Name - This is the ONLY visible part */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2">
        <input
          type="text"
          value={data.label || 'Entity'}
          onChange={handleLabelChange}
          className="nodrag w-full bg-transparent text-white font-bold text-xs text-center outline-none focus:bg-white/10 px-1 py-0.5 rounded transition-colors placeholder:text-blue-200"
          placeholder="Entity Name"
        />
        
        {/* Attribute count badge (optional visual indicator) */}
        {attributes.length > 0 && (
          <div className="flex justify-center mt-0.5">
            <span className="text-[10px] text-blue-200 bg-blue-800/50 px-1.5 py-0.5 rounded-full">
              {attributes.length} attr
            </span>
          </div>
        )}
        
        {isWeak && (
          <div className="text-center text-xs text-blue-200 mt-1 font-medium">
            Weak Entity
          </div>
        )}
      </div>

      {/* --- HANDLES - Positioned at the edges/frame --- */}

      {/* Top Handle - For Relationships */}
      <Handle
        type="target"
        position={Position.Top}
        id="handle-top"
        className="!bg-blue-400 !w-3 !h-3 !border-2 !border-white !-top-1.5"
      />

      {/* Left Handle - For Relationships */}
      <Handle
        type="target"
        position={Position.Left}
        id="handle-left"
        className="!bg-blue-400 !w-3 !h-3 !border-2 !border-white !-left-1.5"
      />

      {/* Right Handle - For Relationships */}
      <Handle
        type="source"
        position={Position.Right}
        id="handle-right"
        className="!bg-blue-400 !w-3 !h-3 !border-2 !border-white !-right-1.5"
      />

      {/* Bottom Handle - ONLY for Attributes (Green) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="handle-attributes"
        className="!bg-green-400 !w-3 !h-3 !border-2 !border-white !-bottom-1.5"
      />

      {/* Dynamic Extra Handles for many relationships */}
      {needsExtraHandles && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="handle-top-left"
            className="!bg-blue-400 !w-2.5 !h-2.5 !border-2 !border-white !-top-1"
            style={{ left: '25%' }}
          />
          <Handle
            type="source"
            position={Position.Top}
            id="handle-top-right"
            className="!bg-blue-400 !w-2.5 !h-2.5 !border-2 !border-white !-top-1"
            style={{ left: '75%' }}
          />
        </>
      )}
    </div>
  );
};

// Attribute Node - Ellipse/Oval
export const AttributeNode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div className="relative">

      <div className={`bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-md border-2 ${selected ? 'border-purple-300' : 'border-purple-700'
        } px-3 py-1.5 min-w-[70px] max-w-[90px] flex items-center justify-center`}>
        <input
          type="text"
          value={data.label || 'Attribute'}
          onChange={handleLabelChange}
          className={`nodrag w-full bg-transparent text-white font-medium text-[10px] text-center outline-none focus:bg-purple-700 focus:bg-opacity-30 px-1 py-0.5 rounded transition-colors ${data.isKey ? 'underline decoration-2 underline-offset-2' : ''
            }`}
          placeholder="Attr"
        />
      </div>

      {/* --- HANDLES --- */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-300 !w-3 !h-3 !border-2 !border-purple-700"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-purple-300 !w-3 !h-3 !border-2 !border-purple-700"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-300 !w-3 !h-3 !border-2 !border-purple-700"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-300 !w-3 !h-3 !border-2 !border-purple-700"
      />
    </div>
  );
};

// Relationship Node - Diamond
export const RelationshipNode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  const isIdentifying = data.isIdentifying || false;

  return (
    <div className="relative" style={{ width: '80px', height: '80px' }}>

      {/* Diamond Shape Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 shadow-md ${isIdentifying ? 'border-double border-4' : 'border-2'
          } ${selected ? 'border-orange-300' : 'border-orange-700'
          } flex items-center justify-center`}
        style={{
          transform: 'rotate(45deg)',
          transformOrigin: 'center',
          zIndex: 0 // Ensure background is behind handles
        }}
      >
        {/* Text container with reverse rotation */}
        <div
          style={{
            transform: 'rotate(-45deg)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px'
          }}
        >
          <input
            type="text"
            value={data.label || 'Rel'}
            onChange={handleLabelChange}
            className="nodrag w-full bg-transparent text-white font-medium text-[10px] text-center outline-none focus:bg-orange-700 focus:bg-opacity-30 px-1 py-0.5 rounded transition-colors"
            placeholder="Rel"
          />
        </div>
      </div>

      {/* --- HANDLES (Placed after the diamond div to ensure visibility) --- */}

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
        style={{ zIndex: 10 }}
      />

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
        style={{ zIndex: 10 }}
      />

      <Handle
        type="target"
        position={Position.Top}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
        style={{ zIndex: 10 }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
        style={{ zIndex: 10 }}
      />
    </div>
  );
};

// ISA Node - Triangle for Inheritance Hierarchies
export const IsANode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div className="relative" style={{ width: '70px', height: '70px' }}>

      {/* Triangle Shape using clip-path */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 shadow-md border-2 ${selected ? 'border-green-300' : 'border-green-700'
          } flex items-center justify-center`}
        style={{
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          zIndex: 0
        }}
      >
        <div className="mt-5">
          <input
            type="text"
            value={data.label || 'ISA'}
            onChange={handleLabelChange}
            className="nodrag w-12 bg-transparent text-white font-semibold text-[10px] text-center outline-none focus:bg-green-700 focus:bg-opacity-30 px-1 py-0.5 rounded transition-colors"
            placeholder="ISA"
          />
        </div>
      </div>

      {/* --- HANDLES --- */}

      {/* Top (Superclass connection) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
        style={{ zIndex: 10 }}
      />

      {/* Subclass Left */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="subclass-left"
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
        style={{ left: '30%', zIndex: 10 }}
      />

      {/* Subclass Right */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="subclass-right"
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
        style={{ left: '70%', zIndex: 10 }}
      />

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
        style={{ zIndex: 10 }}
      />
    </div>
  );
};

export default { EntityNode, AttributeNode, RelationshipNode, IsANode };