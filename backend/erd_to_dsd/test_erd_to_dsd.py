"""
Unit Tests for ERD to DSD Transformation
Run with: pytest test_erd_to_dsd.py -v
"""

import pytest
from type_mapping import TypeMapper, TypeInference, SQLDialect
from transformation_engine import (
    ERDToDSDTransformer,
    DSDSchema,
    DSDTable,
    DSDColumn,
    ConstraintType,
    RelationshipType
)
from constraint_mapper import ConstraintAnalyzer, ConstraintGenerator, ConstraintViolationType
from validation_service import DSDValidator, ValidationSeverity
from sql_formatter import SQLFormatter, SQLScriptGenerator


class TestTypeMapper:
    """Test type mapping functionality"""
    
    def test_basic_type_mapping(self):
        """Test basic type conversions"""
        mapper = TypeMapper('postgresql')
        
        assert mapper.map_type('String') == 'VARCHAR(255)'
        assert mapper.map_type('Integer') == 'INTEGER'
        assert mapper.map_type('Boolean') == 'BOOLEAN'
    
    def test_type_with_parameters(self):
        """Test types with custom parameters"""
        mapper = TypeMapper('postgresql')
        
        assert mapper.map_type('String', length=100) == 'VARCHAR(100)'
        assert mapper.map_type('Decimal', precision=10, scale=2) == 'DECIMAL(10,2)'
    
    def test_dialect_differences(self):
        """Test different SQL dialects"""
        pg_mapper = TypeMapper('postgresql')
        mysql_mapper = TypeMapper('mysql')
        
        assert pg_mapper.map_type('Boolean') == 'BOOLEAN'
        assert mysql_mapper.map_type('Boolean') == 'TINYINT(1)'
    
    def test_default_value_formatting(self):
        """Test default value formatting"""
        mapper = TypeMapper('postgresql')
        
        assert mapper.get_default_value('String', 'test') == "'test'"
        assert mapper.get_default_value('Integer', 42) == '42'
        assert mapper.get_default_value('Boolean', True) == 'TRUE'
    
    def test_type_inference_from_value(self):
        """Test type inference from sample values"""
        assert TypeInference.infer_from_sample(True) == 'Boolean'
        assert TypeInference.infer_from_sample(42) == 'Integer'
        assert TypeInference.infer_from_sample(3.14) == 'Decimal'
        assert TypeInference.infer_from_sample("test") == 'String'
    
    def test_type_inference_from_name(self):
        """Test type inference from column names"""
        assert TypeInference.infer_from_name('user_id') == 'Integer'
        assert TypeInference.infer_from_name('created_at') == 'DateTime'
        assert TypeInference.infer_from_name('is_active') == 'Boolean'
        assert TypeInference.infer_from_name('email') == 'String'
    
    def test_unsupported_dialect(self):
        """Test error on unsupported dialect"""
        with pytest.raises(ValueError):
            TypeMapper('oracle')
    
    def test_unknown_logical_type(self):
        """Test error on unknown type"""
        mapper = TypeMapper('postgresql')
        with pytest.raises(ValueError):
            mapper.map_type('UnknownType')


