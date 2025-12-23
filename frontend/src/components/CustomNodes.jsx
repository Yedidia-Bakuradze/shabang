import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// 1. Attribute Node (Ellipse)
export const AttributeNode = memo(({ data }) => {
  return (
    <div
      style={{
        padding: '10px 20px',
        borderRadius: '50%',
        background: '#f8fafc',
        border: '1px solid #64748b',
        minWidth: '100px',
        textAlign: 'center',
        fontSize: '12px',
        position: 'relative',
        ...data.style, // Allow overriding styles from data
      }}
    >
      {/* Target Handle for connection from Entity */}
      <Handle
        type="target"
        position={Position.Bottom} // Default position, but edges will find the closest handle usually
        style={{ opacity: 0, width: '100%', height: '100%', top: 0, left: 0, borderRadius: '50%' }} 
      />
      
      <span style={{ 
        textDecoration: data.isPrimaryKey ? 'underline' : 'none',
        fontWeight: data.isPrimaryKey ? 'bold' : 'normal'
      }}>
        {data.label}
      </span>
    </div>
  );
});

// 2. Relationship Node (Diamond)
export const RelationshipNode = memo(({ data }) => {
  return (
    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
      {/* The Diamond Shape */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: 'rotate(45deg)',
          background: '#eff6ff',
          border: '2px solid #3b82f6',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
          ...data.style
        }}
      />
      
      {/* The Label (Counter-rotated to stay horizontal) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1,
          pointerEvents: 'none' // Let clicks pass through to the diamond if needed
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#1e40af' }}>
          {data.label}
        </span>
      </div>

      {/* Handles for connections */}
      {/* We place a single handle in the center that acts as both source and target for simplicity in this layout */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0, width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0, width: 10, height: 10 }}
      />
    </div>
  );
});

// 3. Entity Node (Simple Rectangle for Chen Notation)
export const EntityNode = memo(({ data }) => {
  return (
    <div
      style={{
        padding: '10px',
        background: 'white',
        border: '2px solid #333',
        borderRadius: '4px',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: 'bold',
        position: 'relative',
        ...data.style
      }}
    >
      {/* Handles for connections */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ opacity: 0, width: '100%', height: '100%', top: 0, left: 0 }}
      />
      <Handle
        type="target"
        position={Position.Top} // Just a placeholder, the big handle covers it
        id="target-center"
        style={{ opacity: 0, width: '100%', height: '100%', top: 0, left: 0 }}
      />
      
      {data.label}
    </div>
  );
});
