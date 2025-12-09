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

  setEdges: (updateFnOrEdges) => {
    const currentEdges = get().edges;
    const newEdges = typeof updateFnOrEdges === 'function'
      ? updateFnOrEdges(currentEdges)
      : updateFnOrEdges;
    set({ edges: newEdges, hasUnsavedChanges: true });
  },

  loadProjectData: (entities) => {
    // Always reset the canvas first, then load data if it exists
    if (entities && entities.nodes && entities.edges) {
      set({
        nodes: entities.nodes,
        edges: entities.edges,
        hasUnsavedChanges: false
      });
    } else {
      // Empty/new project - clear the canvas
      set({
        nodes: [],
        edges: [],
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
    const currentNodes = get().nodes;

    // Check for deletions to sync with Data
    changes.forEach(change => {
      if (change.type === 'remove') {
        const removedNode = currentNodes.find(n => n.id === change.id);

        if (removedNode && removedNode.type === 'attributeNode') {
          // Sync Entity Deletion
          const connectedEntity = currentNodes.find(n =>
            n.type === 'entityNode' &&
            n.data.attributes &&
            n.data.attributes.some(attr => attr.id === removedNode.id)
          );
          // Sync Relationship Deletion
          const connectedRel = currentNodes.find(n =>
            n.type === 'relationshipNode' &&
            n.data.attributes &&
            n.data.attributes.some(attr => attr.id === removedNode.id)
          );
          // Actual cleanup happens in post-processing map below
        }
      }
    });

    const newNodes = applyNodeChanges(changes, currentNodes);

    // POST-PROCESSING: Ensure data consistency after deletion
    const activeNodeIds = new Set(newNodes.map(n => n.id));

    const syncedNodes = newNodes.map(node => {
      // Clean Entities
      if (node.type === 'entityNode' && node.data.attributes) {
        const validAttributes = node.data.attributes.filter(attr => activeNodeIds.has(attr.id));
        if (validAttributes.length !== node.data.attributes.length) {
          return { ...node, data: { ...node.data, attributes: validAttributes } };
        }
      }
      // Clean Relationships
      if (node.type === 'relationshipNode' && node.data.attributes) {
        const validAttributes = node.data.attributes.filter(attr => activeNodeIds.has(attr.id));
        if (validAttributes.length !== node.data.attributes.length) {
          return { ...node, data: { ...node.data, attributes: validAttributes } };
        }
      }
      return node;
    });

    set({
      nodes: syncedNodes,
      hasUnsavedChanges: true
    });
  },

  onEdgesChange: (changes) => {
    const currentEdges = get().edges;
    const currentNodes = get().nodes;
    let updatedNodes = [...currentNodes];

    changes.forEach(change => {
      if (change.type === 'remove') {
        const removedEdge = currentEdges.find(e => e.id === change.id);

        if (removedEdge) {
          const sourceNode = currentNodes.find(n => n.id === removedEdge.source);
          const targetNode = currentNodes.find(n => n.id === removedEdge.target);

          if (sourceNode && targetNode) {
            // CASE 1: Entity <-> Attribute Edge Deleted
            if (
              (sourceNode.type === 'entityNode' && targetNode.type === 'attributeNode') ||
              (sourceNode.type === 'attributeNode' && targetNode.type === 'entityNode')
            ) {
              const entityNode = sourceNode.type === 'entityNode' ? sourceNode : targetNode;
              const attributeId = sourceNode.type === 'attributeNode' ? sourceNode.id : targetNode.id;
              updatedNodes = updatedNodes.map(node => node.id === entityNode.id ? {
                ...node, data: { ...node.data, attributes: (node.data.attributes || []).filter(attr => attr.id !== attributeId) }
              } : node);
            }

            // CASE 2: Relationship <-> Attribute Edge Deleted
            else if (
              (sourceNode.type === 'relationshipNode' && targetNode.type === 'attributeNode') ||
              (sourceNode.type === 'attributeNode' && targetNode.type === 'relationshipNode')
            ) {
              const relNode = sourceNode.type === 'relationshipNode' ? sourceNode : targetNode;
              const attributeId = sourceNode.type === 'attributeNode' ? sourceNode.id : targetNode.id;
              updatedNodes = updatedNodes.map(node => node.id === relNode.id ? {
                ...node, data: { ...node.data, attributes: (node.data.attributes || []).filter(attr => attr.id !== attributeId) }
              } : node);
            }

            // CASE 3: Entity <-> Relationship Edge Deleted
            else if (
              (sourceNode.type === 'entityNode' && targetNode.type === 'relationshipNode') ||
              (sourceNode.type === 'relationshipNode' && targetNode.type === 'entityNode')
            ) {
              const relNode = sourceNode.type === 'relationshipNode' ? sourceNode : targetNode;
              const entityId = sourceNode.type === 'entityNode' ? sourceNode.id : targetNode.id;
              updatedNodes = updatedNodes.map(node => node.id === relNode.id ? {
                ...node, data: { ...node.data, entityConnections: (node.data.entityConnections || []).filter(id => id !== entityId) }
              } : node);
            }
          }
        }
      }
    });

    set({
      edges: applyEdgeChanges(changes, currentEdges),
      nodes: updatedNodes,
      hasUnsavedChanges: true
    });
  },

  onConnect: (connection) => {
    const { source, target } = connection;
    const nodes = get().nodes;
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);

    if (!sourceNode || !targetNode) return;

    if (sourceNode.type === 'entityNode' && targetNode.type === 'entityNode') {
      // Smart ERD Insert
      const midX = (sourceNode.position.x + targetNode.position.x) / 2;
      const midY = (sourceNode.position.y + targetNode.position.y) / 2;
      const relationshipId = `rel-${Date.now()}`;
      const relationshipNode = { id: relationshipId, type: 'relationshipNode', position: { x: midX, y: midY }, data: { label: 'Relationship', entityConnections: [source, target], attributes: [] } };
      const edge1 = { id: `edge-${source}-${relationshipId}`, source: source, target: relationshipId, type: 'erdEdge', label: '1', data: { edgeType: 'relationship', sourceCardinality: 'ONE', targetCardinality: 'ONE' } };
      const edge2 = { id: `edge-${relationshipId}-${target}`, source: relationshipId, target: target, type: 'erdEdge', label: 'N', data: { edgeType: 'relationship', sourceCardinality: 'MANY', targetCardinality: 'ONE' } };
      set({ nodes: [...nodes, relationshipNode], edges: [...get().edges, edge1, edge2], hasUnsavedChanges: true });
    }
    else {
      let edgeData = {};
      let label = null;
      let newNodes = [...nodes];

      // Entity <-> Attribute
      if ((sourceNode.type === 'entityNode' && targetNode.type === 'attributeNode') || (sourceNode.type === 'attributeNode' && targetNode.type === 'entityNode')) {
        edgeData = { edgeType: 'attribute' };
        const entityNode = sourceNode.type === 'entityNode' ? sourceNode : targetNode;
        const attributeNode = sourceNode.type === 'attributeNode' ? sourceNode : targetNode;
        const currentAttributes = entityNode.data.attributes || [];
        if (!currentAttributes.some(attr => attr.id === attributeNode.id)) {
          const updatedEntityNode = { ...entityNode, data: { ...entityNode.data, attributes: [...currentAttributes, { id: attributeNode.id, name: attributeNode.data.label, isKey: attributeNode.data.isKey || false }] } };
          newNodes = newNodes.map(n => n.id === entityNode.id ? updatedEntityNode : n);
        }
      }
      // Relationship <-> Attribute
      else if ((sourceNode.type === 'relationshipNode' && targetNode.type === 'attributeNode') || (sourceNode.type === 'attributeNode' && targetNode.type === 'relationshipNode')) {
        edgeData = { edgeType: 'attribute' };
        const relNode = sourceNode.type === 'relationshipNode' ? sourceNode : targetNode;
        const attributeNode = sourceNode.type === 'attributeNode' ? sourceNode : targetNode;
        const currentAttributes = relNode.data.attributes || [];
        if (!currentAttributes.some(attr => attr.id === attributeNode.id)) {
          const updatedRelNode = { ...relNode, data: { ...relNode.data, attributes: [...currentAttributes, { id: attributeNode.id, name: attributeNode.data.label, isKey: false }] } };
          newNodes = newNodes.map(n => n.id === relNode.id ? updatedRelNode : n);
        }
      }
      // Attribute <-> Attribute
      else if (sourceNode.type === 'attributeNode' && targetNode.type === 'attributeNode') {
        edgeData = { edgeType: 'attribute' };
      }
      // Entity <-> Relationship
      else if ((sourceNode.type === 'entityNode' && targetNode.type === 'relationshipNode') || (sourceNode.type === 'relationshipNode' && targetNode.type === 'entityNode')) {
        edgeData = { edgeType: 'relationship', sourceCardinality: 'MANY', targetCardinality: 'ONE' };
        label = 'N';
        const relNode = sourceNode.type === 'relationshipNode' ? sourceNode : targetNode;
        const entityId = sourceNode.type === 'entityNode' ? sourceNode.id : targetNode.id;
        if (!relNode.data.entityConnections?.includes(entityId)) {
          const updatedRelNode = { ...relNode, data: { ...relNode.data, entityConnections: [...(relNode.data.entityConnections || []), entityId] } };
          newNodes = newNodes.map(n => n.id === relNode.id ? updatedRelNode : n);
        }
      }

      set({ nodes: newNodes, edges: addEdge({ ...connection, type: 'erdEdge', label: label, data: edgeData }, get().edges), hasUnsavedChanges: true });
    }
  },

  addNode: (nodeType = 'entityNode') => {
    const baseNode = { id: `node-${Date.now()}`, position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 } };
    let newNode = { ...baseNode, type: nodeType, data: { label: `New_${nodeType}`, attributes: [] } };
    if (nodeType === 'attributeNode') newNode.data = { label: 'New_Attribute', isKey: false };
    if (nodeType === 'relationshipNode') newNode.data = { label: 'New_Relationship', entityConnections: [], attributes: [] };

    set({ nodes: [...get().nodes, newNode], hasUnsavedChanges: true });
  },

  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node),
      hasUnsavedChanges: true
    });
  },

  updateNodeLabel: (nodeId, newLabel) => {
    const nodes = get().nodes;
    const targetNode = nodes.find(n => n.id === nodeId);
    let updatedNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, label: newLabel } } : node
    );

    // Sync label with Parent Data (Entity or Relationship)
    if (targetNode && targetNode.type === 'attributeNode') {
      updatedNodes = updatedNodes.map(node => {
        // Update Entity
        if (node.type === 'entityNode' && node.data.attributes?.some(attr => attr.id === nodeId)) {
          return { ...node, data: { ...node.data, attributes: node.data.attributes.map(attr => attr.id === nodeId ? { ...attr, name: newLabel } : attr) } };
        }
        // Update Relationship
        if (node.type === 'relationshipNode' && node.data.attributes?.some(attr => attr.id === nodeId)) {
          return { ...node, data: { ...node.data, attributes: node.data.attributes.map(attr => attr.id === nodeId ? { ...attr, name: newLabel } : attr) } };
        }
        return node;
      });
    }

    set({ nodes: updatedNodes, hasUnsavedChanges: true });
  },

  // --- ENTITY ATTRIBUTE ACTIONS ---
  connectAttributeToEntity: (entityId, attributeId) => {
    const entity = get().nodes.find(n => n.id === entityId);
    const attribute = get().nodes.find(n => n.id === attributeId);
    if (!entity || !attribute) return;
    if (entity.data.attributes?.some(attr => attr.id === attributeId)) return;
    const newEdge = { id: `edge-${entityId}-${attributeId}`, source: entityId, sourceHandle: 'handle-attributes', target: attributeId, type: 'erdEdge', data: { edgeType: 'attribute' } };
    const updatedAttributes = [...(entity.data.attributes || []), { id: attributeId, name: attribute.data.label, isKey: attribute.data.isKey || false }];
    set({ nodes: get().nodes.map(n => n.id === entityId ? { ...n, data: { ...n.data, attributes: updatedAttributes } } : n), edges: addEdge(newEdge, get().edges), hasUnsavedChanges: true });
  },

  disconnectAttributeFromEntity: (entityId, attributeId) => {
    const entity = get().nodes.find(n => n.id === entityId);
    if (!entity) return;
    set({
      nodes: get().nodes.map(n => n.id === entityId ? { ...n, data: { ...n.data, attributes: n.data.attributes.filter(attr => attr.id !== attributeId) } } : n),
      edges: get().edges.filter(edge => !((edge.source === entityId && edge.target === attributeId) || (edge.source === attributeId && edge.target === entityId))),
      hasUnsavedChanges: true
    });
  },

  addAttributeToEntity: (entityId, attributeData) => {
    const entity = get().nodes.find(n => n.id === entityId);
    if (!entity) return;
    const attributeId = `attr-${Date.now()}`;
    const existingAttributes = entity.data.attributes || [];
    const offsetX = (existingAttributes.length % 3) * 150;
    const offsetY = Math.floor(existingAttributes.length / 3) * 100 + 100;
    const newAttributeNode = { id: attributeId, type: 'attributeNode', position: { x: entity.position.x + offsetX, y: entity.position.y + offsetY }, data: { label: attributeData.name || 'New_Attribute', isKey: attributeData.isKey || false, entityId: entityId } };
    const newEdge = { id: `edge-${entityId}-${attributeId}`, source: entityId, sourceHandle: 'handle-attributes', target: attributeId, type: 'erdEdge', data: { edgeType: 'attribute' } };
    const updatedAttributes = [...existingAttributes, { id: attributeId, name: attributeData.name, isKey: attributeData.isKey }];
    set({ nodes: [...get().nodes.map(n => n.id === entityId ? { ...n, data: { ...n.data, attributes: updatedAttributes } } : n), newAttributeNode], edges: [...get().edges, newEdge], hasUnsavedChanges: true });
  },

  updateEntityAttribute: (entityId, attributeId, attributeData) => {
    const entity = get().nodes.find(n => n.id === entityId);
    if (!entity) return;
    const updatedAttributes = entity.data.attributes.map(attr => attr.id === attributeId ? { ...attr, ...attributeData } : attr);
    const nodes = get().nodes.map(node => {
      if (node.id === entityId) return { ...node, data: { ...node.data, attributes: updatedAttributes } };
      if (node.id === attributeId) {
        let newData = { ...node.data };
        if (attributeData.name) newData.label = attributeData.name;
        if (attributeData.isKey !== undefined) newData.isKey = attributeData.isKey;
        return { ...node, data: newData };
      }
      return node;
    });
    set({ nodes: nodes, hasUnsavedChanges: true });
  },

  removeEntityAttribute: (entityId, attributeId) => {
    const entity = get().nodes.find(n => n.id === entityId);
    if (!entity) return;
    set({
      nodes: get().nodes.filter(n => n.id !== attributeId).map(n => n.id === entityId ? { ...n, data: { ...n.data, attributes: n.data.attributes.filter(a => a.id !== attributeId) } } : n),
      edges: get().edges.filter(e => e.source !== attributeId && e.target !== attributeId),
      hasUnsavedChanges: true
    });
  },

  // --- RELATIONSHIP CONNECTIONS ---
  connectEntityToRelationship: (relationshipId, entityId) => {
    const relNode = get().nodes.find(n => n.id === relationshipId);
    if (!relNode || relNode.data.entityConnections?.includes(entityId)) return;
    const newEdgeId = `edge-${entityId}-${relationshipId}-${Date.now()}`;
    const newEdge = { id: newEdgeId, source: entityId, sourceHandle: 'handle-relations-right', target: relationshipId, type: 'erdEdge', label: 'N', data: { edgeType: 'relationship', sourceCardinality: 'MANY', targetCardinality: 'ONE', role: null } };
    set({
      nodes: get().nodes.map(n => n.id === relationshipId ? { ...n, data: { ...n.data, entityConnections: [...(n.data.entityConnections || []), entityId] } } : n),
      edges: [...get().edges, newEdge],
      hasUnsavedChanges: true
    });
  },

  disconnectEntityFromRelationship: (relationshipId, entityId) => {
    const relNode = get().nodes.find(n => n.id === relationshipId);
    if (!relNode) return;
    set({
      nodes: get().nodes.map(n => n.id === relationshipId ? { ...n, data: { ...n.data, entityConnections: (n.data.entityConnections || []).filter(id => id !== entityId) } } : n),
      edges: get().edges.filter(e => !((e.source === entityId && e.target === relationshipId) || (e.source === relationshipId && e.target === entityId))),
      hasUnsavedChanges: true
    });
  },

  // --- RELATIONSHIP ATTRIBUTE ACTIONS ---
  connectAttributeToRelationship: (relationshipId, attributeId) => {
    const rel = get().nodes.find(n => n.id === relationshipId);
    const attribute = get().nodes.find(n => n.id === attributeId);
    if (!rel || !attribute) return;
    if (rel.data.attributes?.some(attr => attr.id === attributeId)) return;
    const newEdge = { id: `edge-${relationshipId}-${attributeId}`, source: relationshipId, target: attributeId, type: 'erdEdge', data: { edgeType: 'attribute' } };
    const updatedAttributes = [...(rel.data.attributes || []), { id: attributeId, name: attribute.data.label, isKey: false }];
    set({ nodes: get().nodes.map(n => n.id === relationshipId ? { ...n, data: { ...n.data, attributes: updatedAttributes } } : n), edges: addEdge(newEdge, get().edges), hasUnsavedChanges: true });
  },

  disconnectAttributeFromRelationship: (relationshipId, attributeId) => {
    const rel = get().nodes.find(n => n.id === relationshipId);
    if (!rel) return;
    set({
      nodes: get().nodes.map(n => n.id === relationshipId ? { ...n, data: { ...n.data, attributes: n.data.attributes.filter(attr => attr.id !== attributeId) } } : n),
      edges: get().edges.filter(edge => !((edge.source === relationshipId && edge.target === attributeId) || (edge.source === attributeId && edge.target === relationshipId))),
      hasUnsavedChanges: true
    });
  },

  addAttributeToRelationship: (relationshipId, attributeData) => {
    const relNode = get().nodes.find(n => n.id === relationshipId);
    if (!relNode) return;
    const attributeId = `attr-rel-${Date.now()}`;
    const existingAttributes = relNode.data.attributes || [];
    const offsetX = (existingAttributes.length % 2 === 0 ? 1 : -1) * 120;
    const offsetY = (Math.floor(existingAttributes.length / 2) + 1) * 120;
    const newAttributeNode = { id: attributeId, type: 'attributeNode', position: { x: relNode.position.x + offsetX, y: relNode.position.y + offsetY }, data: { label: attributeData.name || 'Rel_Attribute', isKey: false, parentId: relationshipId } };
    const newEdge = { id: `edge-${relationshipId}-${attributeId}`, source: relationshipId, target: attributeId, type: 'erdEdge', data: { edgeType: 'attribute' } };
    const updatedAttributes = [...existingAttributes, { id: attributeId, name: attributeData.name || 'Rel_Attribute' }];
    set({
      nodes: [...get().nodes.map(n => n.id === relationshipId ? { ...n, data: { ...n.data, attributes: updatedAttributes } } : n), newAttributeNode],
      edges: [...get().edges, newEdge],
      hasUnsavedChanges: true
    });
  },

  updateRelationshipAttribute: (relationshipId, attributeId, attributeData) => {
    const rel = get().nodes.find(n => n.id === relationshipId);
    if (!rel) return;
    const updatedAttributes = rel.data.attributes.map(attr => attr.id === attributeId ? { ...attr, ...attributeData } : attr);
    const nodes = get().nodes.map(node => {
      if (node.id === relationshipId) return { ...node, data: { ...node.data, attributes: updatedAttributes } };
      if (node.id === attributeId && attributeData.name) return { ...node, data: { ...node.data, label: attributeData.name } };
      return node;
    });
    set({ nodes: nodes, hasUnsavedChanges: true });
  },

  removeRelationshipAttribute: (relationshipId, attributeId) => {
    const relNode = get().nodes.find(n => n.id === relationshipId);
    if (!relNode) return;
    set({
      nodes: get().nodes.filter(n => n.id !== attributeId).map(n => n.id === relationshipId ? { ...n, data: { ...n.data, attributes: n.data.attributes.filter(a => a.id !== attributeId) } } : n),
      edges: get().edges.filter(e => e.source !== attributeId && e.target !== attributeId),
      hasUnsavedChanges: true
    });
  },

  getEntityNodes: () => { return get().nodes.filter(node => node.type === 'entityNode'); },
  updateEdgeCardinality: (edgeId, cardinalityValue) => {
    const mapCardinality = (value) => { switch (value) { case '1': return 'ONE'; case 'N': case 'M': return 'MANY'; default: return 'ONE'; } };
    set({ edges: get().edges.map(e => { if (e.id === edgeId) { return { ...e, label: cardinalityValue, data: { ...e.data, sourceCardinality: mapCardinality(cardinalityValue) } }; } return e; }), hasUnsavedChanges: true });
  }
}));

export default useFlowStore;