class TestTransformationEngine:
    """Test ERD to DSD transformation"""
    
    def test_simple_entity_transformation(self):
        """Test converting a single entity to table"""
        erd = {
            "name": "test_db",
            "entities": [
                {
                    "name": "users",
                    "attributes": [
                        {"name": "id", "type": "Integer", "primary_key": True},
                        {"name": "name", "type": "String", "length": 100}
                    ]
                }
            ],
            "relationships": []
        }
        
        transformer = ERDToDSDTransformer('postgresql')
        dsd = transformer.transform(erd)
        
        assert len(dsd.tables) == 1
        assert dsd.tables[0].name == "users"
        assert len(dsd.tables[0].columns) == 2
        assert dsd.tables[0].columns[0].name == "id"
    
    def test_primary_key_constraint(self):
        """Test primary key constraint creation"""
        erd = {
            "name": "test_db",
            "entities": [
                {
                    "name": "users",
                    "attributes": [
                        {"name": "id", "type": "Integer", "primary_key": True}
                    ]
                }
            ]
        }
        
        transformer = ERDToDSDTransformer()
        dsd = transformer.transform(erd)
        
        pk_constraints = [c for c in dsd.tables[0].constraints if c.type == ConstraintType.PRIMARY_KEY]
        assert len(pk_constraints) == 1
        assert pk_constraints[0].columns == ['id']
    
    def test_one_to_many_relationship(self):
        """Test 1:N relationship transformation"""
        erd = {
            "name": "test_db",
            "entities": [
                {
                    "name": "users",
                    "attributes": [{"name": "id", "type": "Integer", "primary_key": True}]
                },
                {
                    "name": "posts",
                    "attributes": [{"name": "id", "type": "Integer", "primary_key": True}]
                }
            ],
            "relationships": [
                {
                    "from_entity": "users",
                    "to_entity": "posts",
                    "type": "1:N",
                    "from_attribute": "id",
                    "to_attribute": "user_id"
                }
            ]
        }
        
        transformer = ERDToDSDTransformer()
        dsd = transformer.transform(erd)
        
        posts_table = next(t for t in dsd.tables if t.name == "posts")
        
        # Check FK column added
        user_id_col = next((c for c in posts_table.columns if c.name == "user_id"), None)
        assert user_id_col is not None
        
        # Check FK constraint
        fk_constraints = [c for c in posts_table.constraints if c.type == ConstraintType.FOREIGN_KEY]
        assert len(fk_constraints) == 1
        assert fk_constraints[0].referenced_table == "users"
    
    def test_many_to_many_relationship(self):
        """Test N:M relationship creates junction table"""
        erd = {
            "name": "test_db",
            "entities": [
                {
                    "name": "students",
                    "attributes": [{"name": "id", "type": "Integer", "primary_key": True}]
                },
                {
                    "name": "courses",
                    "attributes": [{"name": "id", "type": "Integer", "primary_key": True}]
                }
            ],
            "relationships": [
                {
                    "from_entity": "students",
                    "to_entity": "courses",
                    "type": "N:M",
                    "junction_table": "enrollments"
                }
            ]
        }
        
        transformer = ERDToDSDTransformer()
        dsd = transformer.transform(erd)
        
        # Should have 3 tables now
        assert len(dsd.tables) == 3
        
        # Check junction table exists
        junction_table = next((t for t in dsd.tables if t.name == "enrollments"), None)
        assert junction_table is not None
        assert len(junction_table.columns) == 2
        
        # Check composite PK
        pk_constraints = [c for c in junction_table.constraints if c.type == ConstraintType.PRIMARY_KEY]
        assert len(pk_constraints) == 1
        assert len(pk_constraints[0].columns) == 2
    
    def test_unique_constraint(self):
        """Test unique constraint creation"""
        erd = {
            "name": "test_db",
            "entities": [
                {
                    "name": "users",
                    "attributes": [
                        {"name": "id", "type": "Integer", "primary_key": True},
                        {"name": "email", "type": "String", "unique": True}
                    ]
                }
            ]
        }
        
        transformer = ERDToDSDTransformer()
        dsd = transformer.transform(erd)
        
        unique_constraints = [c for c in dsd.tables[0].constraints if c.type == ConstraintType.UNIQUE]
        assert len(unique_constraints) == 1
        assert unique_constraints[0].columns == ['email']
    
    def test_column_nullable(self):
        """Test nullable column handling"""
        erd = {
            "name": "test_db",
            "entities": [
                {
                    "name": "users",
                    "attributes": [
                        {"name": "id", "type": "Integer", "primary_key": True},
                        {"name": "name", "type": "String", "nullable": False}
                    ]
                }
            ]
        }
        
        transformer = ERDToDSDTransformer()
        dsd = transformer.transform(erd)
        
        name_col = next(c for c in dsd.tables[0].columns if c.name == "name")
        assert name_col.nullable == False


class TestConstraintMapper:
    """Test constraint analysis"""
    
    def test_missing_primary_key_detection(self):
        """Test detection of missing primary keys"""
        erd = {
            "entities": [
                {
                    "name": "users",
                    "attributes": [
                        {"name": "name", "type": "String"}
                    ]
                }
            ]
        }
        
        analyzer = ConstraintAnalyzer()
        violations = analyzer.analyze_erd(erd)
        
        pk_violations = [v for v in violations if v.type == ConstraintViolationType.MISSING_PRIMARY_KEY]
        assert len(pk_violations) == 1
    
    def test_missing_referenced_table(self):
        """Test detection of invalid table references"""
        erd = {
            "entities": [
                {"name": "users", "attributes": [{"name": "id", "type": "Integer", "primary_key": True}]}
            ],
            "relationships": [
                {
                    "from_entity": "users",
                    "to_entity": "posts",  # Doesn't exist
                    "type": "1:N"
                }
            ]
        }
        
        analyzer = ConstraintAnalyzer()
        violations = analyzer.analyze_erd(erd)
        
        ref_violations = [v for v in violations if v.type == ConstraintViolationType.MISSING_REFERENCED_TABLE]
        assert len(ref_violations) > 0
    
    def test_constraint_name_generation(self):
        """Test constraint name generators"""
        assert ConstraintGenerator.generate_pk_name("users") == "pk_users"
        assert ConstraintGenerator.generate_fk_name("posts", "users") == "fk_posts_users"
        assert ConstraintGenerator.generate_unique_name("users", "email") == "uq_users_email"


