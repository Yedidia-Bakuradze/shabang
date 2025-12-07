import React, { useState } from 'react';
import useFlowStore from '../../../store/useFlowStore';

const RelationshipPanel = ({ node }) => {
  const { 
    updateNodeData, 
    getEntityNodes, 
    updateRelationshipConnections,
    addAttributeToEntity 
  } = useFlowStore();
  
  const [newAttributeName, setNewAttributeName] = useState('');
  const entityNodes = getEntityNodes();
  
  const connections = node.data.connections || [];
  const attributes = node.data.attributes || [];

  const handleNameChange = (e) => {
    updateNodeData(node.id, { label: e.target.value });
  };

  const handleConnectionChange = (index, field, value) => {
    const updatedConnections = [...connections];
    
    if (index >= updatedConnections.length) {
      updatedConnections.push({ entityId: '', cardinality: '1' });
    }
    
    updatedConnections[index] = {
      ...updatedConnections[index],
      [field]: value
    };
    
    updateRelationshipConnections(node.id, updatedConnections);
  };

  const handleRemoveConnection = (index) => {
    const updatedConnections = connections.filter((_, i) => i !== index);
    updateRelationshipConnections(node.id, updatedConnections);
  };

  const handleAddConnection = () => {
    const updatedConnections = [...connections, { entityId: '', cardinality: '1' }];
    updateRelationshipConnections(node.id, updatedConnections);
  };

  const handleAddAttribute = () => {
    if (!newAttributeName.trim()) return;
    
    // For relationships, we store attributes in the data but also spawn nodes
    const attributeId = `attr-rel-${Date.now()}`;
    const newAttr = {
      id: attributeId,
      name: newAttributeName.trim(),
      isKey: false
    };
    
    updateNodeData(node.id, {
      attributes: [...attributes, newAttr]
    });
    
    setNewAttributeName('');
  };

  return (
    <div className="space-y-6">
      {/* Relationship Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Relationship Name
        </label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={handleNameChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="e.g., Works For, Owns"
        />
      </div>

      {/* Connections Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Entity Connections
          </label>
        </div>

        {/* Connection List */}
        <div className="space-y-3 mb-3">
          {connections.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
              No connections yet. Add entities below.
            </div>
          ) : (
            connections.map((conn, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Connection {index + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveConnection(index)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Remove connection"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Entity
                  </label>
                  <select
                    value={conn.entityId || ''}
                    onChange={(e) => handleConnectionChange(index, 'entityId', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Entity...</option>
                    {entityNodes.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.data.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Cardinality
                  </label>
                  <select
                    value={conn.cardinality || '1'}
                    onChange={(e) => handleConnectionChange(index, 'cardinality', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="1">One (1)</option>
                    <option value="N">Many (N)</option>
                    <option value="0..1">Zero or One (0..1)</option>
                    <option value="1..N">One or Many (1..N)</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={handleAddConnection}
          className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          + Add Entity Connection
        </button>

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Relationships should connect at least 2 entities
        </p>
      </div>

      {/* Relationship Attributes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Relationship Attributes
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Optional
          </span>
        </div>

        <div className="space-y-2 mb-3">
          {attributes.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-3">
              No attributes (e.g., Start Date, End Date)
            </div>
          ) : (
            attributes.map((attr) => (
              <div
                key={attr.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
              >
                <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                  {attr.name}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newAttributeName}
            onChange={(e) => setNewAttributeName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAttribute()}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Attribute name"
          />
          <button
            onClick={handleAddAttribute}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelationshipPanel;
