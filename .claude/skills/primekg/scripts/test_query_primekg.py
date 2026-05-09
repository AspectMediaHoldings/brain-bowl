import pandas as pd
import pytest
from unittest.mock import patch
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import query_primekg

@pytest.fixture
def mock_kg_data():
    return pd.DataFrame({
        'x_id': ['1', '2', '3', '1'],
        'y_id': ['2', '3', '4', '4'],
        'relation': ['rel1', 'rel2', 'rel3', 'rel1'],
        'display_relation': ['Relation 1', 'Relation 2', 'Relation 3', 'Relation 1'],
        'x_type': ['type_A', 'type_B', 'type_C', 'type_A'],
        'x_name': ['Name A1', 'Name B2', 'Name C3', 'Name A1'],
        'x_source': ['src1', 'src2', 'src3', 'src1'],
        'y_type': ['type_B', 'type_C', 'type_D', 'type_D'],
        'y_name': ['Name B2', 'Name C3', 'Name D4', 'Name D4'],
        'y_source': ['src2', 'src3', 'src4', 'src4']
    })

def test_get_neighbors_no_relation_type(mock_kg_data):
    with patch('query_primekg._load_kg', return_value=mock_kg_data):
        # Test node_id = 1
        results = query_primekg.get_neighbors(1)

        assert len(results) == 2
        # x_id == '1'
        assert any(r['neighbor_id'] == '2' for r in results)
        assert any(r['neighbor_id'] == '4' for r in results)

def test_get_neighbors_with_relation_type(mock_kg_data):
    with patch('query_primekg._load_kg', return_value=mock_kg_data):
        # Test node_id = 1, relation_type = 'rel1'
        results = query_primekg.get_neighbors('1', relation_type='rel1')

        assert len(results) == 2

def test_get_neighbors_as_y_id(mock_kg_data):
    with patch('query_primekg._load_kg', return_value=mock_kg_data):
        # Test node_id = 2, it is y_id in first row, x_id in second row
        results = query_primekg.get_neighbors(2)
        assert len(results) == 2

        # When 2 is y_id, neighbor is x_id=1
        assert any(r['neighbor_id'] == '1' for r in results)
        # When 2 is x_id, neighbor is y_id=3
        assert any(r['neighbor_id'] == '3' for r in results)

def test_get_neighbors_no_match(mock_kg_data):
    with patch('query_primekg._load_kg', return_value=mock_kg_data):
        # Test node_id = 99
        results = query_primekg.get_neighbors('99')
        assert len(results) == 0
