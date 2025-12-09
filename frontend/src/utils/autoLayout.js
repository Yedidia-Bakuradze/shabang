/**
 * Auto Layout Algorithm for ERD Diagrams
 * 
 * This algorithm arranges ERD elements in a clean, readable layout:
 * 1. Entities are placed in a grid pattern
 * 2. Relationships are placed between connected entities
 * 3. Attributes are arranged in a "roof" pattern below their parent
 */

// Layout Constants - Updated for smaller nodes
const ENTITY_WIDTH = 120;
const ENTITY_HEIGHT = 40;
const ENTITY_HORIZONTAL_GAP = 250;
const ENTITY_VERTICAL_GAP = 200;
const ENTITIES_PER_ROW = 4;

const RELATIONSHIP_SIZE = 80;
const ATTRIBUTE_WIDTH = 90;
const ATTRIBUTE_HEIGHT = 30;

const ATTRIBUTE_HORIZONTAL_GAP = 100;
const ATTRIBUTE_VERTICAL_OFFSET = 80;

/**
 * Calculate the auto-layout positions for all nodes
 * @param {Array} nodes - Array of ReactFlow nodes
 * @param {Array} edges - Array of ReactFlow edges
 * @returns {Array} - Nodes with updated positions
 */
export function calculateAutoLayout(nodes, edges) {
  if (!nodes || nodes.length === 0) return nodes;

  // Separate nodes by type
  const entityNodes = nodes.filter(n => n.type === 'entityNode');
  const relationshipNodes = nodes.filter(n => n.type === 'relationshipNode');
  const attributeNodes = nodes.filter(n => n.type === 'attributeNode');
  const isaNodes = nodes.filter(n => n.type === 'isaNode');

  // Build connection maps
  const entityToAttributes = buildEntityAttributeMap(entityNodes, attributeNodes, edges);
  const relationshipToAttributes = buildRelationshipAttributeMap(relationshipNodes, attributeNodes, edges);
  const relationshipToEntities = buildRelationshipEntityMap(relationshipNodes, edges);

  // Calculate new positions
  const newPositions = new Map();

  // 1. Layout Entities in a grid
  layoutEntitiesInGrid(entityNodes, newPositions);

  // 2. Layout Relationships between their connected entities
  layoutRelationships(relationshipNodes, relationshipToEntities, newPositions);

  // 3. Layout Attributes below their parents (entities or relationships)
  layoutAttributes(entityNodes, entityToAttributes, newPositions, 'entity');
  layoutAttributes(relationshipNodes, relationshipToAttributes, newPositions, 'relationship');

  // 4. Layout ISA nodes (if any)
  layoutIsaNodes(isaNodes, entityNodes, edges, newPositions);

  // 5. Handle orphan attributes (not connected to anything)
  layoutOrphanAttributes(attributeNodes, entityToAttributes, relationshipToAttributes, newPositions);

  // Apply new positions to nodes
  return nodes.map(node => {
    const newPos = newPositions.get(node.id);
    if (newPos) {
      return { ...node, position: newPos };
    }
    return node;
  });
}

/**
 * Build a map of entity -> connected attributes
 */
function buildEntityAttributeMap(entityNodes, attributeNodes, edges) {
  const map = new Map();
  
  entityNodes.forEach(entity => {
    const connectedAttrs = [];
    
    // Check via edges
    edges.forEach(edge => {
      const isEntitySource = edge.source === entity.id;
      const isEntityTarget = edge.target === entity.id;
      
      if (isEntitySource) {
        const attr = attributeNodes.find(a => a.id === edge.target);
        if (attr && !connectedAttrs.includes(attr.id)) {
          connectedAttrs.push(attr.id);
        }
      }
      if (isEntityTarget) {
        const attr = attributeNodes.find(a => a.id === edge.source);
        if (attr && !connectedAttrs.includes(attr.id)) {
          connectedAttrs.push(attr.id);
        }
      }
    });
    
    // Also check entity's data.attributes
    if (entity.data.attributes) {
      entity.data.attributes.forEach(attr => {
        if (!connectedAttrs.includes(attr.id)) {
          connectedAttrs.push(attr.id);
        }
      });
    }
    
    map.set(entity.id, connectedAttrs);
  });
  
  return map;
}

/**
 * Build a map of relationship -> connected attributes
 */
function buildRelationshipAttributeMap(relationshipNodes, attributeNodes, edges) {
  const map = new Map();
  
  relationshipNodes.forEach(rel => {
    const connectedAttrs = [];
    
    edges.forEach(edge => {
      if (edge.source === rel.id) {
        const attr = attributeNodes.find(a => a.id === edge.target);
        if (attr) connectedAttrs.push(attr.id);
      }
      if (edge.target === rel.id) {
        const attr = attributeNodes.find(a => a.id === edge.source);
        if (attr) connectedAttrs.push(attr.id);
      }
    });
    
    // Also check relationship's data.attributes
    if (rel.data.attributes) {
      rel.data.attributes.forEach(attr => {
        if (!connectedAttrs.includes(attr.id)) {
          connectedAttrs.push(attr.id);
        }
      });
    }
    
    map.set(rel.id, connectedAttrs);
  });
  
  return map;
}

/**
 * Build a map of relationship -> connected entities
 */
function buildRelationshipEntityMap(relationshipNodes, edges) {
  const map = new Map();
  
  relationshipNodes.forEach(rel => {
    // First check data.entityConnections
    if (rel.data.entityConnections && rel.data.entityConnections.length > 0) {
      map.set(rel.id, [...rel.data.entityConnections]);
      return;
    }
    
    // Fallback to edges
    const connectedEntities = [];
    edges.forEach(edge => {
      if (edge.data?.edgeType === 'relationship') {
        if (edge.source === rel.id && !connectedEntities.includes(edge.target)) {
          connectedEntities.push(edge.target);
        }
        if (edge.target === rel.id && !connectedEntities.includes(edge.source)) {
          connectedEntities.push(edge.source);
        }
      }
    });
    
    map.set(rel.id, connectedEntities);
  });
  
  return map;
}