class TestValidationService:
    """Test DSD validation"""
    
    def test_valid_schema(self):
        """Test validation of a valid schema"""
        dsd = DSDSchema(name="test_db")
        table = DSDTable(name="users")
        table.columns.append(DSDColumn(name="id", sql_type="INTEGER", nullable=False))
        table.constraints.append(DSDConstraint(
            name="pk_users",
            type=ConstraintType.PRIMARY_KEY,
            columns=["id"]
        ))
        dsd.tables.append(table)
        
        validator = DSDValidator()
        result = validator.validate(dsd)
        
        assert result['errors'] == 0
    
    def test_missing_columns(self):
        """Test detection of tables without columns"""
        dsd = DSDSchema(name="test_db")
        table = DSDTable(name="users")  # No columns
        dsd.tables.append(table)
        
        validator = DSDValidator()
        result = validator.validate(dsd)
        
        assert result['errors'] > 0
    
    def test_duplicate_column_names(self):
        """Test detection of duplicate column names"""
        dsd = DSDSchema(name="test_db")
        table = DSDTable(name="users")
        table.columns.append(DSDColumn(name="id", sql_type="INTEGER"))
        table.columns.append(DSDColumn(name="id", sql_type="VARCHAR(100)"))  # Duplicate
        dsd.tables.append(table)
        
        validator = DSDValidator()
        result = validator.validate(dsd)
        
        assert result['errors'] > 0


class TestSQLFormatter:
    """Test SQL generation"""
    
    def test_create_table_statement(self):
        """Test CREATE TABLE generation"""
        formatter = SQLFormatter('postgresql')
        
        table = DSDTable(name="users")
        table.columns.append(DSDColumn(name="id", sql_type="INTEGER", nullable=False))
        table.columns.append(DSDColumn(name="name", sql_type="VARCHAR(100)"))
        table.constraints.append(DSDConstraint(
            name="pk_users",
            type=ConstraintType.PRIMARY_KEY,
            columns=["id"]
        ))
        
        sql = formatter._format_create_table(table)
        
        assert "CREATE TABLE" in sql
        assert "users" in sql
        assert "id INTEGER NOT NULL" in sql
        assert "PRIMARY KEY" in sql
    
    def test_foreign_key_statement(self):
        """Test foreign key generation"""
        formatter = SQLFormatter('postgresql')
        
        constraint = DSDConstraint(
            name="fk_posts_users",
            type=ConstraintType.FOREIGN_KEY,
            columns=["user_id"],
            referenced_table="users",
            referenced_columns=["id"],
            on_delete="CASCADE"
        )
        
        sql = formatter._format_foreign_key_constraint("posts", constraint)
        
        assert "FOREIGN KEY" in sql
        assert "REFERENCES" in sql
        assert "users" in sql
        assert "ON DELETE CASCADE" in sql
    
    def test_dialect_specific_quoting(self):
        """Test identifier quoting per dialect"""
        pg_formatter = SQLFormatter('postgresql')
        mysql_formatter = SQLFormatter('mysql')
        
        assert pg_formatter._quote_identifier("user id") == '"user id"'
        assert mysql_formatter._quote_identifier("user_id") == "`user_id`"


class TestIntegration:
    """Integration tests for complete workflow"""
    
    def test_complete_transformation_workflow(self):
        """Test complete ERD to SQL transformation"""
        # Define ERD
        erd = {
            "name": "blog",
            "entities": [
                {
                    "name": "users",
                    "attributes": [
                        {"name": "id", "type": "Integer", "primary_key": True, "auto_increment": True},
                        {"name": "email", "type": "String", "unique": True, "nullable": False},
                        {"name": "name", "type": "String", "length": 100}
                    ]
                },
                {
                    "name": "posts",
                    "attributes": [
                        {"name": "id", "type": "Integer", "primary_key": True, "auto_increment": True},
                        {"name": "title", "type": "String", "length": 200},
                        {"name": "content", "type": "Text"}
                    ]
                }
            ],
            "relationships": [
                {
                    "from_entity": "users",
                    "to_entity": "posts",
                    "type": "1:N",
                    "from_attribute": "id",
                    "to_attribute": "user_id"
                }
            ]
        }
        
        # Transform
        transformer = ERDToDSDTransformer('postgresql')
        dsd = transformer.transform(erd)
        
        # Validate
        validator = DSDValidator()
        validation_result = validator.validate(dsd)
        assert validation_result['errors'] == 0
        
        # Generate SQL
        generator = SQLScriptGenerator('postgresql')
        sql = generator.generate_full_script(dsd)
        
        # Verify SQL contains expected elements
        assert "CREATE TABLE" in sql
        assert "users" in sql
        assert "posts" in sql
        assert "FOREIGN KEY" in sql
        assert "PRIMARY KEY" in sql
        assert "UNIQUE" in sql


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
