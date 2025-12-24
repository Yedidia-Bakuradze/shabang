"""
ReactFlow to ERD Parser
Converts ReactFlow diagram format to ERD JSON format
"""

# SQL type to logical type mapping
SQL_TO_LOGICAL_TYPE = {
    'VARCHAR': 'String',
    'TEXT': 'Text',
    'CHAR': 'String',
    'INT': 'Integer',
    'INTEGER': 'Integer',
    'BIGINT': 'Long',
    'SMALLINT': 'Integer',
    'DECIMAL': 'Decimal',
    'NUMERIC': 'Decimal',
    'FLOAT': 'Float',
    'DOUBLE': 'Float',
    'REAL': 'Float',
    'BOOLEAN': 'Boolean',
    'BOOL': 'Boolean',
    'DATE': 'Date',
    'TIME': 'Time',
    'TIMESTAMP': 'DateTime',
    'DATETIME': 'DateTime',
    'JSON': 'JSON',
    'JSONB': 'JSON',
    'BLOB': 'Binary',
    'BYTEA': 'Binary',
}


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
    
    print(f"DEBUG PARSER: Processing {len(nodes)} nodes and {len(edges)} edges")
    
    # Build maps of different node types
    entity_nodes = {}
    relationship_nodes = {}
    
    for node in nodes:
        node_id = node.get('id')
        node_data = node.get('data', {})
        
        print(f"DEBUG PARSER: Node {node_id}: data={node_data}")
        
        # Check if it's a relationship (id starts with 'rel-' or has relationshipType)
        if node_id.startswith('rel-') or 'relationshipType' in node_data:
            relationship_nodes[node_id] = {
                "label": node_data.get('label', 'Relation'),
                "relationshipType": node_data.get('relationshipType', '1:N'),
                "entityConnections": node_data.get('entityConnections', [])
            }
        # Check if it's an entity (has attributes array and is not a relationship)
        elif 'attributes' in node_data and 'relationshipType' not in node_data:
            entity_nodes[node_id] = {
                "name": node_data.get('label', 'Unknown'),
                "description": node_data.get('description', ''),
                "attributes": []
            }
            
            # Parse attributes from the entity's data
            for attr in node_data.get('attributes', []):
                # Convert SQL type to logical type
                sql_type = attr.get('dataType', attr.get('type', 'VARCHAR'))
                logical_type = SQL_TO_LOGICAL_TYPE.get(sql_type.upper(), 'String')
                
                attr_data = {
                    "name": attr.get('name', attr.get('label', 'unknown')),
                    "type": logical_type,
                    "primary_key": attr.get('isKey', attr.get('isPrimaryKey', False)),
                    "nullable": attr.get('allowNull', not attr.get('isRequired', True)),
                    "unique": attr.get('isUnique', False)
                }
                entity_nodes[node_id]['attributes'].append(attr_data)
            
            # If no primary key found, add an auto-generated 'id' column
            has_pk = any(attr.get('primary_key') for attr in entity_nodes[node_id]['attributes'])
            if not has_pk:
                entity_nodes[node_id]['attributes'].insert(0, {
                    "name": "id",
                    "type": "Integer",
                    "primary_key": True,
                    "nullable": False,
                    "unique": True
                })
    
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
