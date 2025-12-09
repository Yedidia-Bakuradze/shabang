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
    setSelectedNodeId,
    autoLayout
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
    <div className="w-full h-full transition-colors duration-300"
      style={{
        // StitchAI Midnight Purple gradient background
        background: darkMode 
          ? 'linear-gradient(135deg, #0f0a1e 0%, #1a1035 25%, #0d1b2a 50%, #1a0a2e 75%, #0f0a1e 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)'
      }}
    >
      {/* 
        CSS to ensure edges render BEHIND nodes:
        - .react-flow__edges has lower z-index than nodes
        - Edge labels maintain high z-index to stay visible
        - StitchAI-style grid pattern
      */}
      <style>{`
        .react-flow__edges {
          z-index: 0 !important;
        }
        .react-flow__edge {
          z-index: 0 !important;
        }
        .react-flow__nodes {
          z-index: 1 !important;
        }
        .react-flow__node {
          z-index: 2 !important;
        }
        .react-flow__node.selected {
          z-index: 3 !important;
        }
        /* StitchAI-style subtle grid */
        .react-flow__background {
          opacity: 0.4;
        }
      `}</style>
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
        elevateEdgesOnSelect={false}
      >
        {/* DARK-MODE AWARE MARKERS */}
        <ErdMarkers />

        {/* BACKGROUND - StitchAI style subtle grid */}
        <Background
          color={darkMode ? '#6366f1' : '#94a3b8'}
          gap={24}
          size={1}
          style={{ opacity: darkMode ? 0.15 : 0.3 }}
        />

        {/* CONTROLS - Glassmorphism style */}
        <Controls
          className="
            /* MAIN BOX STYLING - Glassmorphism */
            !backdrop-blur-xl
            !bg-white/80 dark:!bg-slate-900/60 
            !border !border-white/20 dark:!border-slate-700/50 
            !shadow-xl !m-4
            !rounded-xl

            /* BUTTON STYLING */
            [&>button]:!bg-transparent
            [&>button]:!border-b 
            [&>button]:!border-gray-200/50 dark:[&>button]:!border-slate-700/50
            
            /* ICON COLORS */
            [&>button]:!fill-indigo-600 dark:[&>button]:!fill-indigo-400
            
            /* HOVER STATES */
            [&>button:hover]:!bg-gray-100/50 
            dark:[&>button:hover]:!bg-slate-800/50
            
            /* Last button border fix */
            [&>button:last-child]:!border-b-0
          "
        />

        {/* MINIMAP - Glassmorphism style */}
        <MiniMap
          style={{
            backgroundColor: darkMode ? 'rgba(15, 10, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            border: darkMode ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #e5e7eb',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
          }}
          maskColor={darkMode ? 'rgba(15, 10, 30, 0.6)' : 'rgba(240, 242, 245, 0.6)'}
          nodeColor={(n) =>
            n.type === 'entityNode'
              ? '#06b6d4' // Cyan for entities
              : n.type === 'attributeNode'
                ? '#a855f7' // Purple for attributes
                : n.type === 'relationshipNode'
                  ? '#f59e0b' // Amber for relationships
                  : '#10b981' // Emerald for ISA
          }
        />

        {/* Right-Side Add Node Panel - Glassmorphism */}
        <Panel position="top-right" className="space-x-2">
          <div className="
            flex flex-col gap-2 
            backdrop-blur-xl
            bg-white/80 dark:bg-slate-900/60 
            p-4 rounded-xl 
            shadow-xl 
            border border-white/20 dark:border-slate-700/50 
            transition-all duration-300
          ">
            <div className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Add Node</div>

            {/* Auto Layout */}
            <button
              onClick={autoLayout}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 mb-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Auto Layout
            </button>

            <div className="border-b border-white/20 dark:border-slate-700/50 my-2"></div>

            {/* Entity */}
            <button
              onClick={() => addNode('entityNode')}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Entity
            </button>

            {/* Attribute */}
            <button
              onClick={() => addNode('attributeNode')}
              className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Attribute
            </button>

            {/* Relationship */}
            <button
              onClick={() => addNode('relationshipNode')}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02]"
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