"""
Transformation Engine Module
Transforms ERD JSON models to DSD object structures
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from enum import Enum
from .type_mapping import TypeMapper


class ConstraintType(str, Enum):
    """Types of database constraints"""
    PRIMARY_KEY = 'PRIMARY KEY'
    FOREIGN_KEY = 'FOREIGN KEY'
    UNIQUE = 'UNIQUE'
    CHECK = 'CHECK'
    NOT_NULL = 'NOT NULL'
    DEFAULT = 'DEFAULT'


class RelationshipType(str, Enum):
    """Types of entity relationships"""
    ONE_TO_ONE = '1:1'
    ONE_TO_MANY = '1:N'
    MANY_TO_ONE = 'N:1'
    MANY_TO_MANY = 'N:M'


@dataclass
class DSDColumn:
    """Represents a column in a DSD table"""
    name: str
    sql_type: str
    nullable: bool = True
    unique: bool = False
    auto_increment: bool = False
    default_value: Optional[str] = None
    description: Optional[str] = None
    
    # Original ERD type info
    logical_type: Optional[str] = None
    length: Optional[int] = None
    precision: Optional[int] = None
    scale: Optional[int] = None


@dataclass
class DSDConstraint:
    """Represents a constraint in a DSD table"""
    name: str
    type: ConstraintType
    columns: List[str]
    
    # For foreign keys
    referenced_table: Optional[str] = None
    referenced_columns: Optional[List[str]] = None
    on_delete: Optional[str] = 'RESTRICT'
    on_update: Optional[str] = 'RESTRICT'
    
    # For check constraints
    check_expression: Optional[str] = None


@dataclass
class DSDIndex:
    """Represents an index in a DSD table"""
    name: str
    columns: List[str]
    unique: bool = False
    index_type: Optional[str] = None  # BTREE, HASH, etc.


@dataclass
class DSDTable:
    """Represents a table in a DSD"""
    name: str
    columns: List[DSDColumn] = field(default_factory=list)
    constraints: List[DSDConstraint] = field(default_factory=list)
    indexes: List[DSDIndex] = field(default_factory=list)
    description: Optional[str] = None


@dataclass
class DSDSchema:
    """Represents a complete DSD (Data Structure Diagram)"""
    name: str
    tables: List[DSDTable] = field(default_factory=list)
    description: Optional[str] = None
    dialect: str = 'postgresql'


class ERDToDSDTransformer:
    """Transforms ERD JSON to DSD object structure"""
    
    def __init__(self, dialect: str = 'postgresql'):
        """
        Initialize transformer
        
        Args:
            dialect: Target SQL dialect
        """
        self.dialect = dialect
        self.type_mapper = TypeMapper(dialect)
    
    def transform(self, erd_json: Dict[str, Any]) -> DSDSchema:
        """
        Transform ERD JSON to DSD
        
        Args:
            erd_json: ERD structure with entities and relationships
            
        Returns:
            DSDSchema object
        """
        schema_name = erd_json.get('name', 'database')
        description = erd_json.get('description', '')
        
        dsd = DSDSchema(
            name=schema_name,
            description=description,
            dialect=self.dialect
        )
        
        # Transform entities to tables
        entities = erd_json.get('entities', [])
        for entity in entities:
            table = self._transform_entity_to_table(entity)
            dsd.tables.append(table)
        
        # Process relationships
        relationships = erd_json.get('relationships', [])
        for relationship in relationships:
            self._process_relationship(relationship, dsd)
        
        return dsd
    
    def _transform_entity_to_table(self, entity: Dict[str, Any]) -> DSDTable:
        """
        Convert an ERD entity to a DSD table
        
        Args:
            entity: Entity definition from ERD
            
        Returns:
            DSDTable object
        """
        table_name = entity.get('name', 'unknown_table')
        description = entity.get('description', '')
        
        table = DSDTable(
            name=table_name,
            description=description
        )
        
        # Transform attributes to columns
        attributes = entity.get('attributes', [])
        pk_columns = []
        
        for attr in attributes:
            column = self._transform_attribute_to_column(attr)
            table.columns.append(column)
            
            # Track primary key columns
            if attr.get('primary_key', False):
                pk_columns.append(column.name)
        
        # Add primary key constraint if exists
        if pk_columns:
            pk_constraint = DSDConstraint(
                name=f"pk_{table_name}",
                type=ConstraintType.PRIMARY_KEY,
                columns=pk_columns
            )
            table.constraints.append(pk_constraint)
        
        # Add unique constraints
        for attr in attributes:
            if attr.get('unique', False) and not attr.get('primary_key', False):
                unique_constraint = DSDConstraint(
                    name=f"uq_{table_name}_{attr['name']}",
                    type=ConstraintType.UNIQUE,
                    columns=[attr['name']]
                )
                table.constraints.append(unique_constraint)
        
        return table
    
    def _transform_attribute_to_column(self, attribute: Dict[str, Any]) -> DSDColumn:
        """
        Convert an ERD attribute to a DSD column
        
        Args:
            attribute: Attribute definition from ERD
            
        Returns:
            DSDColumn object
        """
        name = attribute.get('name', 'unknown_column')
        logical_type = attribute.get('type', 'String')
        
        # Get type parameters
        length = attribute.get('length')
        precision = attribute.get('precision')
        scale = attribute.get('scale')
        
        # Map to SQL type
        type_params = {}
        if length:
            type_params['length'] = length
        if precision:
            type_params['precision'] = precision
        if scale:
            type_params['scale'] = scale
        
        sql_type = self.type_mapper.map_type(logical_type, **type_params)
        
        # Handle default value
        default_value = None
        if 'default' in attribute:
            default_value = self.type_mapper.get_default_value(
                logical_type,
                attribute['default']
            )
        
        column = DSDColumn(
            name=name,
            sql_type=sql_type,
            nullable=attribute.get('nullable', True),
            unique=attribute.get('unique', False),
            auto_increment=attribute.get('auto_increment', False),
            default_value=default_value,
            description=attribute.get('description', ''),
            logical_type=logical_type,
            length=length,
            precision=precision,
            scale=scale
        )
        
        # Primary keys are not nullable
        if attribute.get('primary_key', False):
            column.nullable = False
        
        return column
    
    def _process_relationship(self, relationship: Dict[str, Any], dsd: DSDSchema):
        """
        Process a relationship and add foreign keys
        
        Args:
            relationship: Relationship definition from ERD
            dsd: DSDSchema being built
        """
        rel_type = relationship.get('type', '1:N')
        from_entity = relationship.get('from_entity')
        to_entity = relationship.get('to_entity')
        
        if rel_type == RelationshipType.ONE_TO_MANY or rel_type == '1:N':
            self._add_one_to_many_fk(relationship, dsd)
        elif rel_type == RelationshipType.MANY_TO_ONE or rel_type == 'N:1':
            self._add_many_to_one_fk(relationship, dsd)
        elif rel_type == RelationshipType.ONE_TO_ONE or rel_type == '1:1':
            self._add_one_to_one_fk(relationship, dsd)
        elif rel_type == RelationshipType.MANY_TO_MANY or rel_type == 'N:M':
            self._add_many_to_many_junction(relationship, dsd)
    
    def _add_one_to_many_fk(self, relationship: Dict[str, Any], dsd: DSDSchema):
        """Add foreign key for 1:N relationship"""
        from_entity = relationship.get('from_entity')
        to_entity = relationship.get('to_entity')
        from_attr = relationship.get('from_attribute', 'id')
        to_attr = relationship.get('to_attribute', f"{from_entity}_id")
        
        # Find the "many" side table
        to_table = self._find_table(dsd, to_entity)
        if not to_table:
            return
        
        # Add FK column if it doesn't exist
        if not self._column_exists(to_table, to_attr):
            fk_column = DSDColumn(
                name=to_attr,
                sql_type='INTEGER',
                nullable=False,
                logical_type='Integer'
            )
            to_table.columns.append(fk_column)
        
        # Add FK constraint
        fk_constraint = DSDConstraint(
            name=f"fk_{to_entity}_{from_entity}",
            type=ConstraintType.FOREIGN_KEY,
            columns=[to_attr],
            referenced_table=from_entity,
            referenced_columns=[from_attr],
            on_delete=relationship.get('on_delete', 'CASCADE'),
            on_update=relationship.get('on_update', 'CASCADE')
        )
        to_table.constraints.append(fk_constraint)
        
        # Add index on FK column
        fk_index = DSDIndex(
            name=f"idx_{to_entity}_{to_attr}",
            columns=[to_attr]
        )
        to_table.indexes.append(fk_index)
    
    def _add_many_to_one_fk(self, relationship: Dict[str, Any], dsd: DSDSchema):
        """Add foreign key for N:1 relationship"""
        # Reverse the relationship and treat as 1:N
        reversed_rel = {
            **relationship,
            'from_entity': relationship.get('to_entity'),
            'to_entity': relationship.get('from_entity'),
            'from_attribute': relationship.get('to_attribute', 'id'),
            'to_attribute': relationship.get('from_attribute', f"{relationship.get('to_entity')}_id")
        }
        self._add_one_to_many_fk(reversed_rel, dsd)
    
    def _add_one_to_one_fk(self, relationship: Dict[str, Any], dsd: DSDSchema):
        """Add foreign key for 1:1 relationship with unique constraint"""
        self._add_one_to_many_fk(relationship, dsd)
        
        # Add unique constraint to make it 1:1
        to_entity = relationship.get('to_entity')
        to_attr = relationship.get('to_attribute', f"{relationship.get('from_entity')}_id")
        to_table = self._find_table(dsd, to_entity)
        
        if to_table:
            unique_constraint = DSDConstraint(
                name=f"uq_{to_entity}_{to_attr}",
                type=ConstraintType.UNIQUE,
                columns=[to_attr]
            )
            to_table.constraints.append(unique_constraint)
    
    def _add_many_to_many_junction(self, relationship: Dict[str, Any], dsd: DSDSchema):
        """Create junction table for N:M relationship"""
        from_entity = relationship.get('from_entity')
        to_entity = relationship.get('to_entity')
        junction_name = relationship.get('junction_table', f"{from_entity}_{to_entity}")
        
        # Create junction table
        junction_table = DSDTable(
            name=junction_name,
            description=f"Junction table for {from_entity} and {to_entity}"
        )
        
        # Add FK to first entity
        from_fk_col = DSDColumn(
            name=f"{from_entity}_id",
            sql_type='INTEGER',
            nullable=False,
            logical_type='Integer'
        )
        junction_table.columns.append(from_fk_col)
        
        # Add FK to second entity
        to_fk_col = DSDColumn(
            name=f"{to_entity}_id",
            sql_type='INTEGER',
            nullable=False,
            logical_type='Integer'
        )
        junction_table.columns.append(to_fk_col)
        
        # Add composite PK
        pk_constraint = DSDConstraint(
            name=f"pk_{junction_name}",
            type=ConstraintType.PRIMARY_KEY,
            columns=[f"{from_entity}_id", f"{to_entity}_id"]
        )
        junction_table.constraints.append(pk_constraint)
        
        # Add FK constraints
        fk1 = DSDConstraint(
            name=f"fk_{junction_name}_{from_entity}",
            type=ConstraintType.FOREIGN_KEY,
            columns=[f"{from_entity}_id"],
            referenced_table=from_entity,
            referenced_columns=['id'],
            on_delete='CASCADE'
        )
        junction_table.constraints.append(fk1)
        
        fk2 = DSDConstraint(
            name=f"fk_{junction_name}_{to_entity}",
            type=ConstraintType.FOREIGN_KEY,
            columns=[f"{to_entity}_id"],
            referenced_table=to_entity,
            referenced_columns=['id'],
            on_delete='CASCADE'
        )
        junction_table.constraints.append(fk2)
        
        dsd.tables.append(junction_table)
    
    def _find_table(self, dsd: DSDSchema, table_name: str) -> Optional[DSDTable]:
        """Find a table by name in the DSD"""
        for table in dsd.tables:
            if table.name == table_name:
                return table
        return None
    
    def _column_exists(self, table: DSDTable, column_name: str) -> bool:
        """Check if a column exists in a table"""
        return any(col.name == column_name for col in table.columns)
