import React from 'react';
import useFlowStore from '../../store/useFlowStore';
import EntityPanel from './panels/EntityPanel';
import AttributePanel from './panels/AttributePanel';
import RelationshipPanel from './panels/RelationshipPanel';
import DSDTablePanel from './panels/DSDTablePanel';

const PropertyPanel = () => {
  const { selectedNodeId, nodes, viewMode, dsdNodes } = useFlowStore();
  
  // Use the appropriate nodes based on view mode
  const activeNodes = viewMode === 'dsd' ? dsdNodes : nodes;
  const selectedNode = activeNodes.find(node => node.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-80 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Selection
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select an element on the canvas to edit its properties
          </p>
          {viewMode === 'dsd' && (
            <p className="text-xs text-indigo-500 mt-2">
              DSD View Mode - Read Only
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Properties
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {selectedNode.type === 'entityNode' && 'Entity'}
          {selectedNode.type === 'attributeNode' && 'Attribute'}
          {selectedNode.type === 'relationshipNode' && 'Relationship'}
          {selectedNode.type === 'dsdTableNode' && 'DSD Table'}
        </p>
      </div>
      
      <div className="p-4">
        {selectedNode.type === 'entityNode' && (
          <EntityPanel node={selectedNode} />
        )}
        {selectedNode.type === 'attributeNode' && (
          <AttributePanel node={selectedNode} />
        )}
        {selectedNode.type === 'relationshipNode' && (
          <RelationshipPanel node={selectedNode} />
        )}
        {selectedNode.type === 'dsdTableNode' && (
          <DSDTablePanel node={selectedNode} />
        )}
      </div>
    </div>
  );
};

export default PropertyPanel;
