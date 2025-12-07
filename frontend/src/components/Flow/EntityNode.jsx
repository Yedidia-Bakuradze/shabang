import React from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '../../store/useFlowStore';

const EntityNode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div className={`bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg min-w-[150px] px-6 py-4 border-2 ${
      selected ? 'border-blue-400' : 'border-blue-800'
    }`}>
      {/* Left Handle - Target */}
      <Handle 
        type="target" 
        position={Position.Left}
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
      />
      
      {/* Editable Entity Name */}
      <input
        type="text"
        value={data.label || 'Entity'}
        onChange={handleLabelChange}
        className="nodrag w-full bg-transparent text-white font-semibold text-center outline-none focus:bg-blue-800 focus:bg-opacity-30 px-2 py-1 rounded transition-colors"
        placeholder="Entity Name"
      />

      {/* Right Handle - Source */}
      <Handle 
        type="source" 
        position={Position.Right}
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
      />
      
      {/* Top Handle */}
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
      />
      
      {/* Bottom Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="!bg-blue-300 !w-3 !h-3 !border-2 !border-blue-800"
      />
    </div>
  );
};

export default EntityNode;
