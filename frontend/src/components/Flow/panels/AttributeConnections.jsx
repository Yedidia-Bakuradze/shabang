import React, { useState } from 'react';
import useFlowStore from '../../../store/useFlowStore';

const AttributeConnections = ({ node }) => {
    const {
        nodes,
        // Entity Actions
        updateEntityAttribute,
        removeEntityAttribute,
        addAttributeToEntity,
        connectAttributeToEntity,
        disconnectAttributeFromEntity,
        // Relationship Actions
        updateRelationshipAttribute,
        removeRelationshipAttribute,
        addAttributeToRelationship,
        connectAttributeToRelationship,
        disconnectAttributeFromRelationship
    } = useFlowStore();

    const [selectedAttributeId, setSelectedAttributeId] = useState('');
    const [newAttributeName, setNewAttributeName] = useState('');

    const isEntity = node.type === 'entityNode';
    const connectedAttributes = node.data.attributes || [];

    // Filter for nodes that are Attributes AND NOT already connected to this node
    const availableAttributes = nodes.filter(n =>
        n.type === 'attributeNode' &&
        !connectedAttributes.some(attr => attr.id === n.id)
    );

    // --- Dynamic Handlers based on Node Type ---

    const handleLinkAttribute = () => {
        if (!selectedAttributeId) return;
        if (isEntity) {
            connectAttributeToEntity(node.id, selectedAttributeId);
        } else {
            connectAttributeToRelationship(node.id, selectedAttributeId);
        }
        setSelectedAttributeId('');
    };

    const handleUnlinkAttribute = (attrId) => {
        if (isEntity) {
            disconnectAttributeFromEntity(node.id, attrId);
        } else {
            disconnectAttributeFromRelationship(node.id, attrId);
        }
    };

    const handleDeleteAttribute = (attrId) => {
        if (window.confirm('Delete this attribute node entirely?')) {
            if (isEntity) {
                removeEntityAttribute(node.id, attrId);
            } else {
                removeRelationshipAttribute(node.id, attrId);
            }
        }
    }

    const handleKeyToggle = (attrId, isKey) => {
        // Only Entities support Keys usually, but we keep generic structure
        if (isEntity) {
            updateEntityAttribute(node.id, attrId, { isKey: !isKey });
        }
    };

    const handleNameChange = (attrId, newName) => {
        if (isEntity) {
            updateEntityAttribute(node.id, attrId, { name: newName });
        } else {
            updateRelationshipAttribute(node.id, attrId, { name: newName });
        }
    };

    const handleAddAttribute = () => {
        if (!newAttributeName.trim()) return;

        if (isEntity) {
            addAttributeToEntity(node.id, {
                name: newAttributeName.trim(),
                isKey: false
            });
        } else {
            addAttributeToRelationship(node.id, {
                name: newAttributeName.trim()
            });
        }
        setNewAttributeName('');
    };

    return (
        <div className="space-y-4">

            {/* --- ATTRIBUTE CONNECTIONS LIST --- */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Attribute Connections
                    </label>
                </div>

                <div className="space-y-3 mb-3">
                    {connectedAttributes.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                            No attributes connected.
                        </div>
                    ) : (
                        connectedAttributes.map((attr, index) => (
                            <div
                                key={attr.id}
                                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 space-y-2 relative"
                            >
                                {/* Header with Actions */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Attribute {index + 1}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleUnlinkAttribute(attr.id)}
                                            className="text-gray-400 hover:text-orange-500 transition-colors p-1"
                                            title="Unlink (Disconnect)"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAttribute(attr.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            title="Delete Node"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Attribute Name Input (Editable) */}
                                <input
                                    type="text"
                                    value={attr.name}
                                    onChange={(e) => handleNameChange(attr.id, e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Attribute Name"
                                />

                                {/* Properties (PK Toggle - Only show for Entities) */}
                                {isEntity && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleKeyToggle(attr.id, attr.isKey)}
                                            className={`
                            flex items-center gap-2 px-2 py-1 rounded border text-xs font-medium transition-colors
                            ${attr.isKey
                                                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                                                    : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200'}
                        `}
                                        >
                                            {attr.isKey ? (
                                                <>
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.54 12.53a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4l-1-1" />
                                                    </svg>
                                                    Primary Key
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-3 h-3 border border-gray-400 rounded-sm inline-block"></span>
                                                    Set as PK
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Link Existing Attribute */}
                <div className="flex gap-2 mb-4">
                    <select
                        value={selectedAttributeId}
                        onChange={(e) => setSelectedAttributeId(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Link Existing Attribute...</option>
                        {availableAttributes.map(node => (
                            <option key={node.id} value={node.id}>{node.data.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleLinkAttribute}
                        disabled={!selectedAttributeId}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors"
                    >
                        Link
                    </button>
                </div>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR CREATE NEW</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                {/* Create New Attribute */}
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
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                        Create
                    </button>
                </div>
            </div>

        </div>
    );
};

export default AttributeConnections;