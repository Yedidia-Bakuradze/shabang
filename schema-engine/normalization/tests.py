"""
Tests for Normalization Algorithms
"""
import unittest
from .fd_parser import (
    FunctionalDependency,
    parse_fd_string,
    parse_fd_list,
    compute_closure,
    find_candidate_keys,
    get_prime_attributes,
    is_bcnf_violation,
    is_3nf_violation
)
from .algorithms import (
    Table,
    BCNFDecomposer,
    ThreeNFDecomposer,
    check_normalization_level,
    normalize_schema
)


class TestFDParser(unittest.TestCase):
    """Tests for FD parsing functions"""
    
    def test_parse_fd_string_simple(self):
        """Test parsing simple FD string"""
        fds = parse_fd_string("A -> B")
        self.assertEqual(len(fds), 1)
        self.assertEqual(fds[0].determinant, {'A'})
        self.assertEqual(fds[0].dependent, {'B'})
    
    def test_parse_fd_string_multiple_attrs(self):
        """Test parsing FD with multiple attributes"""
        fds = parse_fd_string("A, B -> C, D")
        self.assertEqual(len(fds), 1)
        self.assertEqual(fds[0].determinant, {'A', 'B'})
        self.assertEqual(fds[0].dependent, {'C', 'D'})
    
    def test_parse_fd_string_multiple_lines(self):
        """Test parsing multiple FDs"""
        fds = parse_fd_string("A -> B\nC -> D")
        self.assertEqual(len(fds), 2)
    
    def test_parse_fd_list(self):
        """Test parsing FD from list format"""
        fd_list = [
            {'determinant': ['A', 'B'], 'dependent': ['C']},
            {'determinant': ['D'], 'dependent': ['E', 'F']}
        ]
        fds = parse_fd_list(fd_list)
        self.assertEqual(len(fds), 2)
        self.assertEqual(fds[0].determinant, {'A', 'B'})
        self.assertEqual(fds[0].dependent, {'C'})


class TestClosure(unittest.TestCase):
    """Tests for closure computation"""
    
    def test_simple_closure(self):
        """Test simple closure computation"""
        fds = [
            FunctionalDependency({'A'}, {'B'}),
            FunctionalDependency({'B'}, {'C'})
        ]
        closure = compute_closure({'A'}, fds)
        self.assertEqual(closure, {'A', 'B', 'C'})
    
    def test_closure_with_composite_key(self):
        """Test closure with composite determinant"""
        fds = [
            FunctionalDependency({'A', 'B'}, {'C'}),
            FunctionalDependency({'C'}, {'D'})
        ]
        closure = compute_closure({'A', 'B'}, fds)
        self.assertEqual(closure, {'A', 'B', 'C', 'D'})


class TestCandidateKeys(unittest.TestCase):
    """Tests for candidate key finding"""
    
    def test_find_single_key(self):
        """Test finding a single candidate key"""
        all_attrs = {'A', 'B', 'C'}
        fds = [
            FunctionalDependency({'A'}, {'B', 'C'})
        ]
        keys = find_candidate_keys(all_attrs, fds)
        self.assertEqual(len(keys), 1)
        self.assertEqual(keys[0], {'A'})
    
    def test_find_composite_key(self):
        """Test finding composite candidate key"""
        all_attrs = {'A', 'B', 'C', 'D'}
        fds = [
            FunctionalDependency({'A', 'B'}, {'C', 'D'})
        ]
        keys = find_candidate_keys(all_attrs, fds)
        self.assertEqual(len(keys), 1)
        self.assertEqual(keys[0], {'A', 'B'})


class TestBCNFViolation(unittest.TestCase):
    """Tests for BCNF violation detection"""
    
    def test_bcnf_violation_detected(self):
        """Test detecting BCNF violation"""
        all_attrs = {'A', 'B', 'C'}
        fds = [
            FunctionalDependency({'A'}, {'B'}),  # A is not superkey if key is AC
            FunctionalDependency({'A', 'C'}, {'B'})  # This makes AC the key
        ]
        # A -> B violates BCNF because A is not a superkey
        violation = is_bcnf_violation(fds[0], all_attrs, fds)
        self.assertTrue(violation)
    
    def test_no_bcnf_violation(self):
        """Test no BCNF violation when determinant is superkey"""
        all_attrs = {'A', 'B', 'C'}
        fds = [
            FunctionalDependency({'A'}, {'B', 'C'})  # A determines everything
        ]
        # A -> B is fine because A is a superkey
        violation = is_bcnf_violation(fds[0], all_attrs, fds)
        self.assertFalse(violation)


