"""
Normalization Views
API endpoints for ERD schema normalization (proxy to schema-engine service)
"""

import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Project
from .reactflow_parser import parse_reactflow_to_erd
from erd_to_dsd import transform_erd_to_sql


class NormalizeSchemaView(APIView):
    """
    POST: Normalize a project's schema to BCNF or 3NF
    
    Request body:
    {
        "normalization_type": "BCNF" | "3NF",
        "functional_dependencies": [
            {"determinant": ["attr1", "attr2"], "dependent": ["attr3"]},
            ...
        ],
        "entities": {...}  // Optional: current canvas data, otherwise uses saved project data
    }
    
    Response:
    {
        "success": true,
        "original": { "tables": [...] },
        "normalized": { "tables": [...] },
        "changes": [...],
        "normalization_type": "BCNF",
        "violations_found": [...],
        "is_already_normalized": false
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        try:
            # Get the project
            project = Project.objects.get(id=project_id)
            
            # Check if user is the owner
            if project.owner.id != request.user.id:
                return Response(
                    {"success": False, "error": "You don't have permission to access this project"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get normalization parameters
            normalization_type = request.data.get('normalization_type', 'BCNF')
            functional_dependencies = request.data.get('functional_dependencies', [])
            
            if not functional_dependencies:
                return Response(
                    {"success": False, "error": "No functional dependencies provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get ERD data (from request body or from project.entities)
            erd_data = request.data.get('entities') or project.entities
            
            if not erd_data:
                return Response(
                    {"success": False, "error": "No ERD data found. Please create some entities first."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse ReactFlow format to ERD JSON if needed
            if isinstance(erd_data, dict) and 'nodes' in erd_data:
                erd_json = parse_reactflow_to_erd(erd_data, project.name)
                if not erd_json:
                    return Response(
                        {"success": False, "error": "Failed to parse diagram data"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif isinstance(erd_data, dict) and 'entities' in erd_data:
                erd_json = erd_data
            else:
                return Response(
                    {"success": False, "error": "Invalid data format."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # First, transform ERD to DSD to get table structure
            dsd_result = transform_erd_to_sql(
                erd_json,
                dialect='postgresql',
                validate=True,
                include_drop=False
            )
            
            if not dsd_result['success']:
                return Response(
                    {
                        "success": False,
                        "error": "Failed to generate DSD from ERD",
                        "errors": dsd_result.get('errors', [])
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Serialize DSD for the normalization service
            dsd_dict = self._serialize_dsd(dsd_result['dsd'])
            
            # Call schema-engine normalization service
            schema_engine_url = getattr(settings, 'SCHEMA_ENGINE_URL', 'http://schema-engine:8001')
            
            try:
                response = requests.post(
                    f"{schema_engine_url}/api/normalize/",
                    json={
                        'dsd': dsd_dict,
                        'normalization_type': normalization_type,
                        'functional_dependencies': functional_dependencies
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return Response(result)
                else:
                    error_data = response.json() if response.content else {}
                    return Response(
                        {
                            "success": False,
                            "error": error_data.get('error', 'Normalization service error')
                        },
                        status=response.status_code
                    )
                    
            except requests.exceptions.ConnectionError:
                return Response(
                    {"success": False, "error": "Could not connect to normalization service"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            except requests.exceptions.Timeout:
                return Response(
                    {"success": False, "error": "Normalization service timeout"},
                    status=status.HTTP_504_GATEWAY_TIMEOUT
                )
            
        except Project.DoesNotExist:
            return Response(
                {"success": False, "error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _serialize_dsd(self, dsd):
        """Serialize DSD object to dictionary"""
        dsd_dict = {
            "name": dsd.name,
            "description": dsd.description,
            "tables": []
        }
        
        for table in dsd.tables:
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
        
        return dsd_dict


class CheckNormalizationView(APIView):
    """
    POST: Check the normalization level of a project's schema
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
            
            if project.owner.id != request.user.id:
                return Response(
                    {"success": False, "error": "Permission denied"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            functional_dependencies = request.data.get('functional_dependencies', [])
            erd_data = request.data.get('entities') or project.entities
            
            if not erd_data:
                return Response(
                    {"success": False, "error": "No ERD data found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse and transform
            if isinstance(erd_data, dict) and 'nodes' in erd_data:
                erd_json = parse_reactflow_to_erd(erd_data, project.name)
            else:
                erd_json = erd_data
            
            dsd_result = transform_erd_to_sql(erd_json, dialect='postgresql', validate=True)
            
            if not dsd_result['success']:
                return Response(
                    {"success": False, "error": "Failed to generate DSD"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Serialize DSD
            dsd_dict = NormalizeSchemaView()._serialize_dsd(dsd_result['dsd'])
            
            # Call check endpoint
            schema_engine_url = getattr(settings, 'SCHEMA_ENGINE_URL', 'http://schema-engine:8001')
            
            try:
                response = requests.post(
                    f"{schema_engine_url}/api/check/",
                    json={
                        'dsd': dsd_dict,
                        'functional_dependencies': functional_dependencies
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    return Response(response.json())
                else:
                    return Response(
                        {"success": False, "error": "Check service error"},
                        status=response.status_code
                    )
                    
            except requests.exceptions.RequestException as e:
                return Response(
                    {"success": False, "error": f"Service error: {str(e)}"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
        except Project.DoesNotExist:
            return Response(
                {"success": False, "error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
