"""
Normalization Views
API endpoints for database schema normalization
"""
import json
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .fd_parser import parse_fd_string, parse_fd_list, FunctionalDependency
from .algorithms import normalize_schema, check_normalization_level, Table


@method_decorator(csrf_exempt, name='dispatch')
class NormalizeView(View):
    """
    POST: Normalize a DSD schema to BCNF or 3NF
    
    Request body:
    {
        "dsd": {
            "name": "database_name",
            "tables": [...]
        },
        "normalization_type": "BCNF" | "3NF",
        "functional_dependencies": [
            {"determinant": ["A", "B"], "dependent": ["C", "D"]},
            ...
        ] OR "A, B -> C, D; E -> F"  (string format)
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
    
    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON in request body'
            }, status=400)
        
        # Validate required fields
        dsd = data.get('dsd')
        if not dsd:
            return JsonResponse({
                'success': False,
                'error': 'Missing required field: dsd'
            }, status=400)
        
        normalization_type = data.get('normalization_type', 'BCNF').upper()
        if normalization_type not in ['BCNF', '3NF']:
            return JsonResponse({
                'success': False,
                'error': 'normalization_type must be "BCNF" or "3NF"'
            }, status=400)
        
        # Parse functional dependencies
        fd_input = data.get('functional_dependencies', [])
        
        try:
            if isinstance(fd_input, str):
                fds = parse_fd_string(fd_input)
            elif isinstance(fd_input, list):
                fds = parse_fd_list(fd_input)
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'functional_dependencies must be a string or list'
                }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to parse functional dependencies: {str(e)}'
            }, status=400)
        
        if not fds:
            return JsonResponse({
                'success': False,
                'error': 'No valid functional dependencies provided'
            }, status=400)
        
        # Validate FD attributes against DSD columns
        all_columns = set()
        for table in dsd.get('tables', []):
            for col in table.get('columns', []):
                all_columns.add(col.get('name', ''))
        
        invalid_attrs = []
        for fd in fds:
            for attr in fd.determinant:
                if attr not in all_columns:
                    invalid_attrs.append(attr)
            for attr in fd.dependent:
                if attr not in all_columns:
                    invalid_attrs.append(attr)
        
        if invalid_attrs:
            unique_invalid = list(set(invalid_attrs))
            invalid_list = ', '.join(unique_invalid)
            return JsonResponse({
                'success': False,
                'error': f'Unknown attributes in functional dependencies: {invalid_list}',
                'invalid_attributes': unique_invalid,
                'available_attributes': list(all_columns)
            }, status=400)
        
        # Perform normalization
        try:
            result = normalize_schema(dsd, fds, normalization_type)
            return JsonResponse(result.to_dict())
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Normalization failed: {str(e)}'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class CheckNormalizationView(View):
    """
    POST: Check the normalization level of a DSD schema
    
    Request body:
    {
        "dsd": {
            "tables": [...]
        },
        "functional_dependencies": [...]
    }
    
    Response:
    {
        "success": true,
        "tables": {
            "table_name": {
                "is_bcnf": false,
                "is_3nf": true,
                "bcnf_violations": [...],
                "3nf_violations": [...],
                "candidate_keys": [...]
            }
        }
    }
    """
    
    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON in request body'
            }, status=400)
        
        dsd = data.get('dsd')
        if not dsd:
            return JsonResponse({
                'success': False,
                'error': 'Missing required field: dsd'
            }, status=400)
        
        # Parse functional dependencies
        fd_input = data.get('functional_dependencies', [])
        
        try:
            if isinstance(fd_input, str):
                fds = parse_fd_string(fd_input)
            elif isinstance(fd_input, list):
                fds = parse_fd_list(fd_input)
            else:
                fds = []
        except Exception:
            fds = []
        
        # Check each table
        results = {}
        for table_dict in dsd.get('tables', []):
            table = Table.from_dict(table_dict)
            check_result = check_normalization_level(table, fds)
            results[table.name] = check_result
        
        return JsonResponse({
            'success': True,
            'tables': results
        })


@method_decorator(csrf_exempt, name='dispatch')
class HealthCheckView(View):
    """
    GET: Health check endpoint
    """
    
    def get(self, request):
        return JsonResponse({
            'status': 'healthy',
            'service': 'schema-engine-normalization'
        })