class TestBCNFDecomposer(unittest.TestCase):
    """Tests for BCNF decomposition"""
    
    def test_simple_decomposition(self):
        """Test simple BCNF decomposition"""
        table = Table(
            name='R',
            columns=[
                {'name': 'A', 'sql_type': 'INTEGER'},
                {'name': 'B', 'sql_type': 'VARCHAR'},
                {'name': 'C', 'sql_type': 'VARCHAR'}
            ]
        )
        # A -> B, C -> B would cause violation
        # But for this test: A,C is key, B depends only on A
        fds = [
            FunctionalDependency({'A'}, {'B'}),
        ]
        
        decomposer = BCNFDecomposer()
        # This should work without error
        result = decomposer.decompose(table, fds)
        self.assertIsInstance(result, list)
        self.assertTrue(len(result) >= 1)


class Test3NFDecomposer(unittest.TestCase):
    """Tests for 3NF decomposition"""
    
    def test_simple_3nf_decomposition(self):
        """Test simple 3NF decomposition using synthesis"""
        table = Table(
            name='Employee',
            columns=[
                {'name': 'EmpID', 'sql_type': 'INTEGER'},
                {'name': 'Name', 'sql_type': 'VARCHAR'},
                {'name': 'DeptID', 'sql_type': 'INTEGER'},
                {'name': 'DeptName', 'sql_type': 'VARCHAR'}
            ]
        )
        fds = [
            FunctionalDependency({'EmpID'}, {'Name', 'DeptID'}),
            FunctionalDependency({'DeptID'}, {'DeptName'})
        ]
        
        decomposer = ThreeNFDecomposer()
        result = decomposer.decompose(table, fds)
        
        self.assertIsInstance(result, list)
        self.assertTrue(len(result) >= 1)


class TestNormalizeSchema(unittest.TestCase):
    """Integration tests for full schema normalization"""
    
    def test_normalize_to_bcnf(self):
        """Test normalizing a schema to BCNF"""
        dsd = {
            'name': 'test_db',
            'tables': [{
                'name': 'Orders',
                'columns': [
                    {'name': 'order_id', 'sql_type': 'INTEGER'},
                    {'name': 'customer_id', 'sql_type': 'INTEGER'},
                    {'name': 'customer_name', 'sql_type': 'VARCHAR'},
                    {'name': 'order_date', 'sql_type': 'DATE'}
                ],
                'constraints': [],
                'indexes': []
            }]
        }
        
        fds = [
            FunctionalDependency({'order_id'}, {'customer_id', 'order_date'}),
            FunctionalDependency({'customer_id'}, {'customer_name'})
        ]
        
        result = normalize_schema(dsd, fds, 'BCNF')
        
        self.assertTrue(result.success)
        self.assertIsNotNone(result.normalized_tables)
    
    def test_already_normalized(self):
        """Test schema that's already in normal form"""
        dsd = {
            'name': 'test_db',
            'tables': [{
                'name': 'Users',
                'columns': [
                    {'name': 'user_id', 'sql_type': 'INTEGER'},
                    {'name': 'name', 'sql_type': 'VARCHAR'},
                    {'name': 'email', 'sql_type': 'VARCHAR'}
                ],
                'constraints': [],
                'indexes': []
            }]
        }
        
        fds = [
            FunctionalDependency({'user_id'}, {'name', 'email'})
        ]
        
        result = normalize_schema(dsd, fds, 'BCNF')
        
        self.assertTrue(result.success)
        # Should be already normalized
        self.assertTrue(result.is_already_normalized or len(result.changes) == 0)


if __name__ == '__main__':
    unittest.main()
