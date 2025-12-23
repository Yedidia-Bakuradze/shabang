import React from 'react';
import useFlowStore from '../../../store/useFlowStore';

const AttributePanel = ({ node }) => {
  const { updateNodeData } = useFlowStore();

  const handleNameChange = (e) => {
    updateNodeData(node.id, { label: e.target.value });
  };

  const handleKeyToggle = () => {
    updateNodeData(node.id, { isKey: !node.data.isKey });
  };

  return (
    <div className="space-y-6">
      {/* Attribute Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Attribute Name
        </label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={handleNameChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Attribute name"
        />
      </div>

      {/* Primary Key Toggle */}
      <div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={node.data.isKey || false}
            onChange={handleKeyToggle}
            className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
          />
          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Primary Key
          </span>
        </label>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Primary keys will be underlined on the canvas
        </p>
      </div>

      {/* Info */}
      {node.data.entityId && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-md">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <svg className="inline w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This attribute is connected to an entity
          </p>
        </div>
      )}
    </div>
  );
};

export default AttributePanel;
