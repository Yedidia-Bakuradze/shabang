import React from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '../../store/useFlowStore';

// Entity Node - Simple Rectangle
export const EntityNode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  const isWeak = data.isWeak || false;

  return (
    <div className={`bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg min-w-[150px] px-6 py-4 ${
      isWeak ? 'border-double border-4' : 'border-2'
    } ${
      selected ? 'border-blue-400' : 'border-blue-800'
    }`}>
      {/* Relationship Handles - Left and Right sides for entity-to-entity relationships */}
      <Handle 
        type="target" 
        position={Position.Left}
        id="handle-relations-left"
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
      />
      <Handle 
        type="source" 
        position={Position.Right}
        id="handle-relations-right"
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
      />
      <Handle 
        type="target" 
        position={Position.Top}
        id="handle-relations-top"
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
      />
      
      <input
        type="text"
        value={data.label || 'Entity'}
        onChange={handleLabelChange}
        className="nodrag w-full bg-transparent text-white font-semibold text-center outline-none focus:bg-blue-800 focus:bg-opacity-30 px-2 py-1 rounded transition-colors"
        placeholder="Entity Name"
      />

      {isWeak && (
        <div className="text-center text-xs text-blue-200 mt-1 font-medium">
          Weak Entity
        </div>
      )}

      {/* Attribute Handle - Bottom for spawning attributes */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="handle-attributes"
        className="!bg-green-400 !w-3 !h-3 !border-2 !border-green-700"
        style={{ bottom: '-6px' }}
      />
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
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-purple-300 !w-3 !h-3 !border-2 !border-purple-700"
      />
      
      <div className={`bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-lg border-2 ${
        selected ? 'border-purple-300' : 'border-purple-700'
      } px-6 py-3 min-w-[120px] flex items-center justify-center`}>
        <input
          type="text"
          value={data.label || 'Attribute'}
          onChange={handleLabelChange}
          className={`nodrag w-full bg-transparent text-white font-medium text-sm text-center outline-none focus:bg-purple-700 focus:bg-opacity-30 px-2 py-1 rounded transition-colors ${
            data.isKey ? 'underline decoration-2 underline-offset-2' : ''
          }`}
          placeholder="Attribute"
        />
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom}
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
    <div className="relative" style={{ width: '140px', height: '140px' }}>
      <Handle 
        type="target" 
        position={Position.Left}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
      />
      
      {/* Diamond Shape */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg ${
          isIdentifying ? 'border-double border-4' : 'border-2'
        } ${
          selected ? 'border-orange-300' : 'border-orange-700'
        } flex items-center justify-center`}
        style={{ 
          transform: 'rotate(45deg)',
          transformOrigin: 'center'
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
            padding: '20px'
          }}
        >
          <input
            type="text"
            value={data.label || 'Relationship'}
            onChange={handleLabelChange}
            className="nodrag w-full bg-transparent text-white font-medium text-sm text-center outline-none focus:bg-orange-700 focus:bg-opacity-30 px-2 py-1 rounded transition-colors"
            placeholder="Relationship"
          />
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
      />
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
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
    <div className="relative" style={{ width: '120px', height: '120px' }}>
      {/* Handles for connecting superclass (top) and subclasses (bottom sides) */}
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
      />
      
      {/* Triangle Shape using clip-path */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 shadow-lg border-2 ${
          selected ? 'border-green-300' : 'border-green-700'
        } flex items-center justify-center`}
        style={{
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        }}
      >
        <div className="mt-8">
          <input
            type="text"
            value={data.label || 'ISA'}
            onChange={handleLabelChange}
            className="nodrag w-16 bg-transparent text-white font-semibold text-xs text-center outline-none focus:bg-green-700 focus:bg-opacity-30 px-1 py-1 rounded transition-colors"
            placeholder="ISA"
          />
        </div>
      </div>

      {/* Bottom handles for subclasses */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="subclass-left"
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
        style={{ left: '30%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="subclass-right"
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
        style={{ left: '70%' }}
      />
    </div>
  );
};

export default { EntityNode, AttributeNode, RelationshipNode, IsANode };
