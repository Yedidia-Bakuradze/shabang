/**
 * Two-Pass Auto Layout Algorithm for ERD Diagrams
 * 
 * Phase 1: Main Skeleton (Hierarchical Layout)
 *   - Layout only Entity and Relationship nodes using custom hierarchical algorithm
 *   - Increased spacing for breathing room
 * 
 * Phase 2: Satellite Attachment (Math-based)
 *   - Attach Attributes to their parent nodes in a grid
 *   - Handle orphan nodes separately
 * 
 * Phase 3: Edge & Cleanup
 *   - Handle disconnected elements in grid layout
 */

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

const ENTITY_WIDTH = 150;
const ENTITY_HEIGHT = 60;
const RELATIONSHIP_SIZE = 90;
const ATTRIBUTE_WIDTH = 100;
const ATTRIBUTE_HEIGHT = 35;
const ISA_SIZE = 80;

// Hierarchical spacing (similar to Dagre rankSep/nodeSep)
const RANK_SEP = 180;  // Vertical spacing between ranks (entities and relationships)
const NODE_SEP = 220;  // Horizontal spacing between nodes in same rank

// Attribute grid layout
const ATTR_COLUMNS = 3;           // Max attributes per row
const ATTR_H_GAP = 110;           // Horizontal gap between attributes
const ATTR_V_GAP = 50;            // Vertical gap between attribute rows
const ATTR_PARENT_OFFSET = 80;    // Vertical offset from parent

// Orphan area
const ORPHAN_AREA_Y_OFFSET = 150; // Offset below main diagram
const ORPHAN_GRID_COLS = 4;       // Orphans per row
const ORPHAN_H_GAP = 120;
const ORPHAN_V_GAP = 80;

// Disconnected relationships area (grid at side)
const DISCONNECTED_START_Y = 100;  // Starting Y position for disconnected nodes
const DISCONNECTED_GRID_COLS = 3;
const DISCONNECTED_H_GAP = 120;
const DISCONNECTED_V_GAP = 120;

// ============================================================================
// MAIN LAYOUT FUNCTION
// ============================================================================

/**
 * Calculate the auto-layout positions for all nodes using Two-Pass Strategy
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

  // Position map to store calculated positions
  const positions = new Map();

  // ========================================================================
  // PHASE 1: Main Skeleton Layout (Hierarchical)
  // Only Entity and Relationship nodes that are CONNECTED
  // ========================================================================
  
  const { connectedEntities, connectedRelationships, disconnectedRelationships } = 
    separateConnectedNodes(entityNodes, relationshipNodes, relationshipToEntities);
  
  // Run hierarchical layout on entities and connected relationships
  if (connectedEntities.length > 0 || connectedRelationships.length > 0) {
    runHierarchicalLayout(connectedEntities, connectedRelationships, relationshipToEntities, positions);
  }

  // ========================================================================
  // PHASE 2: Satellite Attachment (Math-based Attribute Placement)
  // ========================================================================
  
  // 2a. Attach attributes to entities in a centered grid below each entity
  layoutAttributesAsGrid(entityNodes, entityToAttributes, positions, 'entity');
  
  // 2b. Attach attributes to relationships
  layoutAttributesAsGrid(relationshipNodes, relationshipToAttributes, positions, 'relationship');
  
  // 2c. Layout ISA nodes relative to their parent entities
  layoutIsaNodes(isaNodes, entityNodes, edges, positions);

  // ========================================================================
  // PHASE 3: Cleanup & Orphan Handling
  // ========================================================================
  
  // 3a. Layout disconnected relationships in a grid at top-left
  layoutDisconnectedRelationships(disconnectedRelationships, positions);
  
  // 3b. Layout orphan attributes (not connected to any parent) at bottom
  layoutOrphanNodes(attributeNodes, entityToAttributes, relationshipToAttributes, positions);

  // Apply new positions to nodes
  return nodes.map(node => {
    const newPos = positions.get(node.id);
    if (newPos) {
      return { ...node, position: newPos };
    }
    return node;
  });
}

// ============================================================================
// PHASE 1 HELPERS: Hierarchical Layout (Custom - No Dagre Dependency)
// ============================================================================

/**
 * Separate connected vs disconnected nodes
 */
function separateConnectedNodes(entityNodes, relationshipNodes, relationshipToEntities) {
  const connectedRelationships = [];
  const disconnectedRelationships = [];
  
  relationshipNodes.forEach(rel => {
    const connectedEntityIds = relationshipToEntities.get(rel.id) || [];
    if (connectedEntityIds.length > 0) {
      connectedRelationships.push(rel);
    } else {
      disconnectedRelationships.push(rel);
    }
  });
  
  // All entities are considered "connected" for the main layout
  return {
    connectedEntities: entityNodes,
    connectedRelationships,
    disconnectedRelationships
  };
}

/**
 * Run custom hierarchical layout algorithm on skeleton nodes
 * This mimics Dagre's behavior without the dependency
 * 
 * Strategy:
 * 1. Place entities in rows based on their connectivity
 * 2. Place relationships between their connected entities
 */
