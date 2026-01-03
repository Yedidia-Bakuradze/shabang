"""
Functional Dependency Parser
Parses functional dependencies from various input formats
"""
import re
from typing import List, Set, Tuple, Dict, Any
from dataclasses import dataclass


@dataclass
class FunctionalDependency:
    """Represents a functional dependency X -> Y"""
    determinant: Set[str]  # Left-hand side (X)
    dependent: Set[str]    # Right-hand side (Y)
    
    def __hash__(self):
        return hash((frozenset(self.determinant), frozenset(self.dependent)))
    
    def __eq__(self, other):
        if not isinstance(other, FunctionalDependency):
            return False
        return (frozenset(self.determinant) == frozenset(other.determinant) and
                frozenset(self.dependent) == frozenset(other.dependent))
    
    def __repr__(self):
        det = ', '.join(sorted(self.determinant))
        dep = ', '.join(sorted(self.dependent))
        return f"{det} -> {dep}"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'determinant': list(self.determinant),
            'dependent': list(self.dependent)
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FunctionalDependency':
        return cls(
            determinant=set(data['determinant']),
            dependent=set(data['dependent'])
        )


def parse_fd_string(fd_string: str) -> List[FunctionalDependency]:
    """
    Parse functional dependencies from a string format.
    
    Supported formats:
    - "A, B -> C, D" (comma-separated attributes)
    - "A B -> C D" (space-separated attributes)
    - "AB -> CD" (concatenated single-letter attributes)
    - Multiple FDs separated by newlines or semicolons
    
    Args:
        fd_string: String containing functional dependencies
        
    Returns:
        List of FunctionalDependency objects
    """
    fds = []
    
    # Split by newlines or semicolons for multiple FDs
    fd_lines = re.split(r'[;\n]', fd_string)
    
    for line in fd_lines:
        line = line.strip()
        if not line or '->' not in line:
            continue
            
        # Split by arrow
        parts = line.split('->')
        if len(parts) != 2:
            continue
            
        left_part = parts[0].strip()
        right_part = parts[1].strip()
        
        # Parse attributes (handle comma-separated, space-separated, or concatenated)
        determinant = parse_attribute_list(left_part)
        dependent = parse_attribute_list(right_part)
        
        if determinant and dependent:
            fds.append(FunctionalDependency(
                determinant=set(determinant),
                dependent=set(dependent)
            ))
    
    return fds


def parse_attribute_list(attr_string: str) -> List[str]:
    """
    Parse a list of attributes from various formats.
    
    Args:
        attr_string: String containing attributes
        
    Returns:
        List of attribute names
    """
    attr_string = attr_string.strip()
    
    if not attr_string:
        return []
    
    # Check for comma-separated format first (most common)
    if ',' in attr_string:
        attrs = [a.strip() for a in attr_string.split(',')]
        return [a for a in attrs if a]
    
    # Check for space-separated format with multi-character names
    if ' ' in attr_string:
        attrs = [a.strip() for a in attr_string.split()]
        return [a for a in attrs if a]
    
    # If single word with underscores, treat as single attribute
    if '_' in attr_string or attr_string.islower() or attr_string[0].isupper():
        return [attr_string]
    
    # Otherwise, treat as concatenated single-letter attributes (e.g., "ABC")
    return list(attr_string)


def parse_fd_list(fd_list: List[Dict[str, Any]]) -> List[FunctionalDependency]:
    """
    Parse functional dependencies from a structured list format.
    
    Args:
        fd_list: List of dicts with 'determinant' and 'dependent' keys
        
    Returns:
        List of FunctionalDependency objects
    """
    fds = []
    
    for fd_dict in fd_list:
        determinant = fd_dict.get('determinant', [])
        dependent = fd_dict.get('dependent', [])
        
        if determinant and dependent:
            # Handle both list and string formats
            if isinstance(determinant, str):
                determinant = parse_attribute_list(determinant)
            if isinstance(dependent, str):
                dependent = parse_attribute_list(dependent)
                
            fds.append(FunctionalDependency(
                determinant=set(determinant),
                dependent=set(dependent)
            ))
    
    return fds


def compute_closure(attributes: Set[str], fds: List[FunctionalDependency]) -> Set[str]:
    """
    Compute the attribute closure X+ given a set of attributes X and functional dependencies.
    
    This is a key algorithm for normalization - it finds all attributes that can be
    functionally determined from the given set of attributes.
    
    Args:
        attributes: Set of attribute names
        fds: List of functional dependencies
        
    Returns:
        Set of all attributes in the closure
    """
    closure = set(attributes)
    changed = True
    
    while changed:
        changed = False
        for fd in fds:
            # If determinant is subset of closure, add dependent to closure
            if fd.determinant.issubset(closure):
                new_attrs = fd.dependent - closure
                if new_attrs:
                    closure.update(new_attrs)
                    changed = True
    
    return closure