/**
 * Layout entities in a grid pattern
 */
function layoutEntitiesInGrid(entityNodes, positions) {
  const startX = 100;
  const startY = 100;
  
  entityNodes.forEach((entity, index) => {
    const row = Math.floor(index / ENTITIES_PER_ROW);
    const col = index % ENTITIES_PER_ROW;
    
    const x = startX + col * ENTITY_HORIZONTAL_GAP;
    const y = startY + row * ENTITY_VERTICAL_GAP;
    
    positions.set(entity.id, { x, y });
  });
}

/**
 * Layout relationships between their connected entities
 */
function layoutRelationships(relationshipNodes, relationshipToEntities, positions) {
  relationshipNodes.forEach(rel => {
    const connectedEntityIds = relationshipToEntities.get(rel.id) || [];
    
    if (connectedEntityIds.length === 0) {
      // Orphan relationship - place it somewhere reasonable
      const existingPositions = Array.from(positions.values());
      const maxY = existingPositions.length > 0 
        ? Math.max(...existingPositions.map(p => p.y)) 
        : 100;
      positions.set(rel.id, { x: 100, y: maxY + 100 });
      return;
    }
    
    // Calculate midpoint between connected entities
    let sumX = 0, sumY = 0, count = 0;
    
    connectedEntityIds.forEach(entityId => {
      const entityPos = positions.get(entityId);
      if (entityPos) {
        sumX += entityPos.x + ENTITY_WIDTH / 2;
        sumY += entityPos.y + ENTITY_HEIGHT / 2;
        count++;
      }
    });
    
    if (count > 0) {
      const midX = sumX / count - RELATIONSHIP_SIZE / 2;
      const midY = sumY / count - RELATIONSHIP_SIZE / 2;
      positions.set(rel.id, { x: midX, y: midY });
    }
  });
}

/**
 * Layout attributes in a "roof" pattern below their parent
 */
function layoutAttributes(parentNodes, parentToAttributes, positions, parentType) {
  parentNodes.forEach(parent => {
    const attrIds = parentToAttributes.get(parent.id) || [];
    if (attrIds.length === 0) return;
    
    const parentPos = positions.get(parent.id);
    if (!parentPos) return;
    
    const parentCenterX = parentPos.x + (parentType === 'entity' ? ENTITY_WIDTH / 2 : RELATIONSHIP_SIZE / 2);
    const startY = parentPos.y + (parentType === 'entity' ? ENTITY_HEIGHT : RELATIONSHIP_SIZE) + ATTRIBUTE_VERTICAL_OFFSET;
    
    // Spread attributes in a row below the parent
    const totalWidth = (attrIds.length - 1) * ATTRIBUTE_HORIZONTAL_GAP;
    const startX = parentCenterX - totalWidth / 2 - ATTRIBUTE_WIDTH / 2;
    
    attrIds.forEach((attrId, index) => {
      const x = startX + index * ATTRIBUTE_HORIZONTAL_GAP;
      const y = startY;
      
      positions.set(attrId, { x, y });
    });
  });
}

/**
 * Layout ISA (inheritance) nodes
 */
function layoutIsaNodes(isaNodes, entityNodes, edges, positions) {
  isaNodes.forEach((isaNode, index) => {
    // Find connected parent entity via edges
    let parentEntityId = null;
    
    edges.forEach(edge => {
      if (edge.target === isaNode.id) {
        const sourceNode = entityNodes.find(e => e.id === edge.source);
        if (sourceNode) {
          parentEntityId = edge.source;
        }
      }
    });
    
    if (parentEntityId) {
      const parentPos = positions.get(parentEntityId);
      if (parentPos) {
        // Place ISA node below and slightly to the right of parent
        positions.set(isaNode.id, {
          x: parentPos.x + 50,
          y: parentPos.y + ENTITY_HEIGHT + 80
        });
        return;
      }
    }
    
    // Fallback position for orphan ISA nodes
    const existingPositions = Array.from(positions.values());
    const maxX = existingPositions.length > 0 
      ? Math.max(...existingPositions.map(p => p.x)) 
      : 100;
    positions.set(isaNode.id, { x: maxX + 150, y: 100 + index * 150 });
  });
}

/**
 * Layout orphan attributes (not connected to any entity or relationship)
 */
function layoutOrphanAttributes(attributeNodes, entityToAttributes, relationshipToAttributes, positions) {
  // Find all attribute IDs that are already positioned
  const positionedAttrIds = new Set();
  
  entityToAttributes.forEach(attrIds => {
    attrIds.forEach(id => positionedAttrIds.add(id));
  });
  
  relationshipToAttributes.forEach(attrIds => {
    attrIds.forEach(id => positionedAttrIds.add(id));
  });
  
  // Find orphan attributes
  const orphanAttrs = attributeNodes.filter(attr => !positionedAttrIds.has(attr.id));
  
  if (orphanAttrs.length === 0) return;
  
  // Place orphans in a row at the bottom
  const existingPositions = Array.from(positions.values());
  const maxY = existingPositions.length > 0 
    ? Math.max(...existingPositions.map(p => p.y)) 
    : 100;
  
  orphanAttrs.forEach((attr, index) => {
    if (!positions.has(attr.id)) {
      positions.set(attr.id, {
        x: 100 + index * 150,
        y: maxY + 200
      });
    }
  });
}

export default calculateAutoLayout;
