import React from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap 
} from 'reactflow';
import 'reactflow/dist/style.css';
import useFlowStore from '../store/useFlowStore';

const EditorCanvas = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect 
  } = useFlowStore();

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default EditorCanvas;
