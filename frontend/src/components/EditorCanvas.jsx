import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow // Keep this import
} from 'reactflow';

import 'reactflow/dist/style.css';

import useFlowStore from '../store/useFlowStore';
import { useTheme } from '../context/ThemeContext';

import { EntityNode, AttributeNode, RelationshipNode, IsANode } from './Flow/ConceptualNodes';
import DSDTableNode from './Flow/DSDTableNode';
import ErdEdge from './Flow/ErdEdge';
import ErdMarkers from './Flow/ErdMarkers';

// --- FIXED COMPONENT ---
const NavigationMiniMap = ({ darkMode }) => {
  // 1. We use 'getNodes' instead of 'getNodesBounds' to be safe across versions
  const { getNodes, setCenter } = useReactFlow();

  const onMiniMapClick = useCallback((event) => {
    const mmRect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - mmRect.left;
    const clickY = event.clientY - mmRect.top;

    // 2. Manual Bounds Calculation (Polyfill for getNodesBounds)
    const nodes = getNodes();
    if (!nodes || nodes.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      const x = node.position.x;
      const y = node.position.y;
      // Fallback dimensions if node isn't measured yet (prevents crashes)
      const w = node.width || node.style?.width || 150;
      const h = node.height || node.style?.height || 50;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + w > maxX) maxX = x + w;
      if (y + h > maxY) maxY = y + h;
    });

    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    if (bounds.width === 0 || bounds.height === 0) return;

    // 3. Standard Logic continues...
    const mmWidth = mmRect.width;
    const mmHeight = mmRect.height;
    const boundsRatio = bounds.width / bounds.height;
    const mmRatio = mmWidth / mmHeight;

    let scale, offsetX, offsetY;

    if (boundsRatio > mmRatio) {
      scale = mmWidth / bounds.width;
      offsetY = (mmHeight - (bounds.height * scale)) / 2;
      offsetX = 0;
    } else {
      scale = mmHeight / bounds.height;
      offsetX = (mmWidth - (bounds.width * scale)) / 2;
      offsetY = 0;
    }

    const targetX = (clickX - offsetX) / scale + bounds.x;
    const targetY = (clickY - offsetY) / scale + bounds.y;

    setCenter(targetX, targetY, { zoom: 1, duration: 800 });
  }, [getNodes, setCenter]);

  return (
    <MiniMap
      onClick={onMiniMapClick}
      zoomable
      pannable
      style={{
        backgroundColor: darkMode ? 'rgba(15, 10, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        border: darkMode ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #e5e7eb',
        borderRadius: '12px',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer'
      }}
      maskColor={darkMode ? 'rgba(15, 10, 30, 0.6)' : 'rgba(240, 242, 245, 0.6)'}
      nodeColor={(n) =>
        n.type === 'entityNode'
          ? '#06b6d4'
          : n.type === 'attributeNode'
            ? '#a855f7'
            : n.type === 'relationshipNode'
              ? '#f59e0b'
              : '#10b981'
      }
    />
  );
};

