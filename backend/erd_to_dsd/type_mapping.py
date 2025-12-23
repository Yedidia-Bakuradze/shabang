"""
Type Mapping Module
Converts logical ERD types to SQL types for different database dialects
"""

from typing import Dict, Optional, Any
from enum import Enum


class SQLDialect(str, Enum):
    """Supported SQL dialects"""
    POSTGRESQL = 'postgresql'
    MYSQL = 'mysql'
    MSSQL = 'mssql'
    SQLITE = 'sqlite'


class TypeMapper:
    """Maps logical types to SQL types across different database dialects"""
    
    # Type mappings for different SQL dialects
    TYPE_MAPPINGS: Dict[str, Dict[str, str]] = {
        'postgresql': {
            'String': 'VARCHAR({length})',
            'Text': 'TEXT',
            'Integer': 'INTEGER',
            'SmallInt': 'SMALLINT',
            'BigInt': 'BIGINT',
            'Decimal': 'DECIMAL({precision},{scale})',
            'Float': 'REAL',
            'Double': 'DOUBLE PRECISION',
            'Boolean': 'BOOLEAN',
            'Date': 'DATE',
            'Time': 'TIME',
            'DateTime': 'TIMESTAMP',
            'Timestamp': 'TIMESTAMP',
            'Binary': 'BYTEA',
            'JSON': 'JSONB',
            'UUID': 'UUID',
            'Array': 'ARRAY',
        },
        'mysql': {
            'String': 'VARCHAR({length})',
            'Text': 'TEXT',
            'Integer': 'INT',
            'SmallInt': 'SMALLINT',
            'BigInt': 'BIGINT',
            'Decimal': 'DECIMAL({precision},{scale})',
            'Float': 'FLOAT',
            'Double': 'DOUBLE',
            'Boolean': 'TINYINT(1)',
            'Date': 'DATE',
            'Time': 'TIME',
            'DateTime': 'DATETIME',
            'Timestamp': 'TIMESTAMP',
            'Binary': 'BLOB',
            'JSON': 'JSON',
            'UUID': 'CHAR(36)',
            'Array': 'JSON',
        },
        'mssql': {
            'String': 'NVARCHAR({length})',
            'Text': 'NVARCHAR(MAX)',
            'Integer': 'INT',
            'SmallInt': 'SMALLINT',
            'BigInt': 'BIGINT',
            'Decimal': 'DECIMAL({precision},{scale})',
            'Float': 'FLOAT',
            'Double': 'FLOAT(53)',
            'Boolean': 'BIT',
            'Date': 'DATE',
            'Time': 'TIME',
            'DateTime': 'DATETIME2',
            'Timestamp': 'DATETIME2',
            'Binary': 'VARBINARY(MAX)',
            'JSON': 'NVARCHAR(MAX)',
            'UUID': 'UNIQUEIDENTIFIER',
            'Array': 'NVARCHAR(MAX)',
        },
        'sqlite': {
            'String': 'TEXT',
            'Text': 'TEXT',
            'Integer': 'INTEGER',
            'SmallInt': 'INTEGER',
            'BigInt': 'INTEGER',
            'Decimal': 'REAL',
            'Float': 'REAL',
            'Double': 'REAL',
            'Boolean': 'INTEGER',
            'Date': 'TEXT',
            'Time': 'TEXT',
            'DateTime': 'TEXT',
            'Timestamp': 'TEXT',
            'Binary': 'BLOB',
            'JSON': 'TEXT',
            'UUID': 'TEXT',
            'Array': 'TEXT',
        }
    }
    
    # Default parameters for types
    DEFAULT_PARAMS = {
        'String': {'length': 255},
        'Decimal': {'precision': 10, 'scale': 2},
    }
    
    def __init__(self, dialect: str = 'postgresql'):
        """
        Initialize TypeMapper with a specific SQL dialect
        
        Args:
            dialect: SQL dialect to use ('postgresql', 'mysql', 'mssql', 'sqlite')
        """
        if dialect not in self.TYPE_MAPPINGS:
            raise ValueError(f"Unsupported dialect: {dialect}. Supported: {list(self.TYPE_MAPPINGS.keys())}")
        self.dialect = dialect
        self.mappings = self.TYPE_MAPPINGS[dialect]
    
    def map_type(self, logical_type: str, **params) -> str:
        """
        Convert a logical type to SQL type
        
        Args:
            logical_type: The logical type (e.g., 'String', 'Integer')
            **params: Type parameters like length, precision, scale
            
        Returns:
            SQL type string (e.g., 'VARCHAR(255)', 'INT')
        """
        if logical_type not in self.mappings:
            raise ValueError(f"Unknown logical type: {logical_type}")
        
        sql_type_template = self.mappings[logical_type]
        
        # Merge default params with provided params
        final_params = {**self.DEFAULT_PARAMS.get(logical_type, {}), **params}
        
        # Format the template with parameters
        try:
            sql_type = sql_type_template.format(**final_params)
        except KeyError as e:
            # If required parameter is missing, use template as-is
            sql_type = sql_type_template
        
        return sql_type
    
    def get_default_value(self, logical_type: str, value: Any) -> str:
        """
        Format a default value for SQL
        
        Args:
            logical_type: The logical type
            value: The default value
            
        Returns:
            Formatted SQL default value
        """
        if value is None:
            return 'NULL'
        
        if logical_type in ('String', 'Text', 'Date', 'Time', 'DateTime', 'Timestamp', 'UUID'):
            return f"'{value}'"
        elif logical_type == 'Boolean':
            if self.dialect == 'postgresql':
                return 'TRUE' if value else 'FALSE'
            elif self.dialect == 'mysql':
                return '1' if value else '0'
            elif self.dialect == 'mssql':
                return '1' if value else '0'
            elif self.dialect == 'sqlite':
                return '1' if value else '0'
        elif logical_type in ('Integer', 'SmallInt', 'BigInt', 'Decimal', 'Float', 'Double'):
            return str(value)
        else:
            return f"'{value}'"
    
    def validate_type_compatibility(self, logical_type: str, value: Any) -> bool:
        """
        Check if a value is compatible with a logical type
        
        Args:
            logical_type: The logical type
            value: The value to check
            
        Returns:
            True if compatible, False otherwise
        """
        if logical_type in ('Integer', 'SmallInt', 'BigInt'):
            return isinstance(value, int)
        elif logical_type in ('Decimal', 'Float', 'Double'):
            return isinstance(value, (int, float))
        elif logical_type == 'Boolean':
            return isinstance(value, bool)
        elif logical_type in ('String', 'Text', 'Date', 'Time', 'DateTime', 'UUID'):
            return isinstance(value, str)
        else:
            return True


