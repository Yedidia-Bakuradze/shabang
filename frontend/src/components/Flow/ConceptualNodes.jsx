import React, { useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '../../store/useFlowStore';

// Entity Node - StitchAI Style with Glassmorphism
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
      data-testid="entity-node"
      className={`
        group relative
        rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        ${isWeak ? 'ring-2 ring-blue-400/50 ring-offset-2 ring-offset-transparent' : ''}
        ${selected 
          ? 'scale-105 shadow-[0_0_30px_rgba(59,130,246,0.5)]' 
          : 'hover:scale-102 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
        }
      `}
      style={{ minWidth: '120px', maxWidth: '150px' }}
    >
      {/* Glassmorphism Container */}
      <div className="
        backdrop-blur-xl 
        bg-white/10 dark:bg-slate-900/40
        border border-white/20 dark:border-slate-700/50
        rounded-xl
        shadow-xl
      ">
        {/* Header: Blue Gradient with Glow */}
        <div className="
          relative
          bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500
          px-4 py-3
          rounded-t-xl
        ">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
          
          <input
            type="text"
            value={data.label || 'Entity'}
            onChange={handleLabelChange}
            data-testid="entity-label"
            className="
              nodrag relative z-10
              w-full bg-transparent 
              text-white font-semibold text-sm text-center 
              outline-none 
              focus:bg-white/10 
              px-2 py-1 rounded-lg 
              transition-all duration-200
              placeholder:text-white/60
            "
            placeholder="Entity Name"
          />
          
          {/* Attribute count badge */}
          {attributes.length > 0 && (
            <div className="flex justify-center mt-1.5 relative z-10">
              <span className="
                text-[10px] font-medium
                text-white/90
                bg-white/20 backdrop-blur-sm
                px-2 py-0.5 rounded-full
                border border-white/30
              ">
                {attributes.length} attr
              </span>
            </div>
          )}
          
          {isWeak && (
            <div className="text-center text-[10px] text-white/80 mt-1 font-medium relative z-10">
              ◇ Weak Entity
            </div>
          )}
        </div>
      </div>

      {/* --- HANDLES - Styled to match StitchAI --- */}

      {/* Top Handle - For Relationships */}
      <Handle
        type="target"
        position={Position.Top}
        id="handle-top"
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white/80 !shadow-lg !shadow-cyan-400/50 !-top-1.5 hover:!scale-125 transition-transform"
      />

      {/* Left Handle - For Relationships */}
      <Handle
        type="target"
        position={Position.Left}
        id="handle-left"
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white/80 !shadow-lg !shadow-cyan-400/50 !-left-1.5 hover:!scale-125 transition-transform"
      />

      {/* Right Handle - For Relationships */}
      <Handle
        type="source"
        position={Position.Right}
        id="handle-right"
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white/80 !shadow-lg !shadow-cyan-400/50 !-right-1.5 hover:!scale-125 transition-transform"
      />

      {/* Bottom Handle - ONLY for Attributes (Green/Emerald) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="handle-attributes"
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-white/80 !shadow-lg !shadow-emerald-400/50 !-bottom-1.5 hover:!scale-125 transition-transform"
      />

      {/* Dynamic Extra Handles for many relationships */}
      {needsExtraHandles && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="handle-top-left"
            className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-white/80 !-top-1 hover:!scale-125 transition-transform"
            style={{ left: '25%' }}
          />
          <Handle
            type="source"
            position={Position.Top}
            id="handle-top-right"
            className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-white/80 !-top-1 hover:!scale-125 transition-transform"
            style={{ left: '75%' }}
          />
        </>
      )}
    </div>
  );
};

// Attribute Node - StitchAI Style Ellipse with Glassmorphism
export const AttributeNode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div className="relative group">
      {/* Glassmorphism Ellipse */}
      <div className={`
        relative
        backdrop-blur-xl
        bg-gradient-to-br from-violet-500/90 via-purple-500/90 to-fuchsia-500/90
        rounded-full 
        shadow-xl
        border border-white/30
        px-4 py-2 
        min-w-[80px] max-w-[100px] 
        flex items-center justify-center
        transition-all duration-300
        ${selected 
          ? 'scale-110 shadow-[0_0_25px_rgba(168,85,247,0.6)]' 
          : 'hover:scale-105 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
        }
      `}>
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
        
        <input
          type="text"
          value={data.label || 'Attribute'}
          onChange={handleLabelChange}
          className={`
            nodrag relative z-10
            w-full bg-transparent 
            text-white font-medium text-[11px] text-center 
            outline-none 
            focus:bg-white/10 
            px-1 py-0.5 rounded-full 
            transition-colors
            ${data.isKey ? 'underline decoration-2 underline-offset-2 font-bold' : ''}
          `}
          placeholder="Attr"
        />
      </div>

      {/* Key indicator */}
      {data.isKey && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border border-white/50">
          <span className="text-[8px]">🔑</span>
        </div>
      )}

      {/* --- HANDLES with glow effect --- */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-violet-300 !border-2 !border-white/80 !shadow-lg !shadow-violet-400/50 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-violet-300 !border-2 !border-white/80 !shadow-lg !shadow-violet-400/50 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-violet-300 !border-2 !border-white/80 !shadow-lg !shadow-violet-400/50 hover:!scale-125 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-violet-300 !border-2 !border-white/80 !shadow-lg !shadow-violet-400/50 hover:!scale-125 transition-transform"
      />
    </div>
  );
};

