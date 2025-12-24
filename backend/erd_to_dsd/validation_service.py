"""
Validation Service Module
Validates DSD structures for completeness and correctness
"""

from dataclasses import dataclass
from typing import List, Dict, Set, Optional
from enum import Enum
from .transformation_engine import DSDSchema, DSDTable, DSDColumn, DSDConstraint, ConstraintType


class ValidationSeverity(str, Enum):
    """Severity levels for validation issues"""
    ERROR = 'error'
    WARNING = 'warning'
    INFO = 'info'


@dataclass
class ValidationIssue:
    """Represents a validation issue"""
    severity: ValidationSeverity
    table: str
    column: Optional[str] = None
    constraint: Optional[str] = None
    message: str = ''
    code: str = ''


class DSDValidator:
    """Comprehensive DSD validation service"""
    
    def validate(self, dsd: DSDSchema) -> Dict:
        """
        Validate entire DSD schema
        
        Args:
            dsd: DSD schema to validate
            
        Returns:
            Dictionary with validation results
        """
        issues = []
        
        # Run all validation checks
        issues.extend(self._validate_tables(dsd))
        issues.extend(self._validate_columns(dsd))
        issues.extend(self._validate_constraints(dsd))
        issues.extend(self._validate_foreign_key_references(dsd))
        issues.extend(self._check_for_best_practices(dsd))
        
        # Categorize issues
        errors = [i for i in issues if i.severity == ValidationSeverity.ERROR]
        warnings = [i for i in issues if i.severity == ValidationSeverity.WARNING]
        infos = [i for i in issues if i.severity == ValidationSeverity.INFO]
        
        return {
            'valid': len(errors) == 0,
            'issues': [self._issue_to_dict(i) for i in issues],
            'errors': len(errors),
            'warnings': len(warnings),
            'infos': len(infos),
            'summary': f"{len(errors)} errors, {len(warnings)} warnings, {len(infos)} info"
        }
    
    def _validate_tables(self, dsd: DSDSchema) -> List[ValidationIssue]:
        """Validate table definitions"""
        issues = []
        
        if not dsd.tables:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                table='<schema>',
                message='Schema has no tables defined',
                code='NO_TABLES'
            ))
        
        # Check for duplicate table names
        table_names = [t.name for t in dsd.tables]
        duplicates = set([name for name in table_names if table_names.count(name) > 1])
        
        for dup in duplicates:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                table=dup,
                message=f"Duplicate table name '{dup}'",
                code='DUPLICATE_TABLE'
            ))
        
        # Each table should have at least one column
        for table in dsd.tables:
            if not table.columns:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    table=table.name,
                    message=f"Table '{table.name}' has no columns",
                    code='NO_COLUMNS'
                ))
        
        return issues
    
    def _validate_columns(self, dsd: DSDSchema) -> List[ValidationIssue]:
        """Validate column definitions"""
        issues = []
        
        for table in dsd.tables:
            column_names = [c.name for c in table.columns]
            duplicates = set([name for name in column_names if column_names.count(name) > 1])
            
            for dup in duplicates:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    table=table.name,
                    column=dup,
                    message=f"Duplicate column name '{dup}' in table '{table.name}'",
                    code='DUPLICATE_COLUMN'
                ))
            
            # Check for missing SQL types
            for column in table.columns:
                if not column.sql_type:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        table=table.name,
                        column=column.name,
                        message=f"Column '{column.name}' has no SQL type defined",
                        code='MISSING_TYPE'
                    ))
        
        return issues
    
    def _validate_constraints(self, dsd: DSDSchema) -> List[ValidationIssue]:
        """Validate constraint definitions"""
        issues = []
        
        for table in dsd.tables:
            # Check for primary key
            pk_constraints = [c for c in table.constraints if c.type == ConstraintType.PRIMARY_KEY]
            
            if not pk_constraints:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    table=table.name,
                    message=f"Table '{table.name}' has no primary key",
                    code='NO_PRIMARY_KEY'
                ))
            elif len(pk_constraints) > 1:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    table=table.name,
                    message=f"Table '{table.name}' has multiple primary keys",
                    code='MULTIPLE_PRIMARY_KEYS'
                ))
            
            # Validate constraint columns exist
            column_names = {c.name for c in table.columns}
            for constraint in table.constraints:
                for col_name in constraint.columns:
                    if col_name not in column_names:
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            table=table.name,
                            constraint=constraint.name,
                            message=f"Constraint '{constraint.name}' references non-existent column '{col_name}'",
                            code='INVALID_CONSTRAINT_COLUMN'
                        ))
        
        return issues
    
    def _validate_foreign_key_references(self, dsd: DSDSchema) -> List[ValidationIssue]:
        """Validate foreign key relationships"""
        issues = []
        table_map = {t.name: t for t in dsd.tables}
        
        for table in dsd.tables:
            for constraint in table.constraints:
                if constraint.type == ConstraintType.FOREIGN_KEY:
                    # Check referenced table exists
                    if constraint.referenced_table not in table_map:
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            table=table.name,
                            constraint=constraint.name,
                            message=f"Foreign key references non-existent table '{constraint.referenced_table}'",
                            code='INVALID_FK_TABLE'
                        ))
                        continue
                    
                    # Check referenced columns exist
                    ref_table = table_map[constraint.referenced_table]
                    ref_col_names = {c.name for c in ref_table.columns}
                    
                    for ref_col in (constraint.referenced_columns or []):
                        if ref_col not in ref_col_names:
                            issues.append(ValidationIssue(
                                severity=ValidationSeverity.ERROR,
                                table=table.name,
                                constraint=constraint.name,
                                message=f"Foreign key references non-existent column '{ref_col}' in table '{ref_table.name}'",
                                code='INVALID_FK_COLUMN'
                            ))
                    
                    # Check type compatibility (simplified)
                    if constraint.columns and constraint.referenced_columns:
                        local_col = next((c for c in table.columns if c.name == constraint.columns[0]), None)
                        ref_col = next((c for c in ref_table.columns if c.name == constraint.referenced_columns[0]), None)
                        
                        if local_col and ref_col:
                            if local_col.sql_type != ref_col.sql_type:
                                issues.append(ValidationIssue(
                                    severity=ValidationSeverity.WARNING,
                                    table=table.name,
                                    constraint=constraint.name,
                                    message=f"Type mismatch in FK '{constraint.name}': {local_col.sql_type} vs {ref_col.sql_type}",
                                    code='FK_TYPE_MISMATCH'
                                ))
        
        return issues
    
    def _check_for_best_practices(self, dsd: DSDSchema) -> List[ValidationIssue]:
        """Check for database design best practices"""
        issues = []
        
        for table in dsd.tables:
            # Check for timestamp columns
            has_created_at = any(c.name in ('created_at', 'created', 'date_created') for c in table.columns)
            has_updated_at = any(c.name in ('updated_at', 'updated', 'date_updated') for c in table.columns)
            
            if not has_created_at:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.INFO,
                    table=table.name,
                    message=f"Consider adding a 'created_at' timestamp column to '{table.name}'",
                    code='MISSING_CREATED_AT'
                ))
            
            if not has_updated_at:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.INFO,
                    table=table.name,
                    message=f"Consider adding an 'updated_at' timestamp column to '{table.name}'",
                    code='MISSING_UPDATED_AT'
                ))
            
            # Check for too many columns
            if len(table.columns) > 50:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    table=table.name,
                    message=f"Table '{table.name}' has {len(table.columns)} columns. Consider normalizing.",
                    code='TOO_MANY_COLUMNS'
                ))
            
            # Check foreign keys have indexes
            fk_columns = set()
            for constraint in table.constraints:
                if constraint.type == ConstraintType.FOREIGN_KEY:
                    fk_columns.update(constraint.columns)
            
            indexed_columns = set()
            for index in table.indexes:
                if len(index.columns) == 1:
                    indexed_columns.add(index.columns[0])
            
            for fk_col in fk_columns:
                if fk_col not in indexed_columns:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.INFO,
                        table=table.name,
                        column=fk_col,
                        message=f"Consider adding an index on FK column '{fk_col}'",
                        code='FK_WITHOUT_INDEX'
                    ))
        
        return issues
    
    def _issue_to_dict(self, issue: ValidationIssue) -> Dict:
        """Convert ValidationIssue to dictionary"""
        return {
            'severity': issue.severity.value,
            'table': issue.table,
            'column': issue.column,
            'constraint': issue.constraint,
            'message': issue.message,
            'code': issue.code
        }
