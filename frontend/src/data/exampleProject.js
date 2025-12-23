// src/data/exampleProject.js

export const CONCEPTUAL_EXAMPLE = {
  projectInfo: {
    name: "Enterprise System (Demo)",
    description: "A conceptual model showing Users, Employees, Projects, and Tasks with 1:1, 1:N, M:N, and Self-Referencing relationships."
  },
  entities: [
    {
      id: "ent-users",
      name: "Users",
      position: { x: 100, y: 100 },
      attributes: [
        { id: "u1", name: "user_id", isPrimaryKey: true },
        { id: "u2", name: "username", isPrimaryKey: false },
        { id: "u3", name: "email", isPrimaryKey: false }
      ]
    },
    {
      id: "ent-profile",
      name: "UserProfile",
      position: { x: 100, y: 350 },
      attributes: [
        { id: "up1", name: "profile_id", isPrimaryKey: true },
        { id: "up2", name: "bio", isPrimaryKey: false }
      ]
    },
    {
      id: "ent-emp",
      name: "Employee",
      position: { x: 500, y: 250 },
      attributes: [
        { id: "e1", name: "emp_id", isPrimaryKey: true },
        { id: "e2", name: "full_name", isPrimaryKey: false },
        { id: "e3", name: "salary", isPrimaryKey: false }
      ]
    },
    {
      id: "ent-proj",
      name: "Project",
      position: { x: 900, y: 100 },
      attributes: [
        { id: "p1", name: "proj_id", isPrimaryKey: true },
        { id: "p2", name: "title", isPrimaryKey: false },
        { id: "p3", name: "budget", isPrimaryKey: false }
      ]
    },
    {
      id: "ent-task",
      name: "Task",
      position: { x: 900, y: 400 },
      attributes: [
        { id: "t1", name: "task_id", isPrimaryKey: true },
        { id: "t2", name: "title", isPrimaryKey: false },
        { id: "t3", name: "status", isPrimaryKey: false }
      ]
    },
    {
      id: "ent-tag",
      name: "Tag",
      position: { x: 1200, y: 400 },
      attributes: [
        { id: "tg1", name: "tag_id", isPrimaryKey: true },
        { id: "tg2", name: "label", isPrimaryKey: false }
      ]
    }
  ],
  relationships: [
    { id: "r1", source: "ent-users", target: "ent-profile", type: "1:1", label: "Has Profile" },
    { id: "r2", source: "ent-emp", target: "ent-emp", type: "1:N", label: "Manages (Self)" }, // Edge Case: Recursive
    { id: "r3", source: "ent-emp", target: "ent-proj", type: "1:N", label: "Leads" },
    { id: "r4", source: "ent-proj", target: "ent-task", type: "1:N", label: "Contains" },
    { id: "r5", source: "ent-emp", target: "ent-task", type: "1:N", label: "Assigned To" },
    { id: "r6", source: "ent-task", target: "ent-tag", type: "M:N", label: "Tagged With" } // Edge Case: Direct M:N
  ]
};

/**
 * Helper to convert conceptual model to Chen Notation / Classic ERD format
 * 
 * Implements:
 * 1. Grid Layout for Entities (3 columns per row)
 * 2. Roof Layout for Attributes (Horizontal row above entity)
 * 3. Explicit Relationship Nodes (Diamonds) at midpoints
 */