function runHierarchicalLayout(entityNodes, relationshipNodes, relationshipToEntities, positions) {
  if (entityNodes.length === 0) return;

  // Build adjacency: which entities are connected via relationships
  const entityAdjacency = new Map();
  entityNodes.forEach(e => entityAdjacency.set(e.id, new Set()));
  
  relationshipNodes.forEach(rel => {
    const connectedEntityIds = relationshipToEntities.get(rel.id) || [];
    // Mark all connected entities as adjacent to each other
    for (let i = 0; i < connectedEntityIds.length; i++) {
      for (let j = i + 1; j < connectedEntityIds.length; j++) {
        const a = connectedEntityIds[i];
        const b = connectedEntityIds[j];
        if (entityAdjacency.has(a)) entityAdjacency.get(a).add(b);
        if (entityAdjacency.has(b)) entityAdjacency.get(b).add(a);
      }
    }
  });

  // Assign entities to ranks using BFS from the first entity
  const entityRanks = new Map();
  const visited = new Set();
  const queue = [];
  
  // Start BFS from first entity
  if (entityNodes.length > 0) {
    queue.push({ id: entityNodes[0].id, rank: 0 });
    visited.add(entityNodes[0].id);
  }
  
  while (queue.length > 0) {
    const { id, rank } = queue.shift();
    entityRanks.set(id, rank);
    
    const neighbors = entityAdjacency.get(id) || new Set();
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ id: neighborId, rank: rank + 1 });
      }
    });
  }
  
  // Handle any unvisited entities (disconnected from the main graph)
  entityNodes.forEach(entity => {
    if (!visited.has(entity.id)) {
      entityRanks.set(entity.id, 0);
    }
  });

  // Group entities by rank
  const rankGroups = new Map();
  entityRanks.forEach((rank, entityId) => {
    if (!rankGroups.has(rank)) rankGroups.set(rank, []);
    rankGroups.get(rank).push(entityId);
  });

  // Position entities based on rank
  const startX = 100;
  const startY = 100;
  
  rankGroups.forEach((entityIds, rank) => {
    const rowWidth = entityIds.length * NODE_SEP;
    const rowStartX = startX + (rank % 2) * (NODE_SEP / 4); // Slight offset for alternating rows
    
    entityIds.forEach((entityId, index) => {
      positions.set(entityId, {
        x: rowStartX + index * NODE_SEP,
        y: startY + rank * RANK_SEP
      });
    });
  });

  // Position connected relationships between their entities
  relationshipNodes.forEach(rel => {
    const connectedEntityIds = relationshipToEntities.get(rel.id) || [];
    
    if (connectedEntityIds.length === 0) return; // Will be handled as disconnected
    
    // Calculate center point between all connected entities
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
      // Position relationship at the midpoint
      const midX = sumX / count - RELATIONSHIP_SIZE / 2;
      const midY = sumY / count - RELATIONSHIP_SIZE / 2;
      
      // Offset slightly if it would overlap with an entity
      let finalY = midY;
      if (count === 2) {
        // For binary relationships, place between the two entities vertically
        const entityYs = connectedEntityIds
          .map(id => positions.get(id)?.y)
          .filter(y => y !== undefined);
        if (entityYs.length === 2) {
          finalY = (entityYs[0] + entityYs[1]) / 2 - RELATIONSHIP_SIZE / 4;
        }
      }
      
      positions.set(rel.id, { x: midX, y: finalY });
    }
  });
}

// ============================================================================
// PHASE 2 HELPERS: Attribute Grid Layout
// ============================================================================

/**
 * Layout attributes in a centered multi-column grid below their parent
 */
function layoutAttributesAsGrid(parentNodes, parentToAttributes, positions, parentType) {
  parentNodes.forEach(parent => {
    const attrIds = parentToAttributes.get(parent.id) || [];
    if (attrIds.length === 0) return;
    
    const parentPos = positions.get(parent.id);
    if (!parentPos) return;
    
    // Calculate parent dimensions and center
    const parentWidth = parentType === 'entity' ? ENTITY_WIDTH : RELATIONSHIP_SIZE;
    const parentHeight = parentType === 'entity' ? ENTITY_HEIGHT : RELATIONSHIP_SIZE;
    const parentCenterX = parentPos.x + parentWidth / 2;
    
    // Calculate grid dimensions
    const numCols = Math.min(attrIds.length, ATTR_COLUMNS);
    const numRows = Math.ceil(attrIds.length / ATTR_COLUMNS);
    
    // Total width of attribute grid
    const gridWidth = (numCols - 1) * ATTR_H_GAP + ATTRIBUTE_WIDTH;
    const gridStartX = parentCenterX - gridWidth / 2;
    const gridStartY = parentPos.y + parentHeight + ATTR_PARENT_OFFSET;
    
    // Position each attribute in the grid
    attrIds.forEach((attrId, index) => {
      const col = index % ATTR_COLUMNS;
      const row = Math.floor(index / ATTR_COLUMNS);
      
      const x = gridStartX + col * ATTR_H_GAP;
      const y = gridStartY + row * ATTR_V_GAP;
      
      positions.set(attrId, { x, y });
    });
  });
}

