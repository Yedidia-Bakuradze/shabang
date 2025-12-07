import React, { useState } from 'react';
import useFlowStore from '../../../store/useFlowStore';

const EntityPanel = ({ node }) => {
  const { updateNodeData, addAttributeToEntity, updateEntityAttribute, removeEntityAttribute } = useFlowStore();
  const [newAttributeName, setNewAttributeName] = useState('');

  const handleNameChange = (e) => {
    updateNodeData(node.id, { label: e.target.value });
  };

  const handleAddAttribute = () => {
    if (!newAttributeName.trim()) return;
    
    addAttributeToEntity(node.id, {
      name: newAttributeName.trim(),
      isKey: false
    });
    
    setNewAttributeName('');
  };

  const handleAttributeNameChange = (attrId, newName) => {
    updateEntityAttribute(node.id, attrId, { name: newName });
  };

  const handleAttributeKeyToggle = (attrId, isKey) => {
    updateEntityAttribute(node.id, attrId, { isKey: !isKey });
  };

  const handleRemoveAttribute = (attrId) => {
    if (window.confirm('Are you sure you want to remove this attribute?')) {
      removeEntityAttribute(node.id, attrId);
    }
  };

  const attributes = node.data.attributes || [];

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

      {/* Attributes Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Attributes
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {attributes.length} attribute{attributes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Attributes List */}
        <div className="space-y-2 mb-3">
          {attributes.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
              No attributes yet. Add one below.
            </div>
          ) : (
            attributes.map((attr) => (
              <div
                key={attr.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
              >
                <button
                  onClick={() => handleAttributeKeyToggle(attr.id, attr.isKey)}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    attr.isKey
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500'
                  }`}
                  title={attr.isKey ? 'Primary Key' : 'Make Primary Key'}
                >
                  {attr.isKey && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => handleAttributeNameChange(attr.id, e.target.value)}
                  className={`flex-1 px-2 py-1 text-sm bg-transparent border-none focus:outline-none text-gray-900 dark:text-gray-100 ${
                    attr.isKey ? 'font-semibold' : ''
                  }`}
                  placeholder="Attribute name"
                />

                <button
                  onClick={() => handleRemoveAttribute(attr.id)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  title="Remove attribute"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Attribute Form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newAttributeName}
            onChange={(e) => setNewAttributeName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAttribute()}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="New attribute name"
          />
          <button
            onClick={handleAddAttribute}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click checkbox to mark as Primary Key
          </span>
        </p>
      </div>
    </div>
  );
};

export default EntityPanel;
