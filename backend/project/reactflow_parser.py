"""
ReactFlow to ERD Parser
Converts ReactFlow diagram format to ERD JSON format
"""


def parse_reactflow_to_erd(reactflow_data, project_name="database"):
    """
    Parse ReactFlow format (nodes + edges) to ERD JSON format
    
    Args:
        reactflow_data: Dict with 'nodes' and 'edges' keys
        project_name: Name for the database schema
        
    Returns:
        ERD JSON dict with 'name', 'entities', and 'relationships'
    """
    if not isinstance(reactflow_data, dict) or 'nodes' not in reactflow_data:
        return None
    
    nodes = reactflow_data.get('nodes', [])
    edges = reactflow_data.get('edges', [])
    
    # Build maps of different node types
    entity_nodes = {}
    attribute_nodes = {}
    relationship_nodes = {}
    
    for node in nodes:
        node_id = node.get('id')
        node_data = node.get('data', {})
        node_type = node_data.get('nodeType')
        
        if node_type == 'entity':
            entity_nodes[node_id] = {
                "name": node_data.get('label', 'Unknown'),
                "description": node_data.get('description', ''),
                "attributes": []
            }
        elif node_type == 'attribute':
            attribute_nodes[node_id] = {
                "name": node_data.get('label', 'unknown'),
                "isPrimaryKey": node_data.get('isPrimaryKey', False),
                "isRequired": node_data.get('isRequired', True),
                "isUnique": node_data.get('isUnique', False),
                "type": node_data.get('type', 'String')
            }
        elif node_type == 'relationship':
            relationship_nodes[node_id] = {
                "label": node_data.get('label', 'Relation'),
                "relationshipType": node_data.get('relationshipType', '1:N'),
                "entityConnections": node_data.get('entityConnections', [])
            }
    
    # Map attributes to their entities based on edges
    for edge in edges:
        source = edge.get('source')
        target = edge.get('target')
        
        # Entity -> Attribute connection
        if source in entity_nodes and target in attribute_nodes:
            attr = attribute_nodes[target]
            attr_data = {
                "name": attr['name'],
                "type": attr.get('type', 'String'),
                "primary_key": attr.get('isPrimaryKey', False),
                "nullable": not attr.get('isRequired', True),
                "unique": attr.get('isUnique', False)
            }
            entity_nodes[source]['attributes'].append(attr_data)
    
    # Build primary key map (entity -> PK column name)
    entity_pk_map = {}
    for entity_id, entity_data in entity_nodes.items():
        for attr in entity_data['attributes']:
            if attr.get('primary_key'):
                entity_pk_map[entity_data['name']] = attr['name']
                break
    
    # Build ERD JSON
    erd_json = {
        "name": project_name.lower().replace(' ', '_'),
        "entities": list(entity_nodes.values()),
        "relationships": []
    }
    
    # Add relationships with primary key mapping
    for rel_id, rel_data in relationship_nodes.items():
        entity_connections = rel_data.get('entityConnections', [])
        if len(entity_connections) >= 2:
            from_entity_id = entity_connections[0]
            to_entity_id = entity_connections[1]
            
            # Get entity names
            from_entity = entity_nodes.get(from_entity_id, {}).get('name', from_entity_id)
            to_entity = entity_nodes.get(to_entity_id, {}).get('name', to_entity_id)
            
            relationship = {
                "name": rel_data['label'],
                "from_entity": from_entity,
                "to_entity": to_entity,
                "type": rel_data['relationshipType'],
                "on_delete": "CASCADE",
                "on_update": "CASCADE"
            }
            
            # Add primary key column name for FK references
            if from_entity in entity_pk_map:
                relationship['from_attribute'] = entity_pk_map[from_entity]
            if to_entity in entity_pk_map:
                relationship['to_attribute'] = entity_pk_map[to_entity]
                
            erd_json['relationships'].append(relationship)
    
    return erd_json
