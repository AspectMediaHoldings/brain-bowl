import pytest
import sys
from unittest.mock import patch, MagicMock
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from check_system import check_gpu, CheckResult

def test_check_gpu_cuda_available():
    mock_torch = MagicMock()
    mock_torch.cuda.is_available.return_value = True
    mock_torch.cuda.get_device_name.return_value = "NVIDIA GeForce RTX 3090"

    mock_props = MagicMock()
    # 24 GB in bytes
    mock_props.total_memory = 24 * (1024**3)
    mock_torch.cuda.get_device_properties.return_value = mock_props

    with patch.dict('sys.modules', {'torch': mock_torch}):
        result = check_gpu()

    assert result.name == "GPU"
    assert result.status == "pass"
    assert result.detail == "NVIDIA GeForce RTX 3090 with 24.0 GB VRAM detected."
    assert result.value == "NVIDIA GeForce RTX 3090 | VRAM: 24.0 GB"

def test_check_gpu_mps_available():
    mock_torch = MagicMock()
    mock_torch.cuda.is_available.return_value = False
    mock_torch.backends.mps.is_available.return_value = True

    with patch.dict('sys.modules', {'torch': mock_torch}):
        result = check_gpu()

    assert result.name == "GPU"
    assert result.status == "pass"
    assert result.detail == "Apple Silicon MPS backend available. Uses unified memory."
    assert result.value == "Apple Silicon MPS"

def test_check_gpu_cpu_only():
    mock_torch = MagicMock()
    mock_torch.cuda.is_available.return_value = False
    mock_torch.backends.mps.is_available.return_value = False

    with patch.dict('sys.modules', {'torch': mock_torch}):
        result = check_gpu()

    assert result.name == "GPU"
    assert result.status == "warn"
    assert "No GPU detected" in result.detail
    assert result.value == "None (CPU only)"

def test_check_gpu_no_torch():
    # Make import torch raise ImportError
    with patch.dict('sys.modules', {'torch': None}):
        result = check_gpu()

    assert result.name == "GPU"
    assert result.status == "warn"
    assert "PyTorch not installed" in result.detail
    assert result.value == "Unknown (torch not installed)"
