import { create } from 'zustand';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from 'reactflow';

const useFlowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  projectId: null,
  hasUnsavedChanges: false,
  selectedNodeId: null,

  setSelectedNodeId: (id) => {
    set({ selectedNodeId: id });
  },

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

  addNode: (nodeType = 'entityNode') => {
    const selectedNodeId = get().selectedNodeId;
    const selectedNode = get().nodes.find(n => n.id === selectedNodeId);
    
    const baseNode = {
      id: `node-${Date.now()}`,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100
      }
    };

    let newNode;
    switch (nodeType) {
      case 'entityNode':
        newNode = {
          ...baseNode,
          type: 'entityNode',
          data: { 
            label: 'New_Entity'
          }
        };
        break;
      case 'attributeNode':
        // If an entity is selected, make the attribute a child of that entity
        if (selectedNode && selectedNode.type === 'entityNode') {
          newNode = {
            ...baseNode,
            type: 'attributeNode',
            data: { 
              label: 'New_Attribute'
            },
            parentNode: selectedNodeId,
            extent: 'parent',
            position: {
              x: 50,
              y: 80
            }
          };
        } else {
          newNode = {
            ...baseNode,
            type: 'attributeNode',
            data: { 
              label: 'New_Attribute'
            }
          };
        }
        break;
      case 'relationshipNode':
        newNode = {
          ...baseNode,
          type: 'relationshipNode',
          data: { 
            label: 'New_Relationship'
          }
        };
        break;
      default:
        newNode = {
          ...baseNode,
          type: 'entityNode',
          data: { 
            label: 'New_Entity'
          }
        };
    }

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
  },

  updateNodeLabel: (nodeId, newLabel) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel
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
