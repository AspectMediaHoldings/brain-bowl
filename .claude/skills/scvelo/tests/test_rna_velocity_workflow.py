import pytest
from unittest import mock
import sys
import os

# Add scripts directory to path to import the module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../scripts')))

from rna_velocity_workflow import load_from_loom

@mock.patch('rna_velocity_workflow.sc.tl.leiden')
@mock.patch('rna_velocity_workflow.sc.tl.umap')
@mock.patch('rna_velocity_workflow.sc.pp.neighbors')
@mock.patch('rna_velocity_workflow.sc.pp.pca')
@mock.patch('rna_velocity_workflow.sc.pp.highly_variable_genes')
@mock.patch('rna_velocity_workflow.sc.pp.log1p')
@mock.patch('rna_velocity_workflow.sc.pp.normalize_total')
@mock.patch('rna_velocity_workflow.scv.read', create=True)
def test_load_from_loom_without_processed(mock_scv_read, mock_normalize, mock_log1p, mock_hvg, mock_pca, mock_neighbors, mock_umap, mock_leiden):
    """Test load_from_loom when no processed_h5ad is provided."""
    mock_adata = mock.MagicMock()
    mock_scv_read.return_value = mock_adata

    result = load_from_loom("dummy.loom")

    mock_scv_read.assert_called_once_with("dummy.loom", cache=True)
    mock_normalize.assert_called_once_with(mock_adata, target_sum=1e4)
    mock_log1p.assert_called_once_with(mock_adata)
    mock_hvg.assert_called_once_with(mock_adata, n_top_genes=3000)
    mock_pca.assert_called_once_with(mock_adata)
    mock_neighbors.assert_called_once_with(mock_adata)
    mock_umap.assert_called_once_with(mock_adata)
    mock_leiden.assert_called_once_with(mock_adata, resolution=0.5)

    assert result == mock_adata

@mock.patch('rna_velocity_workflow.scv.utils.merge')
@mock.patch('rna_velocity_workflow.sc.read_h5ad')
@mock.patch('rna_velocity_workflow.scv.read', create=True)
def test_load_from_loom_with_processed(mock_scv_read, mock_read_h5ad, mock_merge):
    """Test load_from_loom when processed_h5ad is provided."""
    mock_adata_loom = mock.MagicMock()
    mock_scv_read.return_value = mock_adata_loom

    mock_adata_processed = mock.MagicMock()
    mock_read_h5ad.return_value = mock_adata_processed

    mock_merged_adata = mock.MagicMock()
    mock_merge.return_value = mock_merged_adata

    result = load_from_loom("dummy.loom", processed_h5ad="dummy.h5ad")

    mock_scv_read.assert_called_once_with("dummy.loom", cache=True)
    mock_read_h5ad.assert_called_once_with("dummy.h5ad")
    mock_merge.assert_called_once_with(mock_adata_processed, mock_adata_loom)

    assert result == mock_merged_adata