/**
 * Layout ISA nodes relative to their parent entities
 */
function layoutIsaNodes(isaNodes, entityNodes, edges, positions) {
  const placedIsaNodes = new Set();
  
  isaNodes.forEach((isaNode) => {
    // Find connected parent entity via edges
    let parentEntityId = null;
    
    edges.forEach(edge => {
      if (edge.target === isaNode.id) {
        const sourceNode = entityNodes.find(e => e.id === edge.source);
        if (sourceNode) {
          parentEntityId = edge.source;
        }
      }
      if (edge.source === isaNode.id) {
        const targetNode = entityNodes.find(e => e.id === edge.target);
        if (targetNode) {
          parentEntityId = edge.target;
        }
      }
    });
    
    if (parentEntityId) {
      const parentPos = positions.get(parentEntityId);
      if (parentPos) {
        // Place ISA node below and to the right of parent
        positions.set(isaNode.id, {
          x: parentPos.x + ENTITY_WIDTH + 30,
          y: parentPos.y + ENTITY_HEIGHT / 2 - ISA_SIZE / 2
        });
        placedIsaNodes.add(isaNode.id);
        return;
      }
    }
  });
  
  // Handle orphan ISA nodes
  const orphanIsaNodes = isaNodes.filter(n => !placedIsaNodes.has(n.id));
  if (orphanIsaNodes.length > 0) {
    const existingPositions = Array.from(positions.values());
    const maxY = existingPositions.length > 0 
      ? Math.max(...existingPositions.map(p => p.y)) 
      : 100;
    
    orphanIsaNodes.forEach((isaNode, index) => {
      positions.set(isaNode.id, {
        x: 50 + (index % 3) * 120,
        y: maxY + ORPHAN_AREA_Y_OFFSET + Math.floor(index / 3) * 100
      });
    });
  }
}

// ============================================================================
// PHASE 3 HELPERS: Cleanup & Orphan Handling
// ============================================================================

/**
 * Layout disconnected relationships in a grid at the side
 */
function layoutDisconnectedRelationships(disconnectedRelationships, positions) {
  if (disconnectedRelationships.length === 0) return;
  
  // Find the right edge of existing positioned nodes
  const existingPositions = Array.from(positions.values());
  const maxX = existingPositions.length > 0 
    ? Math.max(...existingPositions.map(p => p.x)) + ENTITY_WIDTH
    : 0;
  
  // Place disconnected relationships in a grid to the right of main diagram
  const startX = maxX + 100;
  const startY = DISCONNECTED_START_Y;
  
  disconnectedRelationships.forEach((rel, index) => {
    const col = index % DISCONNECTED_GRID_COLS;
    const row = Math.floor(index / DISCONNECTED_GRID_COLS);
    
    positions.set(rel.id, {
      x: startX + col * DISCONNECTED_H_GAP,
      y: startY + row * DISCONNECTED_V_GAP
    });
  });
}

/**
 * Layout orphan attributes that are not connected to any parent
 */
function layoutOrphanNodes(attributeNodes, entityToAttributes, relationshipToAttributes, positions) {
  // Find all attribute IDs that are already positioned (have a parent)
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
  
  // Find the bottom of the diagram
  const existingPositions = Array.from(positions.values());
  const maxY = existingPositions.length > 0 
    ? Math.max(...existingPositions.map(p => p.y)) 
    : 100;
  
  // Place orphans in a "Holding Area" grid at the bottom
  const holdingAreaY = maxY + ORPHAN_AREA_Y_OFFSET + 50;
  const holdingAreaX = 50;
  
  orphanAttrs.forEach((attr, index) => {
    const col = index % ORPHAN_GRID_COLS;
    const row = Math.floor(index / ORPHAN_GRID_COLS);
    
    positions.set(attr.id, {
      x: holdingAreaX + col * ORPHAN_H_GAP,
      y: holdingAreaY + row * ORPHAN_V_GAP
    });
  });
}

// ============================================================================
// CONNECTION MAP BUILDERS
// ============================================================================

/**
 * Build a map of entity -> connected attributes
 */
function buildEntityAttributeMap(entityNodes, attributeNodes, edges) {
  const map = new Map();
  
  entityNodes.forEach(entity => {
    const connectedAttrs = [];
    
    // Check via edges
    edges.forEach(edge => {
      if (edge.data?.edgeType !== 'attribute') return;
      
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
      if (edge.data?.edgeType !== 'attribute') return;
      
      if (edge.source === rel.id) {
        const attr = attributeNodes.find(a => a.id === edge.target);
        if (attr && !connectedAttrs.includes(attr.id)) {
          connectedAttrs.push(attr.id);
        }
      }
      if (edge.target === rel.id) {
        const attr = attributeNodes.find(a => a.id === edge.source);
        if (attr && !connectedAttrs.includes(attr.id)) {
          connectedAttrs.push(attr.id);
        }
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

export default calculateAutoLayout;
