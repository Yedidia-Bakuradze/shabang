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
    // Determine edge type based on source handle
    const isAttributeEdge = connection.sourceHandle === 'handle-attributes';
    
    const newEdge = {
      ...connection,
      type: 'erdEdge',
      data: { 
        edgeType: isAttributeEdge ? 'attribute' : 'relationship',
        sourceCardinality: 'ONE', 
        targetCardinality: isAttributeEdge ? 'ONE' : 'MANY'
      }
    };
    set({
      edges: addEdge(newEdge, get().edges),
      hasUnsavedChanges: true
    });
  },

  addNode: (nodeType = 'entityNode') => {
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
            label: 'New_Entity',
            attributes: []
          }
        };
        break;
      case 'attributeNode':
        newNode = {
          ...baseNode,
          type: 'attributeNode',
          data: { 
            label: 'New_Attribute',
            isKey: false
          }
        };
        break;
      case 'relationshipNode':
        newNode = {
          ...baseNode,
          type: 'relationshipNode',
          data: { 
            label: 'New_Relationship',
            connections: [],
            attributes: []
          }
        };
        break;
      case 'isaNode':
        newNode = {
          ...baseNode,
          type: 'isaNode',
          data: { 
            label: 'ISA',
            isDisjoint: false,
            isTotal: false
          }
        };
        break;
      default:
        newNode = {
          ...baseNode,
          type: 'entityNode',
          data: { 
            label: 'New_Entity',
            attributes: []
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
  },

  // Add attribute to entity - spawns a new AttributeNode
  addAttributeToEntity: (entityId, attributeData) => {
    const entity = get().nodes.find(n => n.id === entityId);
    if (!entity) return;

    const attributeId = `attr-${Date.now()}`;
    const existingAttributes = entity.data.attributes || [];
    
    // Calculate position near the entity
    const offsetX = (existingAttributes.length % 3) * 150;
    const offsetY = Math.floor(existingAttributes.length / 3) * 100 + 100;

    // Create new attribute node
    const newAttributeNode = {
      id: attributeId,
      type: 'attributeNode',
      position: {
        x: entity.position.x + offsetX,
        y: entity.position.y + offsetY
      },
      data: {
        label: attributeData.name || 'New_Attribute',
        isKey: attributeData.isKey || false,
        entityId: entityId
      }
    };

    // Create edge connecting entity to attribute (simple line, no markers)
    const newEdge = {
      id: `edge-${entityId}-${attributeId}`,
      source: entityId,
      sourceHandle: 'handle-attributes',
      target: attributeId,
      type: 'erdEdge',
      animated: false,
      data: {
        edgeType: 'attribute', // Mark as attribute edge for simple styling
        sourceCardinality: 'ONE',
        targetCardinality: 'ONE'
      }
    };

    // Update entity's attribute list
    const updatedAttributes = [
      ...existingAttributes,
      {
        id: attributeId,
        name: attributeData.name || 'New_Attribute',
        isKey: attributeData.isKey || false
      }
    ];

    set({
      nodes: [
        ...get().nodes.map(node => 
          node.id === entityId 
            ? { ...node, data: { ...node.data, attributes: updatedAttributes } }
            : node
        ),
        newAttributeNode
      ],
      edges: [...get().edges, newEdge],
      hasUnsavedChanges: true
    });
  },

  // Update attribute in entity's list and sync with node
  updateEntityAttribute: (entityId, attributeId, attributeData) => {
    const entity = get().nodes.find(n => n.id === entityId);
    if (!entity) return;

    const updatedAttributes = entity.data.attributes.map(attr => 
      attr.id === attributeId ? { ...attr, ...attributeData } : attr
    );

    set({
      nodes: get().nodes.map(node => {
        if (node.id === entityId) {
          return { ...node, data: { ...node.data, attributes: updatedAttributes } };
        }
        if (node.id === attributeId) {
          return { 
            ...node, 
            data: { 
              ...node.data, 
              label: attributeData.name,
              isKey: attributeData.isKey 
            } 
          };
        }
        return node;
      }),
      hasUnsavedChanges: true
    });
  },

  // Remove attribute from entity
  removeEntityAttribute: (entityId, attributeId) => {
    const entity = get().nodes.find(n => n.id === entityId);
    if (!entity) return;

    const updatedAttributes = entity.data.attributes.filter(attr => attr.id !== attributeId);

    set({
      nodes: get().nodes
        .filter(node => node.id !== attributeId)
        .map(node => 
          node.id === entityId 
            ? { ...node, data: { ...node.data, attributes: updatedAttributes } }
            : node
        ),
      edges: get().edges.filter(edge => 
        edge.source !== attributeId && edge.target !== attributeId
      ),
      hasUnsavedChanges: true
    });
  },

  // Update relationship connections
  updateRelationshipConnections: (relationshipId, connections) => {
    const relationship = get().nodes.find(n => n.id === relationshipId);
    if (!relationship) return;

    // Map cardinality values from UI to marker format
    const mapCardinality = (value) => {
      switch(value) {
        case '1': return 'ONE';
        case 'N': case 'M': return 'MANY';
        case '0..1': return 'ZERO_ONE';
        case '1..N': return 'ZERO_MANY';
        default: return 'ONE';
      }
    };

    // Determine if this is an identifying relationship
    const isIdentifying = connections.some(conn => conn.isIdentifying);

    // Remove old edges connected to this relationship
    const filteredEdges = get().edges.filter(edge => 
      edge.source !== relationshipId && edge.target !== relationshipId
    );

    // Group connections by entityId to detect recursive relationships
    const entityConnectionMap = new Map();
    connections.filter(conn => conn.entityId).forEach(conn => {
      if (!entityConnectionMap.has(conn.entityId)) {
        entityConnectionMap.set(conn.entityId, []);
      }
      entityConnectionMap.get(conn.entityId).push(conn);
    });

    // Generate edges with smart handle positioning
    const newEdges = [];
    let edgeIndex = 0;

    entityConnectionMap.forEach((conns, entityId) => {
      if (conns.length === 1) {
        // Standard connection
        const conn = conns[0];
        newEdges.push({
          id: `edge-${entityId}-${relationshipId}-${Date.now()}-${edgeIndex++}`,
          source: entityId,
          sourceHandle: 'handle-relations-right',
          target: relationshipId,
          type: 'erdEdge',
          animated: false,
          data: {
            edgeType: 'relationship',
            sourceCardinality: mapCardinality(conn.cardinality),
            targetCardinality: 'ONE',
            role: conn.role || null,
            isIdentifying: conn.isIdentifying || false
          }
        });
      } else if (conns.length > 1) {
        // Recursive relationship - use different handles for each role
        const handles = ['handle-relations-right', 'handle-relations-top', 'handle-relations-left'];
        conns.forEach((conn, idx) => {
          newEdges.push({
            id: `edge-${entityId}-${relationshipId}-${Date.now()}-${edgeIndex++}`,
            source: entityId,
            sourceHandle: handles[idx % handles.length],
            target: relationshipId,
            type: 'erdEdge',
            animated: false,
            data: {
              edgeType: 'relationship',
              sourceCardinality: mapCardinality(conn.cardinality),
              targetCardinality: 'ONE',
              role: conn.role || `Role ${idx + 1}`,
              isIdentifying: conn.isIdentifying || false,
              isRecursive: true
            }
          });
        });
      }
    });

    set({
      nodes: get().nodes.map(node => 
        node.id === relationshipId
          ? { ...node, data: { ...node.data, connections, isIdentifying } }
          : node
      ),
      edges: [...filteredEdges, ...newEdges],
      hasUnsavedChanges: true
    });
  },

  // Get all entity nodes
  getEntityNodes: () => {
    return get().nodes.filter(node => node.type === 'entityNode');
  },

  // Update edge data (useful for cardinality changes)
  updateEdgeData: (edgeId, newData) => {
    set({
      edges: get().edges.map(edge =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, ...newData } }
          : edge
      ),
      hasUnsavedChanges: true
    });
  }
}));

export default useFlowStore;
