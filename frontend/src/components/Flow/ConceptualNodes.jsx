import React from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '../../store/useFlowStore';

// Entity Node - Simple Rectangle
export const EntityNode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div className={`bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg min-w-[150px] px-6 py-4 border-2 ${
      selected ? 'border-blue-400' : 'border-blue-800'
    }`}>
      <Handle 
        type="target" 
        position={Position.Left}
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
      />
      
      <input
        type="text"
        value={data.label || 'Entity'}
        onChange={handleLabelChange}
        className="nodrag w-full bg-transparent text-white font-semibold text-center outline-none focus:bg-blue-800 focus:bg-opacity-30 px-2 py-1 rounded transition-colors"
        placeholder="Entity Name"
      />

      <Handle 
        type="source" 
        position={Position.Right}
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
      />
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
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
          className="nodrag w-full bg-transparent text-white font-medium text-sm text-center outline-none focus:bg-purple-700 focus:bg-opacity-30 px-2 py-1 rounded transition-colors"
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

  return (
    <div className="relative" style={{ width: '140px', height: '140px' }}>
      <Handle 
        type="target" 
        position={Position.Left}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
      />
      
      {/* Diamond Shape */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg border-2 ${
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

export default { EntityNode, AttributeNode, RelationshipNode };
