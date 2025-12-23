import React from 'react';
import useFlowStore from '../../../store/useFlowStore';
import AttributeConnections from './AttributeConnections'; // Import the new component

const EntityPanel = ({ node }) => {
  const { updateNodeData } = useFlowStore();

  const handleNameChange = (e) => {
    updateNodeData(node.id, { label: e.target.value });
  };

  const isWeak = node.data.isWeak || false;

  const handleWeakToggle = () => {
    updateNodeData(node.id, { isWeak: !isWeak });
  }

  return (
    <div className="space-y-6">
      {/* Entity Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Entity Name
        </label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={handleNameChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Entity name"
        />
      </div>

      {/* Weak Entity Toggle */}
      <div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isWeak}
            onChange={handleWeakToggle}
            className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Is Weak Entity?
          </span>
        </label>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Weak entities depend on another entity for identification.
        </p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-2"></div>

      {/* Attribute Connections Section */}
      <AttributeConnections node={node} />

    </div>
  );
};

export default EntityPanel;