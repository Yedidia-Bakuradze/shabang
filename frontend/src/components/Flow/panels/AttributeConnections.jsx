import React, { useState } from 'react';
import useFlowStore from '../../../store/useFlowStore';
import ToggleSwitch from './ToggleSwitch';

// Data Types for SQL-like ERD
const DATA_TYPES = [
    { value: 'VARCHAR', label: 'VARCHAR' },
    { value: 'TEXT', label: 'TEXT' },
    { value: 'INTEGER', label: 'INTEGER' },
    { value: 'BIGINT', label: 'BIGINT' },
    { value: 'SERIAL', label: 'SERIAL' },
    { value: 'UUID', label: 'UUID' },
    { value: 'BOOLEAN', label: 'BOOLEAN' },
    { value: 'DATE', label: 'DATE' },
    { value: 'TIMESTAMP', label: 'TIMESTAMP' },
    { value: 'TIMESTAMPTZ', label: 'TIMESTAMPTZ' },
    { value: 'DECIMAL', label: 'DECIMAL' },
    { value: 'FLOAT', label: 'FLOAT' },
    { value: 'JSON', label: 'JSON' },
    { value: 'JSONB', label: 'JSONB' },
];

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
    const [expandedAttrId, setExpandedAttrId] = useState(null);

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
    };

    const handleAttributeUpdate = (attrId, field, value) => {
        if (isEntity) {
            updateEntityAttribute(node.id, attrId, { [field]: value });
        } else {
            updateRelationshipAttribute(node.id, attrId, { [field]: value });
        }
    };

    const handleAddAttribute = () => {
        if (!newAttributeName.trim()) return;

        if (isEntity) {
            addAttributeToEntity(node.id, {
                name: newAttributeName.trim(),
                isKey: false,
                allowNull: true,
                isUnique: false,
                dataType: 'VARCHAR'
            });
        } else {
            addAttributeToRelationship(node.id, {
                name: newAttributeName.trim()
            });
        }
        setNewAttributeName('');
    };

    const toggleExpanded = (attrId) => {
        setExpandedAttrId(expandedAttrId === attrId ? null : attrId);
    };

    return (
        <div className="space-y-4">

            {/* --- HEADER --- */}
            <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Attributes
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {connectedAttributes.length}
                </span>
            </div>

            {/* --- ATTRIBUTE CONNECTIONS LIST --- */}
            <div className="space-y-2">
                {connectedAttributes.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        No attributes defined
                    </div>
                ) : (
                    connectedAttributes.map((attr, index) => {
                        const isExpanded = expandedAttrId === attr.id;
                        
                        return (
                            <div
                                key={attr.id}
                                className={`
                                    rounded-lg border transition-all duration-200
                                    ${isExpanded 
                                        ? 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600 shadow-md' 
                                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }
                                `}
                            >
                                {/* Collapsed Header */}
                                <div 
                                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                                    onClick={() => toggleExpanded(attr.id)}
                                >
                                    {/* Key Icon */}
                                    {attr.isKey ? (
                                        <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : attr.isForeignKey ? (
                                        <svg className="w-4 h-4 text-orange-400 flex-shrink-0 -rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <div className="w-4 h-4 flex-shrink-0" />
                                    )}

                                    {/* Name */}
                                    <span className={`flex-1 text-sm font-medium truncate ${
                                        attr.isKey 
                                            ? 'text-yellow-600 dark:text-yellow-400' 
                                            : attr.isForeignKey 
                                                ? 'text-orange-600 dark:text-orange-400 italic'
                                                : 'text-gray-800 dark:text-gray-200'
                                    }`}>
                                        {attr.name}
                                    </span>

                                    {/* Data Type Badge */}
                                    <span className="text-xs text-purple-600 dark:text-purple-400 font-mono bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                                        {attr.dataType || 'VARCHAR'}
                                    </span>

                                    {/* Expand Arrow */}
                                    <svg 
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-3 pb-3 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                                        
                                        {/* Attribute Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                                Column Name
                                            </label>
                                            <input
                                                type="text"
                                                value={attr.name}
                                                onChange={(e) => handleAttributeUpdate(attr.id, 'name', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="column_name"
                                            />
                                        </div>

                                        {/* Data Type */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                                Data Type
                                            </label>
                                            <select
                                                value={attr.dataType || 'VARCHAR'}
                                                onChange={(e) => handleAttributeUpdate(attr.id, 'dataType', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {DATA_TYPES.map(dt => (
                                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Default Value */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                                Default Value
                                            </label>
                                            <input
                                                type="text"
                                                value={attr.defaultValue || ''}
                                                onChange={(e) => handleAttributeUpdate(attr.id, 'defaultValue', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                                                placeholder="e.g. gen_random_uuid()"
                                            />
                                        </div>

                                        {/* Toggle Switches Section */}
                                        {isEntity && (
                                            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                <ToggleSwitch
                                                    checked={attr.isKey || false}
                                                    onChange={() => handleAttributeUpdate(attr.id, 'isKey', !attr.isKey)}
                                                    label="Primary Key"
                                                />
                                                <ToggleSwitch
                                                    checked={attr.allowNull !== false}
                                                    onChange={() => handleAttributeUpdate(attr.id, 'allowNull', attr.allowNull === false)}
                                                    label="Allow Null"
                                                />
                                                <ToggleSwitch
                                                    checked={attr.isUnique || false}
                                                    onChange={() => handleAttributeUpdate(attr.id, 'isUnique', !attr.isUnique)}
                                                    label="Is Unique"
                                                />
                                            </div>
                                        )}

                                        {/* FK Info (Read-only) */}
                                        {attr.isForeignKey && (
                                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                                <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>References: <strong>{attr.referencedEntity || 'Unknown'}</strong></span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => handleUnlinkAttribute(attr.id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-lg transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                Unlink
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAttribute(attr.id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- ADD ATTRIBUTE SECTION --- */}
            <div className="pt-2 space-y-3">
                {/* Link Existing */}
                {availableAttributes.length > 0 && (
                    <div className="flex gap-2">
                        <select
                            value={selectedAttributeId}
                            onChange={(e) => setSelectedAttributeId(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Link existing attribute...</option>
                            {availableAttributes.map(node => (
                                <option key={node.id} value={node.id}>{node.data.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleLinkAttribute}
                            disabled={!selectedAttributeId}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Link
                        </button>
                    </div>
                )}

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="flex-shrink-0 mx-3 text-gray-400 text-xs uppercase tracking-wider">or create new</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                {/* Create New */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newAttributeName}
                        onChange={(e) => setNewAttributeName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddAttribute()}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                        placeholder="new_column_name"
                    />
                    <button
                        onClick={handleAddAttribute}
                        disabled={!newAttributeName.trim()}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttributeConnections;