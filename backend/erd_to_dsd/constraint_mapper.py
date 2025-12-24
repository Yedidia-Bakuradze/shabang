"""
Constraint Mapper Module
Analyzes and validates constraints in ERD/DSD structures
"""

from dataclasses import dataclass
from typing import List, Set, Dict, Optional
from enum import Enum
from .transformation_engine import DSDSchema, DSDTable, DSDConstraint, ConstraintType


class ConstraintViolationType(str, Enum):
    """Types of constraint violations"""
    MISSING_PRIMARY_KEY = 'missing_primary_key'
    MISSING_REFERENCED_TABLE = 'missing_referenced_table'
    MISSING_REFERENCED_COLUMN = 'missing_referenced_column'
    CIRCULAR_REFERENCE = 'circular_reference'
    DUPLICATE_CONSTRAINT = 'duplicate_constraint'
    INVALID_FOREIGN_KEY = 'invalid_foreign_key'
    TYPE_MISMATCH = 'type_mismatch'


@dataclass
class ConstraintViolation:
    """Represents a constraint violation"""
    type: ConstraintViolationType
    table: str
    constraint: Optional[str] = None
    message: str = ''
    severity: str = 'error'  # 'error', 'warning', 'info'


class ConstraintAnalyzer:
    """Analyzes constraints in DSD for violations and issues"""
    
    def analyze_erd(self, erd_json: Dict) -> List[ConstraintViolation]:
        """
        Analyze ERD JSON for constraint issues
        
        Args:
            erd_json: ERD structure
            
        Returns:
            List of violations found
        """
        violations = []
        entities = erd_json.get('entities', [])
        relationships = erd_json.get('relationships', [])
        
        # Check each entity has a primary key
        for entity in entities:
            entity_name = entity.get('name')
            attributes = entity.get('attributes', [])
            has_pk = any(attr.get('primary_key', False) for attr in attributes)
            
            if not has_pk:
                violations.append(ConstraintViolation(
                    type=ConstraintViolationType.MISSING_PRIMARY_KEY,
                    table=entity_name,
                    message=f"Entity '{entity_name}' has no primary key defined",
                    severity='error'
                ))
        
        # Check relationships reference existing entities
        entity_names = {e.get('name') for e in entities}
        for relationship in relationships:
            from_entity = relationship.get('from_entity')
            to_entity = relationship.get('to_entity')
            
            if from_entity not in entity_names:
                violations.append(ConstraintViolation(
                    type=ConstraintViolationType.MISSING_REFERENCED_TABLE,
                    table=from_entity,
                    message=f"Relationship references non-existent entity '{from_entity}'",
                    severity='error'
                ))
            
            if to_entity not in entity_names:
                violations.append(ConstraintViolation(
                    type=ConstraintViolationType.MISSING_REFERENCED_TABLE,
                    table=to_entity,
                    message=f"Relationship references non-existent entity '{to_entity}'",
                    severity='error'
                ))
        
        # Check for circular references
        circular_refs = self.detect_circular_references(relationships)
        for cycle in circular_refs:
            violations.append(ConstraintViolation(
                type=ConstraintViolationType.CIRCULAR_REFERENCE,
                table=cycle[0],
                message=f"Circular reference detected: {' -> '.join(cycle)}",
                severity='warning'
            ))
        
        return violations
    
    def analyze_dsd(self, dsd: DSDSchema) -> List[ConstraintViolation]:
        """
        Analyze DSD for constraint violations
        
        Args:
            dsd: DSD schema
            
        Returns:
            List of violations found
        """
        violations = []
        
        # Check each table has a primary key
        for table in dsd.tables:
            has_pk = any(
                c.type == ConstraintType.PRIMARY_KEY 
                for c in table.constraints
            )
            
            if not has_pk:
                violations.append(ConstraintViolation(
                    type=ConstraintViolationType.MISSING_PRIMARY_KEY,
                    table=table.name,
                    message=f"Table '{table.name}' has no primary key",
                    severity='error'
                ))
        
        # Validate foreign key references
        table_names = {t.name for t in dsd.tables}
        for table in dsd.tables:
            for constraint in table.constraints:
                if constraint.type == ConstraintType.FOREIGN_KEY:
                    # Check referenced table exists
                    if constraint.referenced_table not in table_names:
                        violations.append(ConstraintViolation(
                            type=ConstraintViolationType.MISSING_REFERENCED_TABLE,
                            table=table.name,
                            constraint=constraint.name,
                            message=f"Foreign key '{constraint.name}' references non-existent table '{constraint.referenced_table}'",
                            severity='error'
                        ))
                    else:
                        # Check referenced columns exist
                        ref_table = next(t for t in dsd.tables if t.name == constraint.referenced_table)
                        ref_col_names = {c.name for c in ref_table.columns}
                        
                        for ref_col in (constraint.referenced_columns or []):
                            if ref_col not in ref_col_names:
                                violations.append(ConstraintViolation(
                                    type=ConstraintViolationType.MISSING_REFERENCED_COLUMN,
                                    table=table.name,
                                    constraint=constraint.name,
                                    message=f"Foreign key '{constraint.name}' references non-existent column '{ref_col}' in table '{ref_table.name}'",
                                    severity='error'
                                ))
        
        return violations
    
    def detect_circular_references(self, relationships: List[Dict]) -> List[List[str]]:
        """
        Detect circular references in relationships using DFS
        
        Args:
            relationships: List of relationship definitions
            
        Returns:
            List of cycles found (each cycle is a list of entity names)
        """
        # Build adjacency list
        graph = {}
        for rel in relationships:
            from_e = rel.get('from_entity')
            to_e = rel.get('to_entity')
            if from_e not in graph:
                graph[from_e] = []
            graph[from_e].append(to_e)
        
        cycles = []
        visited = set()
        rec_stack = []
        
        def dfs(node):
            visited.add(node)
            rec_stack.append(node)
            
            if node in graph:
                for neighbor in graph[node]:
                    if neighbor not in visited:
                        dfs(neighbor)
                    elif neighbor in rec_stack:
                        # Found a cycle
                        cycle_start = rec_stack.index(neighbor)
                        cycle = rec_stack[cycle_start:] + [neighbor]
                        cycles.append(cycle)
            
            rec_stack.pop()
        
        for node in graph:
            if node not in visited:
                dfs(node)
        
        return cycles