def find_candidate_keys(all_attributes: Set[str], fds: List[FunctionalDependency]) -> List[Set[str]]:
    """
    Find all candidate keys for a relation given its attributes and FDs.
    
    A candidate key is a minimal set of attributes whose closure equals all attributes.
    
    Args:
        all_attributes: Set of all attribute names in the relation
        fds: List of functional dependencies
        
    Returns:
        List of candidate keys (each is a set of attribute names)
    """
    candidate_keys = []
    
    # Start with all attributes and try to find minimal keys
    def is_superkey(attrs: Set[str]) -> bool:
        return compute_closure(attrs, fds) == all_attributes
    
    # Try all possible subsets, starting from smallest
    from itertools import combinations
    
    for size in range(1, len(all_attributes) + 1):
        for combo in combinations(all_attributes, size):
            attr_set = set(combo)
            if is_superkey(attr_set):
                # Check if it's minimal (no proper subset is also a superkey)
                is_minimal = True
                for key in candidate_keys:
                    if key.issubset(attr_set):
                        is_minimal = False
                        break
                
                if is_minimal:
                    # Also check all proper subsets
                    for subset_size in range(1, size):
                        for subset in combinations(attr_set, subset_size):
                            if is_superkey(set(subset)):
                                is_minimal = False
                                break
                        if not is_minimal:
                            break
                    
                    if is_minimal:
                        candidate_keys.append(attr_set)
        
        # Once we find keys at this size, we've found all candidate keys
        if candidate_keys:
            break
    
    return candidate_keys if candidate_keys else [all_attributes]


def get_prime_attributes(all_attributes: Set[str], fds: List[FunctionalDependency]) -> Set[str]:
    """
    Get all prime attributes (attributes that are part of any candidate key).
    
    Args:
        all_attributes: Set of all attribute names
        fds: List of functional dependencies
        
    Returns:
        Set of prime attribute names
    """
    candidate_keys = find_candidate_keys(all_attributes, fds)
    prime_attrs = set()
    
    for key in candidate_keys:
        prime_attrs.update(key)
    
    return prime_attrs


def is_bcnf_violation(fd: FunctionalDependency, all_attributes: Set[str], 
                      fds: List[FunctionalDependency]) -> bool:
    """
    Check if a functional dependency violates BCNF.
    
    A FD X -> Y violates BCNF if:
    1. Y is not a subset of X (non-trivial)
    2. X is not a superkey
    
    Args:
        fd: The functional dependency to check
        all_attributes: Set of all attributes in the relation
        fds: All functional dependencies
        
    Returns:
        True if the FD violates BCNF
    """
    # Trivial FD (Y ⊆ X) doesn't violate BCNF
    if fd.dependent.issubset(fd.determinant):
        return False
    
    # Check if determinant is a superkey
    closure = compute_closure(fd.determinant, fds)
    is_superkey = closure == all_attributes
    
    return not is_superkey


def is_3nf_violation(fd: FunctionalDependency, all_attributes: Set[str], 
                     fds: List[FunctionalDependency]) -> bool:
    """
    Check if a functional dependency violates 3NF.
    
    A FD X -> Y violates 3NF if:
    1. Y is not a subset of X (non-trivial)
    2. X is not a superkey
    3. Y - X contains a non-prime attribute (not part of any candidate key)
    
    Args:
        fd: The functional dependency to check
        all_attributes: Set of all attributes in the relation
        fds: All functional dependencies
        
    Returns:
        True if the FD violates 3NF
    """
    # Trivial FD (Y ⊆ X) doesn't violate 3NF
    if fd.dependent.issubset(fd.determinant):
        return False
    
    # Check if determinant is a superkey
    closure = compute_closure(fd.determinant, fds)
    is_superkey = closure == all_attributes
    
    if is_superkey:
        return False
    
    # Check if dependent attributes (minus determinant) are all prime
    prime_attrs = get_prime_attributes(all_attributes, fds)
    non_trivial_dependent = fd.dependent - fd.determinant
    
    # 3NF violation if any dependent attribute is non-prime
    for attr in non_trivial_dependent:
        if attr not in prime_attrs:
            return True
    
    return False
