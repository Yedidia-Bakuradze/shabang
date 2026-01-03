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
    attribute_nodes = {}  # Standalone attribute nodes
    
    for node in nodes:
        node_id = node.get('id')
        node_data = node.get('data', {})
        node_type = node.get('type', node_data.get('nodeType', ''))
        
        print(f"DEBUG PARSER: Node {node_id}: data={node_data}")
        
        # Check if it's an attribute node (standalone)
        if node_id.startswith('attr-') or node_type == 'attributeNode' or node_data.get('nodeType') == 'attribute':
            attribute_nodes[node_id] = {
                "label": node_data.get('label', 'unknown'),
                "isPrimaryKey": node_data.get('isPrimaryKey', False),
                "dataType": node_data.get('dataType', 'VARCHAR'),
                "allowNull": node_data.get('allowNull', True),
                "isUnique": node_data.get('isUnique', False),
            }
        # Check if it's a relationship (id starts with 'rel-' or has relationshipType)
        elif node_id.startswith('rel-') or 'relationshipType' in node_data:
            relationship_nodes[node_id] = {
                "label": node_data.get('label', 'Relation'),
                "relationshipType": node_data.get('relationshipType', '1:N'),
                "entityConnections": node_data.get('entityConnections', [])
            }
        # Check if it's an entity (id starts with 'ent-' or has entity characteristics)
        elif node_id.startswith('ent-') or (node_data.get('nodeType') == 'entity') or ('attributes' in node_data and 'relationshipType' not in node_data):
            entity_nodes[node_id] = {
                "name": node_data.get('label', 'Unknown'),
                "description": node_data.get('description', ''),
                "attributes": []
            }
            
            # Parse any inline attributes from the entity's data
            for attr in node_data.get('attributes', []):
                # Convert SQL type to logical type
                sql_type = attr.get('dataType', attr.get('type', 'VARCHAR'))
                logical_type = SQL_TO_LOGICAL_TYPE.get(sql_type.upper(), 'String')
                
                # Clean attribute name (strip whitespace including tabs)
                attr_name = attr.get('name', attr.get('label', 'unknown')).strip()
                
                attr_data = {
                    "name": attr_name,
                    "type": logical_type,
                    "primary_key": attr.get('isKey', attr.get('isPrimaryKey', False)),
                    "nullable": attr.get('allowNull', not attr.get('isRequired', True)),
                    "unique": attr.get('isUnique', False)
                }
                entity_nodes[node_id]['attributes'].append(attr_data)
    
    # Build a set of attribute IDs that are already included inline in entities
    # This prevents duplicates when we also have standalone attribute nodes
    inline_attr_ids = set()
    for node in nodes:
        node_data = node.get('data', {})
        if 'attributes' in node_data:
            for attr in node_data.get('attributes', []):
                if 'id' in attr:
                    inline_attr_ids.add(attr['id'])
    
    # Connect standalone attribute nodes to their parent entities
    # Only if they weren't already added as inline attributes
    # Method 1: By edge connections
    for edge in edges:
        source = edge.get('source', '')
        target = edge.get('target', '')
        
        # Attribute -> Entity edge
        if source in attribute_nodes and target in entity_nodes:
            # Skip if this attribute was already added inline
            if source in inline_attr_ids:
                continue
                
            attr_info = attribute_nodes[source]
            attr_name = attr_info['label'].strip()
            
            # Check if attribute already exists
            existing_names = [a['name'] for a in entity_nodes[target]['attributes']]
            if attr_name in existing_names:
                continue
                
            sql_type = attr_info.get('dataType', 'VARCHAR')
            logical_type = SQL_TO_LOGICAL_TYPE.get(sql_type.upper(), 'String')
            
            attr_data = {
                "name": attr_name,
                "type": logical_type,
                "primary_key": attr_info.get('isPrimaryKey', attr_info.get('isKey', False)),
                "nullable": attr_info.get('allowNull', True),
                "unique": attr_info.get('isUnique', False)
            }
            entity_nodes[target]['attributes'].append(attr_data)
        
        # Entity -> Attribute edge (reverse direction)
        elif source in entity_nodes and target in attribute_nodes:
            # Skip if this attribute was already added inline
            if target in inline_attr_ids:
                continue
                
            attr_info = attribute_nodes[target]
            attr_name = attr_info['label'].strip()
            
            # Check if attribute already exists
            existing_names = [a['name'] for a in entity_nodes[source]['attributes']]
            if attr_name in existing_names:
                continue
                
            sql_type = attr_info.get('dataType', 'VARCHAR')
            logical_type = SQL_TO_LOGICAL_TYPE.get(sql_type.upper(), 'String')
            
            attr_data = {
                "name": attr_name,
                "type": logical_type,
                "primary_key": attr_info.get('isPrimaryKey', attr_info.get('isKey', False)),
                "nullable": attr_info.get('allowNull', True),
                "unique": attr_info.get('isUnique', False)
            }
            entity_nodes[source]['attributes'].append(attr_data)
    
    # Method 2: By naming convention (attr-{entity_id}-{attr_id})
    for attr_id, attr_info in attribute_nodes.items():
        # Skip if this attribute was already added inline
        if attr_id in inline_attr_ids:
            continue
            
        # Parse entity ID from attribute node ID pattern: "attr-{entity_id}-{suffix}"
        if attr_id.startswith('attr-'):
            parts = attr_id.split('-')
            if len(parts) >= 3:
                # Reconstruct entity ID (e.g., "attr-ent-emp-e1" -> "ent-emp")
                entity_id = '-'.join(parts[1:-1])
                
                if entity_id in entity_nodes:
                    attr_name = attr_info['label'].strip()
                    
                    # Check if this attribute is already in the entity
                    existing_names = [a['name'] for a in entity_nodes[entity_id]['attributes']]
                    if attr_name not in existing_names:
                        sql_type = attr_info.get('dataType', 'VARCHAR')
                        logical_type = SQL_TO_LOGICAL_TYPE.get(sql_type.upper(), 'String')
                        
                        attr_data = {
                            "name": attr_name,
                            "type": logical_type,
                            "primary_key": attr_info.get('isPrimaryKey', attr_info.get('isKey', False)),
                            "nullable": attr_info.get('allowNull', True),
                            "unique": attr_info.get('isUnique', False)
                        }
                        entity_nodes[entity_id]['attributes'].append(attr_data)
    
    # Sort attributes: primary keys first
    for entity_id, entity_data in entity_nodes.items():
        entity_data['attributes'].sort(key=lambda x: (0 if x.get('primary_key') else 1))
    
    # If no primary key found in any entity, add an auto-generated 'id' column
    for entity_id, entity_data in entity_nodes.items():
        has_pk = any(attr.get('primary_key') for attr in entity_data['attributes'])
        if not has_pk and len(entity_data['attributes']) > 0:
            entity_data['attributes'].insert(0, {
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