export const loadExampleProject = () => {
  const nodes = [];
  const edges = [];
  
  // Layout Constants
  const GRID_SPACING_X = 600;
  const GRID_SPACING_Y = 400; // Increased vertical spacing for "Roof" layout
  const COLUMNS_PER_ROW = 3;
  
  // Attribute Layout Constants
  const ATTRIBUTE_Y_OFFSET = 150; // Fixed height above entity
  const ATTRIBUTE_SPACING_X = 80; // Horizontal spacing between attributes

  // Map to store calculated entity positions for relationship placement
  const entityPositions = {};

  // Step 1: Create Entity Nodes (Rectangles) - Grid Layout
  CONCEPTUAL_EXAMPLE.entities.forEach((entity, index) => {
    // Calculate Grid Position
    const row = Math.floor(index / COLUMNS_PER_ROW);
    const col = index % COLUMNS_PER_ROW;
    const entityX = col * GRID_SPACING_X + 100; // Add offset to start away from edge
    const entityY = row * GRID_SPACING_Y + 200; // Start lower to allow room for first row attributes

    // Store for later use
    entityPositions[entity.id] = { x: entityX, y: entityY };

    // Create the main Entity Node
    nodes.push({
      id: entity.id,
      type: 'entityNode',
      position: { x: entityX, y: entityY },
      data: {
        label: entity.name,
        shape: 'rectangle',
        nodeType: 'entity',
        attributes: entity.attributes // CRITICAL: Pass full attributes for Sidebar/Properties panel
      },
      style: {
        width: 120,
        height: 60,
        border: '2px solid #333',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        fontWeight: 'bold'
      }
    });

    // Step 2: Create Attribute Nodes (Ellipses) - Roof Layout
    const totalAttributes = entity.attributes.length;
    
    if (totalAttributes > 0) {
      // Calculate total width required for the attribute row
      const totalWidth = (totalAttributes - 1) * ATTRIBUTE_SPACING_X;
      // Start X is centered relative to the entity
      const startX = entityX - (totalWidth / 2);

      entity.attributes.forEach((attr, attrIndex) => {
        const attributeNodeId = `attr-${entity.id}-${attr.id}`;
        
        // Calculate position: Horizontal row above entity
        const attrX = startX + (attrIndex * ATTRIBUTE_SPACING_X);
        const attrY = entityY - ATTRIBUTE_Y_OFFSET;

        // Create Attribute Node
        nodes.push({
          id: attributeNodeId,
          type: 'attributeNode',
          position: { x: attrX, y: attrY },
          data: {
            label: attr.name,
            shape: 'ellipse',
            nodeType: 'attribute',
            isPrimaryKey: attr.isPrimaryKey
          }
        });

        // Connect Attribute to Entity
        edges.push({
          id: `edge-${entity.id}-${attributeNodeId}`,
          source: entity.id,
          target: attributeNodeId,
          type: 'default', // Use default edge to ensure rendering
          style: { stroke: '#94a3b8', strokeWidth: 1 }
        });
      });
    }
  });

  // Step 3: Create Relationship Nodes (Diamonds) - Explicit Intermediate Nodes
  CONCEPTUAL_EXAMPLE.relationships.forEach((rel) => {
    const sourcePos = entityPositions[rel.source];
    const targetPos = entityPositions[rel.target];

    if (sourcePos && targetPos) {
      const relationshipNodeId = `rel-${rel.id}`;
      
      // Calculate midpoint
      let midX = (sourcePos.x + targetPos.x) / 2;
      let midY = (sourcePos.y + targetPos.y) / 2;

      // Handle Self-Referencing (Source == Target)
      if (rel.source === rel.target) {
        midX = sourcePos.x + 200;
        midY = sourcePos.y;
      }

      // Create Relationship Node (Diamond)
      nodes.push({
        id: relationshipNodeId,
        type: 'relationshipNode',
        position: { x: midX, y: midY },
        data: {
          label: rel.label,
          shape: 'diamond',
          nodeType: 'relationship',
          relationshipType: rel.type, // Store the type (1:1, 1:N, M:N)
          entityConnections: [rel.source, rel.target], // CRITICAL: Track connected entities for Sidebar
          attributes: [] // M:N relationships can have attributes
        }
      });
      
      // Edge 1: Source -> Diamond
      edges.push({
        id: `edge-${rel.source}-${relationshipNodeId}`,
        source: rel.source,
        target: relationshipNodeId,
        label: rel.type.startsWith('M') || rel.type === 'M:N' ? 'M' : '1',
        type: 'default', // Use default edge
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      });

      // Edge 2: Diamond -> Target
      edges.push({
        id: `edge-${relationshipNodeId}-${rel.target}`,
        source: relationshipNodeId,
        target: rel.target,
        label: rel.type.endsWith('N') || rel.type === 'M:N' ? 'N' : '1',
        type: 'default', // Use default edge
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      });
    }
  });

  return {
    name: CONCEPTUAL_EXAMPLE.projectInfo.name,
    description: CONCEPTUAL_EXAMPLE.projectInfo.description,
    entities: {
      nodes,
      edges
    }
  };
};
