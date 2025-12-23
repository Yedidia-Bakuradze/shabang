"""
ERD to DSD Transformation Package
Complete toolkit for converting Entity Relationship Diagrams to Data Structure Diagrams
"""

from .type_mapping import TypeMapper, TypeInference
from .transformation_engine import (
    ERDToDSDTransformer,
    DSDSchema,
    DSDTable,
    DSDColumn,
    DSDConstraint,
    DSDIndex,
    ConstraintType,
    RelationshipType
)
from .constraint_mapper import (
    ConstraintAnalyzer,
    ConstraintGenerator,
    ConstraintEnforcer,
    ConstraintViolation,
    ConstraintViolationType
)
from .validation_service import (
    DSDValidator,
    ValidationIssue,
    ValidationSeverity
)
from .sql_formatter import (
    SQLFormatter,
    SQLScriptGenerator,
    SQLDialect
)

__version__ = '1.0.0'
__all__ = [
    # Type Mapping
    'TypeMapper',
    'TypeInference',
    
    # Transformation Engine
    'ERDToDSDTransformer',
    'DSDSchema',
    'DSDTable',
    'DSDColumn',
    'DSDConstraint',
    'DSDIndex',
    'ConstraintType',
    'RelationshipType',
    
    # Constraint Mapping
    'ConstraintAnalyzer',
    'ConstraintGenerator',
    'ConstraintEnforcer',
    'ConstraintViolation',
    'ConstraintViolationType',
    
    # Validation
    'DSDValidator',
    'ValidationIssue',
    'ValidationSeverity',
    
    # SQL Formatting
    'SQLFormatter',
    'SQLScriptGenerator',
    'SQLDialect',
]


def transform_erd_to_sql(
    erd_json,
    dialect='postgresql',
    validate=True,
    include_drop=False
):
    """
    Convenience function to transform ERD JSON to SQL script
    
    Args:
        erd_json (dict): ERD structure in JSON format
        dialect (str): Target SQL dialect ('postgresql', 'mysql', 'mssql', 'sqlite')
        validate (bool): Whether to validate the DSD before generating SQL
        include_drop (bool): Whether to include DROP TABLE statements
        
    Returns:
        dict: Result containing SQL script and validation results
    """
    result = {
        'sql': None,
        'dsd': None,
        'validation': None,
        'success': False,
        'errors': []
    }
    
    try:
        # Transform ERD to DSD
        transformer = ERDToDSDTransformer(dialect)
        dsd = transformer.transform(erd_json)
        result['dsd'] = dsd
        
        # Validate if requested
        if validate:
            validator = DSDValidator()
            validation_results = validator.validate(dsd)
            result['validation'] = validation_results
            
            # Stop if there are errors
            if validation_results['errors'] > 0:
                result['errors'] = [
                    issue['message'] 
                    for issue in validation_results['issues'] 
                    if issue['severity'] == 'error'
                ]
                return result
        
        # Generate SQL
        generator = SQLScriptGenerator(dialect)
        sql_script = generator.generate_full_script(dsd, include_drop=include_drop)
        result['sql'] = sql_script
        result['success'] = True
        
    except Exception as e:
        result['errors'].append(str(e))
    
    return result
