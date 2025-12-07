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
        targetCardinality: isAttributeEdge ? 'ONE' : 'MANY',
        relationshipType: isAttributeEdge ? null : '1:N' // Default relationship type
      }
    };

    // AUTO-INJECT FOREIGN KEY FOR 1:N RELATIONSHIPS
    if (!isAttributeEdge) {
      const sourceNode = get().nodes.find(n => n.id === connection.source);
      const targetNode = get().nodes.find(n => n.id === connection.target);
      
      if (sourceNode && targetNode && sourceNode.type === 'entityNode' && targetNode.type === 'entityNode') {
        // Determine relationship type based on cardinality
        const relType = newEdge.data.relationshipType;
        
        if (relType === '1:N') {
          // Child (Many side) gets FK referencing Parent (One side)
          const childEntityId = connection.target;
          const parentEntityName = sourceNode.data.label;
          const fkName = `${parentEntityName.toLowerCase()}_id`;
          
          // Check if FK already exists
          const childEntity = get().nodes.find(n => n.id === childEntityId);
          const existingFk = childEntity?.data.attributes?.find(attr => 
            attr.isForeignKey && attr.referencedEntity === parentEntityName
          );
          
          if (!existingFk) {
            // Inject FK into child entity
            get().addForeignKeyToEntity(childEntityId, {
              name: fkName,
              isKey: false,
              isForeignKey: true,
              referencedEntity: parentEntityName
            });
          }
        }
      }
    }

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

    // Determine relationship type based on cardinalities
    const determineRelationshipType = (cardinalityA, cardinalityB) => {
      const isAMany = cardinalityA === 'MANY' || cardinalityA === 'ZERO_MANY';
      const isBMany = cardinalityB === 'MANY' || cardinalityB === 'ZERO_MANY';
      
      if (isAMany && isBMany) return 'M:N';
      if (isAMany || isBMany) return '1:N';
      return '1:1';
    };

    // Get previous connections to detect changes
    const prevConnections = relationship.data.connections || [];

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

    // AUTOMATIC FOREIGN KEY INJECTION & REMOVAL
    const entities = Array.from(entityConnectionMap.keys());
    if (entities.length === 2) {
      const [entityAId, entityBId] = entities;
      const connA = entityConnectionMap.get(entityAId)[0];
      const connB = entityConnectionMap.get(entityBId)[0];
      
      const cardA = mapCardinality(connA.cardinality);
      const cardB = mapCardinality(connB.cardinality);
      const relType = determineRelationshipType(cardA, cardB);

      // Get previous relationship type if exists
      const prevEntityMap = new Map();
      prevConnections.filter(conn => conn.entityId).forEach(conn => {
        if (!prevEntityMap.has(conn.entityId)) {
          prevEntityMap.set(conn.entityId, []);
        }
        prevEntityMap.get(conn.entityId).push(conn);
      });

      let prevRelType = null;
      if (prevEntityMap.size === 2) {
        const prevEntities = Array.from(prevEntityMap.keys());
        if (prevEntities.includes(entityAId) && prevEntities.includes(entityBId)) {
          const prevConnA = prevEntityMap.get(entityAId)[0];
          const prevConnB = prevEntityMap.get(entityBId)[0];
          const prevCardA = mapCardinality(prevConnA.cardinality);
          const prevCardB = mapCardinality(prevConnB.cardinality);
          prevRelType = determineRelationshipType(prevCardA, prevCardB);
        }
      }

      // Handle FK based on relationship type change
      if (relType === '1:N') {
        // Inject FK into "Many" side
        const isAMany = cardA === 'MANY' || cardA === 'ZERO_MANY';
        const childId = isAMany ? entityAId : entityBId;
        const parentId = isAMany ? entityBId : entityAId;
        const parentEntity = get().nodes.find(n => n.id === parentId);
        
        if (parentEntity) {
          const fkName = `${parentEntity.data.label.toLowerCase()}_id`;
          const childEntity = get().nodes.find(n => n.id === childId);
          const existingFk = childEntity?.data.attributes?.find(attr =>
            attr.isForeignKey && attr.referencedEntity === parentEntity.data.label
          );
          
          if (!existingFk) {
            get().addForeignKeyToEntity(childId, {
              name: fkName,
              referencedEntity: parentEntity.data.label
            });
          }

          // Remove FK from the other side if it was previously Many
          if (prevRelType === '1:N') {
            const otherEntity = get().nodes.find(n => n.id === parentId);
            const childEntityData = get().nodes.find(n => n.id === childId);
            if (otherEntity && childEntityData) {
              get().removeForeignKeyFromEntity(parentId, childEntityData.data.label);
            }
          }
        }
      } else if (relType === '1:1' && prevRelType === '1:N') {
        // Changed from 1:N to 1:1 - remove FKs from both sides
        const entityA = get().nodes.find(n => n.id === entityAId);
        const entityB = get().nodes.find(n => n.id === entityBId);
        
        if (entityA && entityB) {
          get().removeForeignKeyFromEntity(entityAId, entityB.data.label);
          get().removeForeignKeyFromEntity(entityBId, entityA.data.label);
        }
      } else if (relType === 'M:N') {
        // Remove any existing FKs and show warning about junction table
        const entityA = get().nodes.find(n => n.id === entityAId);
        const entityB = get().nodes.find(n => n.id === entityBId);
        
        if (entityA && entityB) {
          get().removeForeignKeyFromEntity(entityAId, entityB.data.label);
          get().removeForeignKeyFromEntity(entityBId, entityA.data.label);
        }

        const suggestion = get().detectAndSuggestJunctionTable(entityAId, entityBId);
        if (suggestion) {
          console.warn(suggestion.message);
        }
      }
    }

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
  },

  // Add Foreign Key to Entity (for 1:N relationships)
  addForeignKeyToEntity: (entityId, fkData) => {
    const entity = get().nodes.find(n => n.id === entityId);
    if (!entity || entity.type !== 'entityNode') return;

    const existingAttributes = entity.data.attributes || [];
    const fkAttribute = {
      id: `fk-${Date.now()}`,
      name: fkData.name,
      isKey: false,
      isForeignKey: true,
      referencedEntity: fkData.referencedEntity
    };

    set({
      nodes: get().nodes.map(node =>
        node.id === entityId
          ? { ...node, data: { ...node.data, attributes: [...existingAttributes, fkAttribute] } }
          : node
      ),
      hasUnsavedChanges: true
    });
  },

  // Remove Foreign Key from Entity
  removeForeignKeyFromEntity: (entityId, referencedEntityName) => {
    const entity = get().nodes.find(n => n.id === entityId);
    if (!entity || entity.type !== 'entityNode') return;

    const updatedAttributes = (entity.data.attributes || []).filter(attr => 
      !(attr.isForeignKey && attr.referencedEntity === referencedEntityName)
    );

    set({
      nodes: get().nodes.map(node =>
        node.id === entityId
          ? { ...node, data: { ...node.data, attributes: updatedAttributes } }
          : node
      ),
      hasUnsavedChanges: true
    });
  },

  // Detect Many-to-Many and suggest Junction Table
  detectAndSuggestJunctionTable: (entityAId, entityBId) => {
    const entityA = get().nodes.find(n => n.id === entityAId);
    const entityB = get().nodes.find(n => n.id === entityBId);
    
    if (!entityA || !entityB) return null;

    // Check if there's already an M:N edge between these entities
    const existingManyToMany = get().edges.find(edge => {
      const isAtoB = edge.source === entityAId && edge.target === entityBId;
      const isBtoA = edge.source === entityBId && edge.target === entityAId;
      const isManyToMany = edge.data?.sourceCardinality === 'MANY' && edge.data?.targetCardinality === 'MANY';
      return (isAtoB || isBtoA) && isManyToMany;
    });

    if (existingManyToMany) {
      // Return junction table suggestion
      const junctionTableName = `${entityA.data.label}_${entityB.data.label}`;
      return {
        suggestedName: junctionTableName,
        attributes: [
          { name: `${entityA.data.label.toLowerCase()}_id`, isKey: true, isForeignKey: true, referencedEntity: entityA.data.label },
          { name: `${entityB.data.label.toLowerCase()}_id`, isKey: true, isForeignKey: true, referencedEntity: entityB.data.label }
        ],
        message: `Many-to-Many relationship detected! Create a junction table "${junctionTableName}" with composite primary key.`
      };
    }

    return null;
  }
}));

export default useFlowStore;
