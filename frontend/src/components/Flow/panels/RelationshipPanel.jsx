import React, { useState } from 'react';
import useFlowStore from '../../../store/useFlowStore';
import AttributeConnections from './AttributeConnections'; // Shared component

const RelationshipPanel = ({ node }) => {
  const {
    updateNodeData,
    updateNodeLabel, // Import updateNodeLabel
    getEntityNodes,
    edges,
    connectEntityToRelationship,
    disconnectEntityFromRelationship,
    updateEdgeCardinality,
    updateRelationshipType, // NEW: Import relationship type updater
  } = useFlowStore();

  const [selectedEntityId, setSelectedEntityId] = useState('');

  const connectedEntityIds = node.data.entityConnections || [];
  const entityNodes = getEntityNodes();

  const getEdgeForEntity = (entityId) => {
    return edges.find(edge =>
      (edge.source === entityId && edge.target === node.id) ||
      (edge.source === node.id && edge.target === entityId)
    );
  };

  const handleNameChange = (e) => {
    updateNodeData(node.id, { label: e.target.value });
  };

  // NEW: Handle renaming the connected entity
  const handleEntityNameChange = (entityId, newName) => {
    updateNodeLabel(entityId, newName);
  };

  const handleAddConnection = () => {
    if (!selectedEntityId) return;
    connectEntityToRelationship(node.id, selectedEntityId);
    setSelectedEntityId('');
  };

  const handleRemoveConnection = (entityId) => {
    if (window.confirm("Remove this connection?")) {
      disconnectEntityFromRelationship(node.id, entityId);
    }
  };

  const handleCardinalityChange = (entityId, newCardinality) => {
    const targetEdge = getEdgeForEntity(entityId);
    if (targetEdge) {
      updateEdgeCardinality(targetEdge.id, newCardinality);
    }
  };

  const availableEntities = entityNodes.filter(
    e => !connectedEntityIds.includes(e.id)
  );

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
          placeholder="e.g., Works For"
        />
      </div>

      {/* --- ENTITY CONNECTIONS --- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Entity Connections
          </label>
        </div>

        <div className="space-y-3 mb-3">
          {connectedEntityIds.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
              No entities connected.
            </div>
          ) : (
            connectedEntityIds.map((entityId, index) => {
              const entityNode = entityNodes.find(e => e.id === entityId);
              const edge = getEdgeForEntity(entityId);
              const currentCardinality = edge ? edge.label : 'N';

              return (
                <div key={entityId} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Connection {index + 1}</span>
                    <button onClick={() => handleRemoveConnection(entityId)} className="text-gray-400 hover:text-red-500 transition-colors" title="Remove Connection">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Entity Name (Editable) */}
                  <input
                    type="text"
                    value={entityNode ? entityNode.data.label : ''}
                    onChange={(e) => handleEntityNameChange(entityId, e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Entity Name"
                  />

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Card:</label>
                    <select
                      value={currentCardinality}
                      onChange={(e) => handleCardinalityChange(entityId, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="1">One (1)</option>
                      <option value="N">Many (N)</option>
                      <option value="0..1">Zero or One (0..1)</option>
                      <option value="1..N">One or Many (1..N)</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select Entity...</option>
            {availableEntities.map(node => (
              <option key={node.id} value={node.id}>{node.data.label}</option>
            ))}
          </select>
          <button onClick={handleAddConnection} disabled={!selectedEntityId} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors">
            Link
          </button>
        </div>
      </div>

      {/* --- RELATIONSHIP TYPE SELECTOR --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Relationship Type
        </label>
        <select
          value={node.data.relationshipType || '1:N'}
          onChange={(e) => updateRelationshipType(node.id, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="1:1">One-to-One (1:1)</option>
          <option value="1:N">One-to-Many (1:N)</option>
          <option value="N:1">Many-to-One (N:1)</option>
          <option value="M:N">Many-to-Many (M:N)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {node.data.relationshipType === 'M:N' 
            ? 'M:N relationships use this node as a junction table. Add attributes here.'
            : 'Foreign keys will be auto-injected based on type.'}
        </p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4"></div>

      {/* --- ATTRIBUTE CONNECTIONS --- */}
      <AttributeConnections node={node} />

    </div>
  );
};

export default RelationshipPanel;