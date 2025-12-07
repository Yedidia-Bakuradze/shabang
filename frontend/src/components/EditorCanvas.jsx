import React, { useMemo, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import useFlowStore from '../store/useFlowStore';
import { EntityNode, AttributeNode, RelationshipNode } from './Flow/ConceptualNodes';
import ErdEdge from './Flow/ErdEdge';

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

  // Register custom node types
  const nodeTypes = useMemo(() => ({ 
    entityNode: EntityNode,
    attributeNode: AttributeNode,
    relationshipNode: RelationshipNode
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

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  // Handle pane click (background)
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // Handle node selection change
  const onSelectionChange = useCallback(({ nodes }) => {
    if (nodes.length > 0) {
      setSelectedNodeId(nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeId]);

  return (
    <div className="w-full h-full">
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
      >
        {/* SVG Marker Definitions for Crow's Foot Notation */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
          <defs>
            {/* Gradient for the animation particles */}
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            {/* Marker: One (Vertical Line) */}
            <marker id="marker-one" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M6,2 L6,10 M10,2 L10,10 M2,6 L10,6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </marker>

            {/* Marker: Many (Crow's Foot) */}
            <marker id="marker-many" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 M10,6 L2,6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </marker>

            {/* Marker: Zero or One */}
            <marker id="marker-zero-one" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto">
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="#fff" />
              <path d="M12,2 L12,10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </marker>

            {/* Marker: Zero or Many */}
            <marker id="marker-zero-many" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto">
              <circle cx="4" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="#fff" />
              <path d="M6,2 L14,6 L6,10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </marker>
          </defs>
        </svg>

        <Background />
        <Controls />
        <MiniMap />
        
        <Panel position="top-right" className="space-x-2">
          <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Add Node</div>
            <button
              onClick={() => addNode('entityNode')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Entity
            </button>
            <button
              onClick={() => addNode('attributeNode')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Attribute
            </button>
            <button
              onClick={() => addNode('relationshipNode')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