const EditorCanvas = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
    autoLayout,
    viewMode,
    setViewMode,
    dsdNodes,
    dsdEdges,
    dsdData
  } = useFlowStore();

  const proOptions = { hideAttribution: true };
  const { darkMode } = useTheme();

  // Determine which nodes/edges to display based on view mode
  const displayNodes = viewMode === 'dsd' ? dsdNodes : nodes;
  const displayEdges = viewMode === 'dsd' ? dsdEdges : edges;

  // Register custom node types
  const nodeTypes = useMemo(() => ({
    entityNode: EntityNode,
    attributeNode: AttributeNode,
    relationshipNode: RelationshipNode,
    isaNode: IsANode,
    dsdTableNode: DSDTableNode
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
        /* Theme-aware DSD Edge Styling */
        ${darkMode ? `
          /* Dark Mode: Light edges with low opacity */
          .dsd-fk-edge {
            stroke: #e2e8f0 !important;
            opacity: 0.7;
          }
          .dsd-fk-edge path {
            stroke: #e2e8f0 !important;
          }
          .dsd-fk-edge polygon {
            fill: #e2e8f0 !important;
            stroke: #e2e8f0 !important;
          }
          .react-flow__edge.dsd-fk-edge .react-flow__edge-path {
            stroke: #e2e8f0 !important;
          }
          .react-flow__edge.dsd-fk-edge marker path,
          .react-flow__edge.dsd-fk-edge marker polygon {
            fill: #e2e8f0 !important;
            stroke: #e2e8f0 !important;
          }
          .dsd-fk-label {
            fill: #e2e8f0 !important;
          }
          .dsd-fk-label-bg {
            fill: rgba(15, 23, 42, 0.9) !important;
          }
        ` : `
          /* Light Mode: Dark edges */
          .dsd-fk-edge {
            stroke: #1e293b !important;
            opacity: 1;
          }
          .dsd-fk-edge path {
            stroke: #1e293b !important;
          }
          .dsd-fk-edge polygon {
            fill: #1e293b !important;
            stroke: #1e293b !important;
          }
          .react-flow__edge.dsd-fk-edge .react-flow__edge-path {
            stroke: #1e293b !important;
          }
          .react-flow__edge.dsd-fk-edge marker path,
          .react-flow__edge.dsd-fk-edge marker polygon {
            fill: #1e293b !important;
            stroke: #1e293b !important;
          }
          .dsd-fk-label {
            fill: #1e293b !important;
          }
          .dsd-fk-label-bg {
            fill: rgba(255, 255, 255, 0.95) !important;
          }
        `}
        
        /* StitchAI-style subtle grid */
        .react-flow__background {
          opacity: 0.4;
        }
      `}</style>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}  // Allow position changes in both modes
        onEdgesChange={viewMode === 'erd' ? onEdgesChange : undefined}
        onConnect={viewMode === 'erd' ? onConnect : undefined}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        deleteKeyCode={viewMode === 'erd' ? ['Backspace', 'Delete'] : []}  // Disable delete in DSD mode
        colorMode={darkMode ? 'dark' : 'light'}
        elevateEdgesOnSelect={false}
        minZoom={0.05}
        proOptions={proOptions}
      >
        <ErdMarkers />

        <Background
          color={darkMode ? '#6366f1' : '#94a3b8'}
          gap={24}
          size={1}
          style={{ opacity: darkMode ? 0.3 : 0.3 }}
        />

        <Controls
          className="
            !backdrop-blur-xl
            !bg-white/80 dark:!bg-slate-900/60 
            !border !border-white/20 dark:!border-slate-700/50 
            !shadow-xl !m-4
            !rounded-xl
            [&>button]:!bg-transparent
            [&>button]:!border-b 
            [&>button]:!border-gray-200/50 dark:[&>button]:!border-slate-700/50
            [&>button]:!fill-indigo-600 dark:[&>button]:!fill-indigo-400
            [&>button:hover]:!bg-gray-100/50 
            dark:[&>button:hover]:!bg-slate-800/50
            [&>button:last-child]:!border-b-0
          "
        />

        {/* Custom MiniMap with Fix */}
        <NavigationMiniMap darkMode={darkMode} />

        {/* View Mode Toggle - Bottom Left */}
        <Panel position="bottom-left" className="m-4">
          <div className={`
            flex items-center gap-1 p-1 rounded-xl shadow-xl border
            backdrop-blur-xl
            ${darkMode 
              ? 'bg-slate-900/60 border-slate-700/50' 
              : 'bg-white/80 border-white/20'}
          `}>
            <button
              onClick={() => setViewMode('erd')}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2
                ${viewMode === 'erd'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : darkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'}
              `}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 9a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 11-2 0v-3H9a1 1 0 01-1-1z" />
              </svg>
              ERD View
            </button>
            <button
              onClick={() => setViewMode('dsd')}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2
                ${viewMode === 'dsd'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                  : darkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'}
              `}
              title={!dsdData ? 'DSD will be generated on first Save' : 'Switch to DSD View'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              DSD View
            </button>
          </div>
        </Panel>

        {/* Add Node Panel - Only show in ERD mode */}
        {viewMode === 'erd' && (
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
              data-testid="auto-layout-btn"
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
              data-testid="add-entity-btn"
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
              data-testid="add-attribute-btn"
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
              data-testid="add-relationship-btn"
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              Relationship
            </button>
          </div>
        </Panel>
        )}

        {/* DSD View Info Panel */}
        {viewMode === 'dsd' && (
          <Panel position="top-right" className="space-x-2">
            <div className={`
              backdrop-blur-xl p-4 rounded-xl shadow-xl border transition-all duration-300
              ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-white/20'}
            `}>
              <div className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                DSD View
              </div>
              <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                {dsdData ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{dsdData.tables?.length || 0}</span> Tables
                    </div>
                    <div className="text-xs mt-2 opacity-70">
                      Read-only view. Edit in ERD mode.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs opacity-70">
                      💡 Click <strong>Save</strong> to generate DSD
                    </div>
                  </>
                )}
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default EditorCanvas;