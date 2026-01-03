"""
Normalization Algorithms
Implements BCNF and 3NF decomposition algorithms for database schema normalization
"""
from typing import List, Set, Dict, Any, Tuple, Optional
from dataclasses import dataclass, field
from .fd_parser import (
    FunctionalDependency, 
    compute_closure, 
    find_candidate_keys,
    get_prime_attributes,
    is_bcnf_violation,
    is_3nf_violation
)


@dataclass
class Table:
    """Represents a database table"""
    name: str
    columns: List[Dict[str, Any]]
    constraints: List[Dict[str, Any]] = field(default_factory=list)
    indexes: List[Dict[str, Any]] = field(default_factory=list)
    description: str = ""
    
    def get_column_names(self) -> Set[str]:
        """Get set of all column names"""
        return {col['name'] for col in self.columns}
    
    def get_column(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a column by name"""
        for col in self.columns:
            if col['name'] == name:
                return col
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'name': self.name,
            'columns': self.columns,
            'constraints': self.constraints,
            'indexes': self.indexes,
            'description': self.description
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Table':
        """Create from dictionary"""
        return cls(
            name=data['name'],
            columns=data.get('columns', []),
            constraints=data.get('constraints', []),
            indexes=data.get('indexes', []),
            description=data.get('description', '')
        )


@dataclass
class DecompositionChange:
    """Represents a change made during decomposition"""
    change_type: str  # 'table_split', 'table_created', 'column_moved', 'fk_added'
    original_table: str
    new_tables: List[str] = field(default_factory=list)
    reason: str = ""
    fd_violated: Optional[str] = None
    columns_affected: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'type': self.change_type,
            'original_table': self.original_table,
            'new_tables': self.new_tables,
            'reason': self.reason,
            'fd_violated': self.fd_violated,
            'columns_affected': self.columns_affected
        }


@dataclass
class NormalizationResult:
    """Result of normalization process"""
    success: bool
    original_tables: List[Table]
    normalized_tables: List[Table]
    changes: List[DecompositionChange]
    normalization_type: str  # 'BCNF' or '3NF'
    violations_found: List[Dict[str, Any]] = field(default_factory=list)
    is_already_normalized: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'success': self.success,
            'original': {
                'tables': [t.to_dict() for t in self.original_tables]
            },
            'normalized': {
                'tables': [t.to_dict() for t in self.normalized_tables]
            },
            'changes': [c.to_dict() for c in self.changes],
            'normalization_type': self.normalization_type,
            'violations_found': self.violations_found,
            'is_already_normalized': self.is_already_normalized
        }


class BCNFDecomposer:
    """
    Implements BCNF decomposition algorithm.
    
    BCNF (Boyce-Codd Normal Form) requires that for every non-trivial FD X -> Y,
    X must be a superkey of the relation.
    
    The algorithm:
    1. Find a BCNF violation (X -> Y where X is not a superkey)
    2. Decompose R into R1(XY) and R2(R - Y + X)
    3. Project FDs onto each new relation
    4. Repeat until all relations are in BCNF
    """
    
    def __init__(self):
        self.changes: List[DecompositionChange] = []
        self.table_counter: Dict[str, int] = {}
    
    def decompose(self, table: Table, fds: List[FunctionalDependency]) -> List[Table]:
        """
        Decompose a table into BCNF.
        
        Args:
            table: The table to decompose
            fds: Functional dependencies for the table
            
        Returns:
            List of tables in BCNF
        """
        self.changes = []
        self.table_counter = {}
        
        all_attrs = table.get_column_names()
        
        # Filter FDs to only those relevant to this table
        relevant_fds = [
            fd for fd in fds 
            if fd.determinant.issubset(all_attrs) and fd.dependent.issubset(all_attrs)
        ]
        
        result = self._decompose_recursive(table, relevant_fds)
        return result
    
    def _decompose_recursive(self, table: Table, fds: List[FunctionalDependency]) -> List[Table]:
        """Recursively decompose until BCNF is achieved"""
        all_attrs = table.get_column_names()
        
        # Find a BCNF violation
        violation = None
        for fd in fds:
            if fd.determinant.issubset(all_attrs) and not fd.dependent.issubset(fd.determinant):
                if is_bcnf_violation(fd, all_attrs, fds):
                    violation = fd
                    break
        
        if violation is None:
            # Table is already in BCNF
            return [table]
        
        # Decompose: R1 = XY (determinant + dependent), R2 = X + (R - Y)
        x = violation.determinant
        y = violation.dependent - x  # Non-trivial part of dependent
        
        # R1 gets X union Y
        r1_attrs = x.union(y)
        # R2 gets all original attrs minus Y, plus X
        r2_attrs = (all_attrs - y).union(x)
        
        # Generate unique table names
        base_name = table.name
        r1_name = self._generate_table_name(base_name, list(x)[0] if len(x) == 1 else 'detail')
        r2_name = self._generate_table_name(base_name, 'main') if r2_attrs != all_attrs else table.name
        
        # Create new tables with columns from original
        r1_table = self._create_table_subset(table, r1_attrs, r1_name)
        r2_table = self._create_table_subset(table, r2_attrs, r2_name)
        
        # Set primary key for R1 as the determinant
        self._set_primary_key(r1_table, x)
        
        # Add foreign key from R2 to R1
        self._add_foreign_key(r2_table, r1_table, x)
        
        # Record the change
        self.changes.append(DecompositionChange(
            change_type='table_split',
            original_table=table.name,
            new_tables=[r1_name, r2_name],
            reason=f"BCNF violation: {violation}",
            fd_violated=str(violation),
            columns_affected=list(y)
        ))
        
        # Project FDs onto each new relation
        r1_fds = self._project_fds(fds, r1_attrs)
        r2_fds = self._project_fds(fds, r2_attrs)
        
        # Recursively decompose
        result = []
        result.extend(self._decompose_recursive(r1_table, r1_fds))
        result.extend(self._decompose_recursive(r2_table, r2_fds))
        
        return result
    
    def _generate_table_name(self, base_name: str, suffix: str) -> str:
        """Generate a unique table name"""
        name = f"{base_name}_{suffix}"
        if name not in self.table_counter:
            self.table_counter[name] = 0
        else:
            self.table_counter[name] += 1
            name = f"{name}_{self.table_counter[name]}"
        return name
    
    def _create_table_subset(self, original: Table, attrs: Set[str], new_name: str) -> Table:
        """Create a new table with a subset of columns"""
        new_columns = [
            col.copy() for col in original.columns 
            if col['name'] in attrs
        ]
        
        return Table(
            name=new_name,
            columns=new_columns,
            description=f"Decomposed from {original.name}"
        )
    
    def _set_primary_key(self, table: Table, key_attrs: Set[str]) -> None:
        """Set the primary key constraint for a table"""
        pk_constraint = {
            'name': f"pk_{table.name}",
            'type': 'PRIMARY KEY',
            'columns': list(key_attrs)
        }
        table.constraints = [c for c in table.constraints if c.get('type') != 'PRIMARY KEY']
        table.constraints.append(pk_constraint)
    
    def _add_foreign_key(self, source_table: Table, target_table: Table, 
                         fk_attrs: Set[str]) -> None:
        """Add a foreign key constraint"""
        fk_constraint = {
            'name': f"fk_{source_table.name}_{target_table.name}",
            'type': 'FOREIGN KEY',
            'columns': list(fk_attrs),
            'referenced_table': target_table.name,
            'referenced_columns': list(fk_attrs),
            'on_delete': 'CASCADE',
            'on_update': 'CASCADE'
        }
        source_table.constraints.append(fk_constraint)
    
    def _project_fds(self, fds: List[FunctionalDependency], 
                     attrs: Set[str]) -> List[FunctionalDependency]:
        """Project functional dependencies onto a set of attributes"""
        projected = []
        
        for fd in fds:
            # Only include FDs where both sides are in the attribute set
            if fd.determinant.issubset(attrs):
                projected_dependent = fd.dependent.intersection(attrs)
                if projected_dependent and projected_dependent != fd.determinant:
                    projected.append(FunctionalDependency(
                        determinant=fd.determinant.copy(),
                        dependent=projected_dependent
                    ))
        
        return projected


class ThreeNFDecomposer:
    """
    Implements 3NF decomposition algorithm using Synthesis approach.
    
    3NF (Third Normal Form) requires that for every non-trivial FD X -> Y,
    either X is a superkey OR Y consists entirely of prime attributes.
    
    The Synthesis algorithm:
    1. Compute minimal cover of FDs
    2. For each FD X -> Y in minimal cover, create relation R(XY)
    3. If no relation contains a candidate key, add one
    4. Remove redundant relations
    """
    
    def __init__(self):
        self.changes: List[DecompositionChange] = []
        self.table_counter: Dict[str, int] = {}
    
    def decompose(self, table: Table, fds: List[FunctionalDependency]) -> List[Table]:
        """
        Decompose a table into 3NF using synthesis algorithm.
        
        Args:
            table: The table to decompose
            fds: Functional dependencies for the table
            
        Returns:
            List of tables in 3NF
        """
        self.changes = []
        self.table_counter = {}
        
        all_attrs = table.get_column_names()
        
        # Filter FDs to only those relevant to this table
        relevant_fds = [
            fd for fd in fds 
            if fd.determinant.issubset(all_attrs) and fd.dependent.issubset(all_attrs)
        ]
        
        # Step 1: Compute minimal cover
        minimal_cover = self._compute_minimal_cover(relevant_fds)
        
        if not minimal_cover:
            return [table]
        
        # Step 2: Group FDs by determinant and create relations
        grouped_fds = self._group_by_determinant(minimal_cover)
        result_tables = []
        
        for determinant, dependents in grouped_fds.items():
            det_set = set(determinant)
            dep_set = set()
            for dep in dependents:
                dep_set.update(dep)
            
            attrs = det_set.union(dep_set)
            table_name = self._generate_table_name(table.name, '_'.join(sorted(det_set)))
            
            new_table = self._create_table_subset(table, attrs, table_name)
            self._set_primary_key(new_table, det_set)
            result_tables.append(new_table)
            
            self.changes.append(DecompositionChange(
                change_type='table_created',
                original_table=table.name,
                new_tables=[table_name],
                reason=f"3NF synthesis for FD: {', '.join(det_set)} -> {', '.join(dep_set)}",
                columns_affected=list(attrs)
            ))
        
        # Step 3: Ensure at least one relation contains a candidate key
        candidate_keys = find_candidate_keys(all_attrs, relevant_fds)
        key_covered = False
        
        for key in candidate_keys:
            for t in result_tables:
                if key.issubset(t.get_column_names()):
                    key_covered = True
                    break
            if key_covered:
                break
        
        if not key_covered and candidate_keys:
            # Add a relation for the candidate key
            key = candidate_keys[0]
            key_table_name = self._generate_table_name(table.name, 'key')
            key_table = self._create_table_subset(table, key, key_table_name)
            self._set_primary_key(key_table, key)
            result_tables.append(key_table)
            
            self.changes.append(DecompositionChange(
                change_type='table_created',
                original_table=table.name,
                new_tables=[key_table_name],
                reason=f"Added to preserve candidate key: {', '.join(key)}",
                columns_affected=list(key)
            ))
        
        # Step 4: Remove redundant relations (those whose schema is subset of another)
        result_tables = self._remove_redundant_tables(result_tables)
        
        # Add foreign keys between tables
        self._add_foreign_keys(result_tables, minimal_cover)
        
        return result_tables
    
    def _compute_minimal_cover(self, fds: List[FunctionalDependency]) -> List[FunctionalDependency]:
        """
        Compute the minimal cover (canonical cover) of functional dependencies.
        
        Steps:
        1. Decompose right-hand sides to single attributes
        2. Remove extraneous attributes from left-hand sides
        3. Remove redundant FDs
        """
        # Step 1: Decompose to single-attribute right-hand sides
        decomposed = []
        for fd in fds:
            for attr in fd.dependent:
                if attr not in fd.determinant:  # Skip trivial parts
                    decomposed.append(FunctionalDependency(
                        determinant=fd.determinant.copy(),
                        dependent={attr}
                    ))
        
        # Step 2: Remove extraneous attributes from left-hand sides
        minimized = []
        for fd in decomposed:
            minimal_det = fd.determinant.copy()
            for attr in fd.determinant:
                # Try removing this attribute
                test_det = minimal_det - {attr}
                if test_det:
                    # Check if closure still includes the dependent
                    test_fds = [f for f in decomposed if f != fd] + [
                        FunctionalDependency(test_det, fd.dependent)
                    ]
                    closure = compute_closure(test_det, decomposed)
                    if fd.dependent.issubset(closure):
                        minimal_det = test_det
            
            minimized.append(FunctionalDependency(minimal_det, fd.dependent))
        
        # Step 3: Remove redundant FDs
        non_redundant = []
        for fd in minimized:
            # Check if fd can be derived from others
            other_fds = [f for f in minimized if f != fd]
            closure = compute_closure(fd.determinant, other_fds)
            if not fd.dependent.issubset(closure):
                non_redundant.append(fd)
        
        # Combine FDs with same determinant
        return non_redundant
    
    def _group_by_determinant(self, fds: List[FunctionalDependency]) -> Dict[tuple, List[Set[str]]]:
        """Group FDs by their determinant"""
        grouped = {}
        for fd in fds:
            key = tuple(sorted(fd.determinant))
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(fd.dependent)
        return grouped
    
    def _generate_table_name(self, base_name: str, suffix: str) -> str:
        """Generate a unique table name"""
        # Clean up suffix
        suffix = suffix.replace(' ', '_').lower()
        name = f"{base_name}_{suffix}"
        if name not in self.table_counter:
            self.table_counter[name] = 0
            return name
        else:
            self.table_counter[name] += 1
            return f"{name}_{self.table_counter[name]}"
    
    def _create_table_subset(self, original: Table, attrs: Set[str], new_name: str) -> Table:
        """Create a new table with a subset of columns"""
        new_columns = [
            col.copy() for col in original.columns 
            if col['name'] in attrs
        ]
        
        return Table(
            name=new_name,
            columns=new_columns,
            description=f"3NF decomposition from {original.name}"
        )
    
    def _set_primary_key(self, table: Table, key_attrs: Set[str]) -> None:
        """Set the primary key constraint for a table"""
        pk_constraint = {
            'name': f"pk_{table.name}",
            'type': 'PRIMARY KEY',
            'columns': list(key_attrs)
        }
        table.constraints = [c for c in table.constraints if c.get('type') != 'PRIMARY KEY']
        table.constraints.append(pk_constraint)
    
    def _remove_redundant_tables(self, tables: List[Table]) -> List[Table]:
        """Remove tables whose schema is a subset of another table's schema"""
        non_redundant = []
        
        for t1 in tables:
            is_redundant = False
            t1_attrs = t1.get_column_names()
            
            for t2 in tables:
                if t1 != t2:
                    t2_attrs = t2.get_column_names()
                    if t1_attrs.issubset(t2_attrs) and t1_attrs != t2_attrs:
                        is_redundant = True
                        break
            
            if not is_redundant:
                non_redundant.append(t1)
        
        return non_redundant
    
    def _add_foreign_keys(self, tables: List[Table], fds: List[FunctionalDependency]) -> None:
        """Add foreign key constraints between tables based on shared columns"""
        for i, t1 in enumerate(tables):
            t1_attrs = t1.get_column_names()
            
            # Find primary key of t1
            t1_pk = None
            for c in t1.constraints:
                if c.get('type') == 'PRIMARY KEY':
                    t1_pk = set(c['columns'])
                    break
            
            if not t1_pk:
                continue
            
            for j, t2 in enumerate(tables):
                if i == j:
                    continue
                    
                t2_attrs = t2.get_column_names()
                
                # If t2 contains t1's primary key, add FK
                if t1_pk.issubset(t2_attrs) and t1_pk != t2_attrs:
                    # Check if FK already exists
                    fk_exists = False
                    for c in t2.constraints:
                        if (c.get('type') == 'FOREIGN KEY' and 
                            c.get('referenced_table') == t1.name):
                            fk_exists = True
                            break
                    
                    if not fk_exists:
                        fk_constraint = {
                            'name': f"fk_{t2.name}_{t1.name}",
                            'type': 'FOREIGN KEY',
                            'columns': list(t1_pk),
                            'referenced_table': t1.name,
                            'referenced_columns': list(t1_pk),
                            'on_delete': 'CASCADE',
                            'on_update': 'CASCADE'
                        }
                        t2.constraints.append(fk_constraint)


def check_normalization_level(table: Table, fds: List[FunctionalDependency]) -> Dict[str, Any]:
    """
    Check the current normalization level of a table.
    
    Returns dict with:
    - is_bcnf: bool
    - is_3nf: bool
    - violations: list of FDs that violate each normal form
    """
    all_attrs = table.get_column_names()
    relevant_fds = [
        fd for fd in fds 
        if fd.determinant.issubset(all_attrs) and fd.dependent.issubset(all_attrs)
    ]
    
    bcnf_violations = []
    tnf_violations = []
    
    for fd in relevant_fds:
        if is_bcnf_violation(fd, all_attrs, relevant_fds):
            bcnf_violations.append({
                'fd': str(fd),
                'determinant': list(fd.determinant),
                'dependent': list(fd.dependent)
            })
        
        if is_3nf_violation(fd, all_attrs, relevant_fds):
            tnf_violations.append({
                'fd': str(fd),
                'determinant': list(fd.determinant),
                'dependent': list(fd.dependent)
            })
    
    return {
        'is_bcnf': len(bcnf_violations) == 0,
        'is_3nf': len(tnf_violations) == 0,
        'bcnf_violations': bcnf_violations,
        '3nf_violations': tnf_violations,
        'candidate_keys': [list(k) for k in find_candidate_keys(all_attrs, relevant_fds)]
    }


def normalize_schema(dsd: Dict[str, Any], fds: List[FunctionalDependency], 
                     normalization_type: str = 'BCNF') -> NormalizationResult:
    """
    Normalize an entire DSD schema to the specified normal form.
    
    Args:
        dsd: DSD dictionary with 'tables' key
        fds: List of functional dependencies (applied to all tables)
        normalization_type: 'BCNF' or '3NF'
        
    Returns:
        NormalizationResult with original and normalized schemas
    """
    original_tables = [Table.from_dict(t) for t in dsd.get('tables', [])]
    normalized_tables = []
    all_changes = []
    all_violations = []
    all_already_normalized = True
    
    for table in original_tables:
        # Get FDs relevant to this table
        table_attrs = table.get_column_names()
        table_fds = [
            fd for fd in fds 
            if fd.determinant.issubset(table_attrs) and 
               (fd.dependent.issubset(table_attrs) or 
                len(fd.dependent.intersection(table_attrs)) > 0)
        ]
        
        # Adjust FDs to only include attributes in this table
        adjusted_fds = []
        for fd in table_fds:
            adjusted_dep = fd.dependent.intersection(table_attrs)
            if adjusted_dep and not adjusted_dep.issubset(fd.determinant):
                adjusted_fds.append(FunctionalDependency(
                    determinant=fd.determinant,
                    dependent=adjusted_dep
                ))
        
        # Check current normalization level
        norm_check = check_normalization_level(table, adjusted_fds)
        
        if normalization_type == 'BCNF':
            if norm_check['is_bcnf']:
                normalized_tables.append(table)
            else:
                all_already_normalized = False
                all_violations.extend([
                    {'table': table.name, **v} for v in norm_check['bcnf_violations']
                ])
                
                decomposer = BCNFDecomposer()
                decomposed = decomposer.decompose(table, adjusted_fds)
                normalized_tables.extend(decomposed)
                all_changes.extend(decomposer.changes)
        else:  # 3NF
            if norm_check['is_3nf']:
                normalized_tables.append(table)
            else:
                all_already_normalized = False
                all_violations.extend([
                    {'table': table.name, **v} for v in norm_check['3nf_violations']
                ])
                
                decomposer = ThreeNFDecomposer()
                decomposed = decomposer.decompose(table, adjusted_fds)
                normalized_tables.extend(decomposed)
                all_changes.extend(decomposer.changes)
    
    return NormalizationResult(
        success=True,
        original_tables=original_tables,
        normalized_tables=normalized_tables,
        changes=all_changes,
        normalization_type=normalization_type,
        violations_found=all_violations,
        is_already_normalized=all_already_normalized
    )
