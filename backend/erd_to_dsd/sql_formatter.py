"""
SQL Formatter Module
Generates SQL DDL scripts from DSD structures
"""

from typing import List, Optional
from .transformation_engine import DSDSchema, DSDTable, DSDColumn, DSDConstraint, DSDIndex, ConstraintType


class SQLDialect:
    """SQL dialect constants"""
    POSTGRESQL = 'postgresql'
    MYSQL = 'mysql'
    MSSQL = 'mssql'
    SQLITE = 'sqlite'


class SQLFormatter:
    """Formats DSD objects into SQL DDL statements"""
    
    def __init__(self, dialect: str = 'postgresql'):
        """
        Initialize formatter
        
        Args:
            dialect: Target SQL dialect
        """
        self.dialect = dialect
    
    def format_schema(self, dsd: DSDSchema, include_drop: bool = False) -> str:
        """
        Format entire schema to SQL
        
        Args:
            dsd: DSD schema
            include_drop: Whether to include DROP statements
            
        Returns:
            Complete SQL script
        """
        lines = []
        
        # Header comment
        lines.append(f"-- Schema: {dsd.name}")
        if dsd.description:
            lines.append(f"-- {dsd.description}")
        lines.append(f"-- Generated for: {self.dialect.upper()}")
        lines.append("")
        
        # DROP statements
        if include_drop:
            lines.append("-- Drop tables (in reverse order to handle FK dependencies)")
            for table in reversed(dsd.tables):
                lines.append(f"DROP TABLE IF EXISTS {self._quote_identifier(table.name)} CASCADE;")
            lines.append("")
        
        # CREATE statements
        lines.append("-- Create tables")
        for table in dsd.tables:
            lines.append(self._format_create_table(table))
            lines.append("")
        
        # CREATE INDEX statements (separate from table creation)
        if any(table.indexes for table in dsd.tables):
            lines.append("-- Create indexes")
            for table in dsd.tables:
                for index in table.indexes:
                    lines.append(self._format_create_index(table.name, index))
            lines.append("")
        
        return "\n".join(lines)
    
    def _format_create_table(self, table: DSDTable) -> str:
        """Format CREATE TABLE statement"""
        lines = []
        
        # Table comment
        if table.description:
            lines.append(f"-- {table.description}")
        
        lines.append(f"CREATE TABLE {self._quote_identifier(table.name)} (")
        
        # Column definitions
        col_defs = []
        for column in table.columns:
            col_defs.append("    " + self._format_column(column))
        
        # Inline constraints (PK, UNIQUE)
        for constraint in table.constraints:
            if constraint.type in (ConstraintType.PRIMARY_KEY, ConstraintType.UNIQUE):
                col_defs.append("    " + self._format_inline_constraint(constraint))
        
        lines.append(",\n".join(col_defs))
        lines.append(");")
        
        # Foreign key constraints (separate from table definition for some dialects)
        fk_constraints = [c for c in table.constraints if c.type == ConstraintType.FOREIGN_KEY]
        for fk in fk_constraints:
            lines.append("")
            lines.append(self._format_foreign_key_constraint(table.name, fk))
        
        return "\n".join(lines)
    
    def _format_column(self, column: DSDColumn) -> str:
        """Format column definition"""
        parts = [self._quote_identifier(column.name), column.sql_type]
        
        # NOT NULL
        if not column.nullable:
            parts.append("NOT NULL")
        
        # AUTO_INCREMENT / SERIAL
        if column.auto_increment:
            if self.dialect == 'postgresql':
                # Replace type with SERIAL
                if 'INTEGER' in column.sql_type.upper():
                    parts[1] = 'SERIAL'
                    parts.remove('NOT NULL') if 'NOT NULL' in parts else None
            elif self.dialect == 'mysql':
                parts.append("AUTO_INCREMENT")
            elif self.dialect == 'mssql':
                parts.append("IDENTITY(1,1)")
        
        # DEFAULT value
        if column.default_value:
            parts.append(f"DEFAULT {column.default_value}")
        
        return " ".join(parts)
    
    def _format_inline_constraint(self, constraint: DSDConstraint) -> str:
        """Format inline constraint (PK, UNIQUE)"""
        constraint_name = self._quote_identifier(constraint.name)
        columns = ", ".join(self._quote_identifier(c) for c in constraint.columns)
        
        if constraint.type == ConstraintType.PRIMARY_KEY:
            return f"CONSTRAINT {constraint_name} PRIMARY KEY ({columns})"
        elif constraint.type == ConstraintType.UNIQUE:
            return f"CONSTRAINT {constraint_name} UNIQUE ({columns})"
        
        return ""
    
    def _format_foreign_key_constraint(self, table_name: str, constraint: DSDConstraint) -> str:
        """Format ALTER TABLE ADD FOREIGN KEY statement"""
        table = self._quote_identifier(table_name)
        constraint_name = self._quote_identifier(constraint.name)
        columns = ", ".join(self._quote_identifier(c) for c in constraint.columns)
        ref_table = self._quote_identifier(constraint.referenced_table)
        ref_columns = ", ".join(self._quote_identifier(c) for c in (constraint.referenced_columns or []))
        
        parts = [
            f"ALTER TABLE {table}",
            f"ADD CONSTRAINT {constraint_name}",
            f"FOREIGN KEY ({columns})",
            f"REFERENCES {ref_table} ({ref_columns})"
        ]
        
        if constraint.on_delete:
            parts.append(f"ON DELETE {constraint.on_delete}")
        
        if constraint.on_update:
            parts.append(f"ON UPDATE {constraint.on_update}")
        
        return " ".join(parts) + ";"
    
    def _format_create_index(self, table_name: str, index: DSDIndex) -> str:
        """Format CREATE INDEX statement"""
        unique = "UNIQUE " if index.unique else ""
        index_name = self._quote_identifier(index.name)
        table = self._quote_identifier(table_name)
        columns = ", ".join(self._quote_identifier(c) for c in index.columns)
        
        return f"CREATE {unique}INDEX {index_name} ON {table} ({columns});"
    
    def _quote_identifier(self, identifier: str) -> str:
        """Quote identifier based on dialect"""
        if self.dialect == 'postgresql':
            return f'"{identifier}"' if ' ' in identifier or identifier.upper() != identifier else identifier
        elif self.dialect == 'mysql':
            return f"`{identifier}`"
        elif self.dialect == 'mssql':
            return f"[{identifier}]"
        elif self.dialect == 'sqlite':
            return f'"{identifier}"' if ' ' in identifier else identifier
        else:
            return identifier


