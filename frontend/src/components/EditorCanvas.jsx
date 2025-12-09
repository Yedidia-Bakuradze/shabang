import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel
} from 'reactflow';

import 'reactflow/dist/style.css';

import useFlowStore from '../store/useFlowStore';
import { useTheme } from '../context/ThemeContext';

import { EntityNode, AttributeNode, RelationshipNode, IsANode } from './Flow/ConceptualNodes';
import ErdEdge from './Flow/ErdEdge';
import ErdMarkers from './Flow/ErdMarkers';

const EditorCanvas = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId
  } = useFlowStore();

  const { darkMode } = useTheme();

  // Register custom node types
  const nodeTypes = useMemo(() => ({
    entityNode: EntityNode,
    attributeNode: AttributeNode,
    relationshipNode: RelationshipNode,
    isaNode: IsANode
  }), []);

  // Register custom edge types
  const edgeTypes = useMemo(() => ({
    erdEdge: ErdEdge
  }), []);

  // Default edge options
  const defaultEdgeOptions = {
    type: 'erdEdge',
    animated: false,
    style: { strokeWidth: 2 },
    data: { sourceCardinality: 'ONE', targetCardinality: 'MANY' }
  };

  // Node click handler
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  // Click on background
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // Node selection change
  const onSelectionChange = useCallback(({ nodes }) => {
    if (nodes.length > 0) {
      setSelectedNodeId(nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeId]);

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        colorMode={darkMode ? 'dark' : 'light'}
      >
        {/* DARK-MODE AWARE MARKERS */}
        <ErdMarkers />

        {/* BACKGROUND */}
        <Background
          color={darkMode ? '#4b5563' : '#9ca3af'}
          gap={16}
        />

        {/* CONTROLS */}
        <Controls
          className="
            /* MAIN BOX STYLING */
            !bg-white dark:!bg-gray-900 
            !border-gray-200 dark:!border-gray-700 
            !shadow-lg !m-4

            /* BUTTON STYLING */
            [&>button]:!bg-transparent
            [&>button]:!border-b 
            [&>button]:!border-gray-100 dark:[&>button]:!border-gray-800
            
            /* ICON COLORS (Blueish) */
            [&>button]:!fill-blue-600 dark:[&>button]:!fill-blue-500
            
            /* HOVER STATES */
            [&>button:hover]:!bg-gray-50 
            dark:[&>button:hover]:!bg-gray-800
            
            /* Last button border fix */
            [&>button:last-child]:!border-b-0
          "
        />

        {/* MINIMAP */}
        <MiniMap
          style={{
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          }}
          maskColor={darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(240, 242, 245, 0.6)'}
          nodeColor={(n) =>
            n.type === 'entityNode'
              ? '#3b82f6'
              : n.type === 'attributeNode'
                ? '#8b5cf6'
                : n.type === 'relationshipNode'
                  ? '#f97316'
                  : '#6b7280'
          }
        />

        {/* Right-Side Add Node Panel */}
        <Panel position="top-right" className="space-x-2">
          <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Add Node</div>

            {/* Entity */}
            <button
              onClick={() => addNode('entityNode')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Entity
            </button>

            {/* Attribute */}
            <button
              onClick={() => addNode('attributeNode')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Attribute
            </button>

            {/* Relationship */}
            <button
              onClick={() => addNode('relationshipNode')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              Relationship
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default EditorCanvas;