// Relationship Node - StitchAI Style Diamond with Glassmorphism
export const RelationshipNode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  const isIdentifying = data.isIdentifying || false;

  return (
    <div 
      className={`
        relative group
        transition-all duration-300
        ${selected ? 'scale-110' : 'hover:scale-105'}
      `} 
      style={{ width: '85px', height: '85px' }}
    >
      {/* Diamond Shape with Glassmorphism */}
      <div
        className={`
          absolute inset-0 
          backdrop-blur-xl
          bg-gradient-to-br from-orange-400/90 via-amber-500/90 to-yellow-500/90
          shadow-xl
          border border-white/30
          ${isIdentifying ? 'ring-2 ring-orange-300/50 ring-offset-2 ring-offset-transparent' : ''}
          ${selected 
            ? 'shadow-[0_0_30px_rgba(251,146,60,0.6)]' 
            : 'hover:shadow-[0_0_20px_rgba(251,146,60,0.4)]'
          }
          flex items-center justify-center
        `}
        style={{
          transform: 'rotate(45deg)',
          transformOrigin: 'center',
          borderRadius: '12px',
          zIndex: 0
        }}
      >
        {/* Inner glow */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-transparent to-white/25" 
          style={{ borderRadius: '12px' }}
        />
        
        {/* Text container with reverse rotation */}
        <div
          style={{
            transform: 'rotate(-45deg)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px'
          }}
        >
          <input
            type="text"
            value={data.label || 'Rel'}
            onChange={handleLabelChange}
            className="
              nodrag relative z-10
              w-full bg-transparent 
              text-white font-semibold text-[11px] text-center 
              outline-none 
              focus:bg-white/10 
              px-1 py-0.5 rounded 
              transition-colors
            "
            placeholder="Rel"
          />
        </div>
      </div>

      {/* --- HANDLES with glow effect --- */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-amber-300 !border-2 !border-white/80 !shadow-lg !shadow-amber-400/50 hover:!scale-125 transition-transform"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-amber-300 !border-2 !border-white/80 !shadow-lg !shadow-amber-400/50 hover:!scale-125 transition-transform"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-300 !border-2 !border-white/80 !shadow-lg !shadow-amber-400/50 hover:!scale-125 transition-transform"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-300 !border-2 !border-white/80 !shadow-lg !shadow-amber-400/50 hover:!scale-125 transition-transform"
        style={{ zIndex: 10 }}
      />
    </div>
  );
};

// ISA Node - StitchAI Style Triangle with Glassmorphism
export const IsANode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div 
      className={`
        relative group
        transition-all duration-300
        ${selected ? 'scale-110' : 'hover:scale-105'}
      `} 
      style={{ width: '75px', height: '75px' }}
    >
      {/* Triangle Shape with Glassmorphism */}
      <div
        className={`
          absolute inset-0 
          backdrop-blur-xl
          bg-gradient-to-br from-emerald-400/90 via-green-500/90 to-teal-500/90
          shadow-xl
          border border-white/30
          ${selected 
            ? 'shadow-[0_0_25px_rgba(16,185,129,0.6)]' 
            : 'hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'
          }
          flex items-center justify-center
        `}
        style={{
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          zIndex: 0
        }}
      >
        {/* Inner glow */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" 
          style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
        />
        
        <div className="mt-6 relative z-10">
          <input
            type="text"
            value={data.label || 'ISA'}
            onChange={handleLabelChange}
            className="
              nodrag 
              w-14 bg-transparent 
              text-white font-bold text-[11px] text-center 
              outline-none 
              focus:bg-white/10 
              px-1 py-0.5 rounded 
              transition-colors
            "
            placeholder="ISA"
          />
        </div>
      </div>

      {/* --- HANDLES with glow effect --- */}

      {/* Top (Superclass connection) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-300 !border-2 !border-white/80 !shadow-lg !shadow-emerald-400/50 hover:!scale-125 transition-transform"
        style={{ zIndex: 10 }}
      />

      {/* Subclass Left */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="subclass-left"
        className="!w-2.5 !h-2.5 !bg-emerald-300 !border-2 !border-white/80 !shadow-lg !shadow-emerald-400/50 hover:!scale-125 transition-transform"
        style={{ left: '30%', zIndex: 10 }}
      />

      {/* Subclass Right */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="subclass-right"
        className="!w-2.5 !h-2.5 !bg-emerald-300 !border-2 !border-white/80 !shadow-lg !shadow-emerald-400/50 hover:!scale-125 transition-transform"
        style={{ left: '70%', zIndex: 10 }}
      />

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-emerald-300 !border-2 !border-white/80 !shadow-lg !shadow-emerald-400/50 hover:!scale-125 transition-transform"
        style={{ zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-emerald-300 !border-2 !border-white/80 !shadow-lg !shadow-emerald-400/50 hover:!scale-125 transition-transform"
        style={{ zIndex: 10 }}
      />
    </div>
  );
};

export default { EntityNode, AttributeNode, RelationshipNode, IsANode };