class SQLScriptGenerator:
    """High-level SQL script generator"""
    
    def __init__(self, dialect: str = 'postgresql'):
        """
        Initialize generator
        
        Args:
            dialect: Target SQL dialect
        """
        self.dialect = dialect
        self.formatter = SQLFormatter(dialect)
    
    def generate_full_script(self, dsd: DSDSchema, include_drop: bool = False) -> str:
        """
        Generate complete SQL script
        
        Args:
            dsd: DSD schema
            include_drop: Whether to include DROP statements
            
        Returns:
            Complete SQL DDL script
        """
        return self.formatter.format_schema(dsd, include_drop=include_drop)
    
    def generate_migration_script(
        self,
        from_dsd: DSDSchema,
        to_dsd: DSDSchema
    ) -> str:
        """
        Generate migration script from one schema version to another
        (Simplified - full implementation would require more complex diff logic)
        
        Args:
            from_dsd: Current schema
            to_dsd: Target schema
            
        Returns:
            Migration SQL script
        """
        lines = []
        lines.append("-- Migration Script")
        lines.append(f"-- From: {from_dsd.name}")
        lines.append(f"-- To: {to_dsd.name}")
        lines.append("")
        
        # Get table names
        from_tables = {t.name for t in from_dsd.tables}
        to_tables = {t.name for t in to_dsd.tables}
        
        # Tables to add
        new_tables = to_tables - from_tables
        if new_tables:
            lines.append("-- Add new tables")
            for table_name in new_tables:
                table = next(t for t in to_dsd.tables if t.name == table_name)
                lines.append(self.formatter._format_create_table(table))
                lines.append("")
        
        # Tables to drop
        dropped_tables = from_tables - to_tables
        if dropped_tables:
            lines.append("-- Drop removed tables")
            for table_name in dropped_tables:
                lines.append(f"DROP TABLE {self.formatter._quote_identifier(table_name)};")
            lines.append("")
        
        # Note: Full migration would also handle column changes, constraint changes, etc.
        lines.append("-- Note: This is a simplified migration script")
        lines.append("-- Manual review required for column and constraint changes")
        
        return "\n".join(lines)
