import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '../../store/useFlowStore';

const EntityNode = ({ id, data }) => {
  const { updateNodeData } = useFlowStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tableName, setTableName] = useState(data.label || 'New_Table');

  const handleNameChange = (e) => {
    setTableName(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    if (tableName.trim()) {
      updateNodeData(id, { label: tableName.trim() });
    } else {
      setTableName(data.label || 'New_Table');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg min-w-[200px] max-w-[300px]">
      {/* Left Handle - Target */}
      <Handle 
        type="target" 
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3"
      />
      
      {/* Header - Table Name */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-md px-4 py-3">
        {isEditing ? (
          <input
            type="text"
            value={tableName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full bg-blue-800 text-white font-semibold text-sm px-2 py-1 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        ) : (
          <h3
            onClick={() => setIsEditing(true)}
            className="text-white font-semibold text-sm cursor-pointer hover:bg-blue-800 px-2 py-1 rounded transition-colors"
          >
            {data.label || 'New_Table'}
          </h3>
        )}
      </div>

      {/* Body - Columns List */}
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
            <p className="text-gray-400 text-xs italic">No columns defined</p>
            <p className="text-gray-400 text-xs mt-1">Click to add fields</p>
          </div>
        )}
      </div>

      {/* Right Handle - Source */}
      <Handle 
        type="source" 
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3"
      />
    </div>
  );
};

export default EntityNode;
