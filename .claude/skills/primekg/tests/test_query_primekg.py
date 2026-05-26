import pytest
import pandas as pd
from unittest.mock import patch
from scripts.query_primekg import find_paths

@pytest.fixture
def mock_kg_df():
    mock_kg_data = {
        'x_id': ['node_a', 'node_b', 'node_c', 'node_a', '123'],
        'x_type': ['type1', 'type2', 'type3', 'type1', 'type5'],
        'x_name': ['A', 'B', 'C', 'A', 'NumNode'],
        'x_source': ['src1', 'src2', 'src3', 'src1', 'src5'],
        'y_id': ['node_b', 'node_c', 'node_d', 'node_d', '456'],
        'y_type': ['type2', 'type3', 'type4', 'type4', 'type6'],
        'y_name': ['B', 'C', 'D', 'D', 'NumNode2'],
        'y_source': ['src2', 'src3', 'src4', 'src4', 'src6'],
        'relation': ['rel1', 'rel2', 'rel3', 'rel4', 'rel5'],
        'display_relation': ['Rel1', 'Rel2', 'Rel3', 'Rel4', 'Rel5']
    }
    return pd.DataFrame(mock_kg_data)

@patch('scripts.query_primekg._load_kg')
def test_find_paths_direct_forward(mock_load_kg, mock_kg_df):
    mock_load_kg.return_value = mock_kg_df

    paths = find_paths('node_a', 'node_b', max_depth=1)
    assert len(paths) == 1
    assert paths[0][0]['x_id'] == 'node_a'
    assert paths[0][0]['y_id'] == 'node_b'

@patch('scripts.query_primekg._load_kg')
def test_find_paths_direct_reverse(mock_load_kg, mock_kg_df):
    mock_load_kg.return_value = mock_kg_df

    paths = find_paths('node_b', 'node_a', max_depth=1)
    assert len(paths) == 1
    assert paths[0][0]['x_id'] == 'node_a'
    assert paths[0][0]['y_id'] == 'node_b'

@pytest.mark.xfail(reason="Depth 2 path finding is not yet fully implemented in query_primekg.py")
@patch('scripts.query_primekg._load_kg')
def test_find_paths_depth_2(mock_load_kg, mock_kg_df):
    mock_load_kg.return_value = mock_kg_df

    # Path: node_a -> node_b -> node_c
    paths = find_paths('node_a', 'node_c', max_depth=2)
    assert len(paths) > 0

@patch('scripts.query_primekg._load_kg')
def test_find_paths_no_path(mock_load_kg, mock_kg_df):
    mock_load_kg.return_value = mock_kg_df

    paths = find_paths('node_a', 'nonexistent', max_depth=1)
    assert len(paths) == 0

@patch('scripts.query_primekg._load_kg')
def test_find_paths_integer_ids(mock_load_kg, mock_kg_df):
    mock_load_kg.return_value = mock_kg_df

    paths = find_paths(123, 456, max_depth=1)
    assert len(paths) == 1
    assert paths[0][0]['x_id'] == '123'
    assert paths[0][0]['y_id'] == '456'
