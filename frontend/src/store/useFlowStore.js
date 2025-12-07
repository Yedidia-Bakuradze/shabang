import { create } from 'zustand';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from 'reactflow';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 5 }
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
  }
}));

export default useFlowStore;
