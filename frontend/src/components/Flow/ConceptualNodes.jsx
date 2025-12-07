import React from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '../../store/useFlowStore';

// Entity Node - Rectangle with columns
export const EntityNode = ({ id, data }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg min-w-[200px] max-w-[300px]">
      <Handle 
        type="target" 
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3"
      />
      
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-md px-4 py-3">
        <input
          type="text"
          value={data.label || 'Entity'}
          onChange={handleLabelChange}
          className="nodrag w-full bg-transparent text-white font-semibold text-sm text-center outline-none focus:bg-blue-800 px-2 py-1 rounded transition-colors"
          placeholder="Entity Name"
        />
      </div>

      <div className="bg-gray-50 rounded-b-md">
        {data.columns && data.columns.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {data.columns.map((column, index) => (
              <div
                key={index}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{column.name}</span>
                  <span className="text-xs text-gray-500">{column.type}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center">
            <p className="text-gray-400 text-xs italic">No attributes</p>
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3"
      />
    </div>
  );
};

// Attribute Node - Ellipse/Oval
export const AttributeNode = ({ id, data }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div className="relative">
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-purple-500 !w-3 !h-3"
      />
      
      <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-lg border-2 border-purple-700 px-6 py-4 min-w-[120px] flex items-center justify-center">
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
        className="!bg-purple-500 !w-3 !h-3"
      />
    </div>
  );
};

// Relationship Node - Diamond
export const RelationshipNode = ({ id, data }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div className="relative" style={{ width: '140px', height: '140px' }}>
      <Handle 
        type="target" 
        position={Position.Left}
        className="!bg-orange-500 !w-3 !h-3"
      />
      
      {/* Diamond Shape */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg border-2 border-orange-700 flex items-center justify-center"
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
        className="!bg-orange-500 !w-3 !h-3"
      />
      
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-orange-500 !w-3 !h-3"
      />
      
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="!bg-orange-500 !w-3 !h-3"
      />
    </div>
  );
};

export default { EntityNode, AttributeNode, RelationshipNode };
