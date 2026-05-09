import os
import sys
import pytest
from unittest.mock import patch

# Add parent dir to path to import script
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../scripts')))
from validate_files import check_bigwig_file

@patch('os.path.getsize')
def test_check_bigwig_file_valid(mock_getsize):
    mock_getsize.return_value = 1000
    success, msg = check_bigwig_file("test.bw")
    assert success is True
    assert "appears valid" in msg
    assert "1000 bytes" in msg

@patch('os.path.getsize')
def test_check_bigwig_file_small(mock_getsize):
    mock_getsize.return_value = 99
    success, msg = check_bigwig_file("test.bw")
    assert success is False
    assert "suspiciously small" in msg
    assert "99 bytes" in msg

@patch('os.path.getsize')
def test_check_bigwig_file_edge(mock_getsize):
    mock_getsize.return_value = 100
    success, msg = check_bigwig_file("test.bw")
    assert success is True
    assert "appears valid" in msg
    assert "100 bytes" in msg