class TypeInference:
    """Utility to infer logical types from sample data or column names"""
    
    @staticmethod
    def infer_from_sample(value: Any) -> str:
        """
        Infer logical type from a sample value
        
        Args:
            value: Sample value
            
        Returns:
            Inferred logical type
        """
        if isinstance(value, bool):
            return 'Boolean'
        elif isinstance(value, int):
            if abs(value) < 32768:
                return 'SmallInt'
            elif abs(value) < 2147483648:
                return 'Integer'
            else:
                return 'BigInt'
        elif isinstance(value, float):
            return 'Decimal'
        elif isinstance(value, str):
            if len(value) > 255:
                return 'Text'
            else:
                return 'String'
        elif isinstance(value, (list, dict)):
            return 'JSON'
        else:
            return 'String'
    
    @staticmethod
    def infer_from_name(column_name: str) -> Optional[str]:
        """
        Infer logical type from column name conventions
        
        Args:
            column_name: The column name
            
        Returns:
            Inferred logical type or None
        """
        name_lower = column_name.lower()
        
        # Common patterns
        if name_lower.endswith('_id') or name_lower == 'id':
            return 'Integer'
        elif name_lower.endswith('_at') or name_lower in ('created', 'updated', 'deleted'):
            return 'DateTime'
        elif name_lower.endswith('_date') or name_lower == 'date':
            return 'Date'
        elif name_lower.startswith('is_') or name_lower.startswith('has_'):
            return 'Boolean'
        elif 'email' in name_lower:
            return 'String'
        elif 'phone' in name_lower or 'mobile' in name_lower:
            return 'String'
        elif 'description' in name_lower or 'content' in name_lower or 'body' in name_lower:
            return 'Text'
        elif 'price' in name_lower or 'amount' in name_lower or 'total' in name_lower:
            return 'Decimal'
        elif 'count' in name_lower or 'quantity' in name_lower or 'number' in name_lower:
            return 'Integer'
        elif 'uuid' in name_lower or 'guid' in name_lower:
            return 'UUID'
        
        return None
