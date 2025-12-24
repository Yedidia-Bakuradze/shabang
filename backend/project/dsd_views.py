"""
DSD Generation Views
API endpoints for ERD to DSD transformation
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Project
from .reactflow_parser import parse_reactflow_to_erd
from erd_to_dsd import transform_erd_to_sql


class GenerateDSDView(APIView):
    """
    POST: Generate DSD (Data Structure Diagram) from ERD and return SQL script
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, req, project_id):
        """Transform ERD to DSD and generate SQL"""
        try:
            # Get the project
            project = Project.objects.get(id=project_id)
            
            # Check if user is the owner
            if project.owner.id != req.user.id:
                return Response(
                    {"error": "You don't have permission to access this project"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get ERD data (from request body or from project.entities)
            erd_data = req.data.get('entities') or project.entities
            
            print(f"DEBUG: ERD data type: {type(erd_data)}")
            print(f"DEBUG: ERD data keys: {erd_data.keys() if isinstance(erd_data, dict) else 'Not a dict'}")
            if isinstance(erd_data, dict) and 'nodes' in erd_data:
                print(f"DEBUG: Number of nodes: {len(erd_data.get('nodes', []))}")
                print(f"DEBUG: Number of edges: {len(erd_data.get('edges', []))}")
            
            if not erd_data:
                return Response(
                    {"error": "No ERD data found. Please create some entities first."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get transformation parameters
            dialect = req.data.get('dialect', 'postgresql')
            validate = req.data.get('validate', True)
            include_drop = req.data.get('include_drop', False)
            
            # Parse ReactFlow format to ERD JSON
            if isinstance(erd_data, dict) and 'nodes' in erd_data:
                print(f"DEBUG: Parsing ReactFlow format...")
                erd_json = parse_reactflow_to_erd(erd_data, project.name)
                print(f"DEBUG: Parsed ERD JSON: {erd_json}")
                if not erd_json:
                    return Response(
                        {"error": "Failed to parse diagram data"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif isinstance(erd_data, dict) and 'entities' in erd_data:
                # Already in ERD format
                erd_json = erd_data
            else:
                return Response(
                    {"error": "Invalid data format. Expected ReactFlow or ERD format."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if there are any entities to transform
            print(f"DEBUG: Entities in ERD JSON: {len(erd_json.get('entities', []))}")
            if not erd_json.get('entities') or len(erd_json['entities']) == 0:
                return Response(
                    {"error": "No entities found. Please create some entities first."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Transform ERD to SQL
            result = transform_erd_to_sql(
                erd_json,
                dialect=dialect,
                validate=validate,
                include_drop=include_drop
            )
            
            print(f"DEBUG: Transform result success: {result.get('success')}")
            print(f"DEBUG: Transform errors: {result.get('errors')}")
            
            if not result['success']:
                return Response(
                    {
                        "success": False,
                        "errors": result['errors'],
                        "message": "Failed to generate DSD"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Serialize DSD for JSON response
            dsd_dict = None
            if result['dsd']:
                dsd_dict = {
                    "name": result['dsd'].name,
                    "description": result['dsd'].description,
                    "tables": []
                }
                
                for table in result['dsd'].tables:
                    table_dict = {
                        "name": table.name,
                        "description": table.description,
                        "columns": [],
                        "constraints": [],
                        "indexes": []
                    }
                    
                    # Add columns
                    for col in table.columns:
                        col_dict = {
                            "name": col.name,
                            "sql_type": col.sql_type,
                            "nullable": col.nullable,
                            "unique": col.unique,
                            "auto_increment": col.auto_increment,
                            "default_value": col.default_value,
                            "description": col.description
                        }
                        table_dict['columns'].append(col_dict)
                    
                    # Add constraints
                    for constraint in (table.constraints or []):
                        constraint_dict = {
                            "name": constraint.name,
                            "type": constraint.type.name if hasattr(constraint.type, 'name') else str(constraint.type),
                            "columns": constraint.columns,
                        }
                        if hasattr(constraint, 'referenced_table') and constraint.referenced_table:
                            constraint_dict['referenced_table'] = constraint.referenced_table
                            constraint_dict['referenced_columns'] = constraint.referenced_columns
                            constraint_dict['on_delete'] = constraint.on_delete
                            constraint_dict['on_update'] = constraint.on_update
                        
                        table_dict['constraints'].append(constraint_dict)
                    
                    # Add indexes
                    for index in (table.indexes or []):
                        index_dict = {
                            "name": index.name,
                            "columns": index.columns,
                            "unique": index.unique
                        }
                        table_dict['indexes'].append(index_dict)
                    
                    dsd_dict['tables'].append(table_dict)
            
            return Response(
                {
                    "success": True,
                    "sql": result['sql'],
                    "dsd": dsd_dict,
                    "validation": result['validation'],
                    "dialect": dialect
                },
                status=status.HTTP_200_OK
            )
            
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                    "message": "An error occurred while generating DSD"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
