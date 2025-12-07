import { create } from 'zustand';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from 'reactflow';

const initialNodes = [
  {
    id: '1',
    type: 'entityNode',
    data: { 
      label: 'Users',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'email', type: 'VARCHAR' },
        { name: 'password', type: 'VARCHAR' }
      ]
    },
    position: { x: 250, y: 100 }
  }
];

const useFlowStore = create((set, get) => ({
  nodes: initialNodes,
  edges: [],
  projectId: null,
  hasUnsavedChanges: false,

  setProjectId: (id) => {
    set({ projectId: id });
  },

  loadProjectData: (entities) => {
    if (entities && entities.nodes && entities.edges) {
      set({ 
        nodes: entities.nodes,
        edges: entities.edges,
        hasUnsavedChanges: false
      });
    }
  },

  getCanvasData: () => {
    return {
      nodes: get().nodes,
      edges: get().edges
    };
  },

  markAsSaved: () => {
    set({ hasUnsavedChanges: false });
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      hasUnsavedChanges: true
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      hasUnsavedChanges: true
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
      hasUnsavedChanges: true
    });
  },

  addNode: () => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'entityNode',
      data: { 
        label: 'New_Table',
        columns: []
      },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100
      }
    };
    set({
      nodes: [...get().nodes, newNode],
      hasUnsavedChanges: true
    });
  },

  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData
            }
          };
        }
        return node;
      }),
      hasUnsavedChanges: true
    });
  }
}));

export default useFlowStore;