class ConstraintGenerator:
    """Generates constraint names and definitions"""
    
    @staticmethod
    def generate_pk_name(table_name: str) -> str:
        """Generate primary key constraint name"""
        return f"pk_{table_name}"
    
    @staticmethod
    def generate_fk_name(table_name: str, referenced_table: str) -> str:
        """Generate foreign key constraint name"""
        return f"fk_{table_name}_{referenced_table}"
    
    @staticmethod
    def generate_unique_name(table_name: str, column_name: str) -> str:
        """Generate unique constraint name"""
        return f"uq_{table_name}_{column_name}"
    
    @staticmethod
    def generate_check_name(table_name: str, description: str) -> str:
        """Generate check constraint name"""
        safe_desc = description.replace(' ', '_').lower()[:30]
        return f"chk_{table_name}_{safe_desc}"
    
    @staticmethod
    def generate_index_name(table_name: str, column_name: str, unique: bool = False) -> str:
        """Generate index name"""
        prefix = 'uidx' if unique else 'idx'
        return f"{prefix}_{table_name}_{column_name}"


class ConstraintEnforcer:
    """Ensures constraints are properly applied to DSD"""
    
    @staticmethod
    def ensure_primary_key(table: DSDTable, default_column: str = 'id'):
        """
        Ensure table has a primary key
        
        Args:
            table: DSD table
            default_column: Column to use as PK if none exists
        """
        has_pk = any(c.type == ConstraintType.PRIMARY_KEY for c in table.constraints)
        
        if not has_pk:
            # Check if default column exists
            if any(col.name == default_column for col in table.columns):
                pk_constraint = DSDConstraint(
                    name=ConstraintGenerator.generate_pk_name(table.name),
                    type=ConstraintType.PRIMARY_KEY,
                    columns=[default_column]
                )
                table.constraints.append(pk_constraint)
    
    @staticmethod
    def validate_check_constraint(expression: str) -> bool:
        """
        Validate a CHECK constraint expression (basic validation)
        
        Args:
            expression: SQL expression
            
        Returns:
            True if valid, False otherwise
        """
        # Basic validation - check for SQL injection patterns
        dangerous_keywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'EXEC', 'EXECUTE']
        expression_upper = expression.upper()
        
        for keyword in dangerous_keywords:
            if keyword in expression_upper:
                return False
        
        return True
