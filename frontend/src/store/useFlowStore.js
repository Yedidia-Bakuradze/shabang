import { create } from 'zustand';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from 'reactflow';

const initialNodes = [
  {
    id: '1',
    type: 'default',
    data: { label: 'Entity 1' },
    position: { x: 250, y: 100 }
  }
];

const useFlowStore = create((set, get) => ({
  nodes: initialNodes,
  edges: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges)
    });
  },

  addNode: () => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'default',
      data: { label: 'New Entity' },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100
      }
    };
    set({
      nodes: [...get().nodes, newNode]
    });
  }
}));

export default useFlowStore;
