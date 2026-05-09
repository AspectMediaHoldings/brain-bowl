import os
import pytest
from pathlib import Path
from validate_files import check_file_exists

def test_check_file_exists_happy_path(tmp_path):
    test_file = tmp_path / "test.txt"
    test_file.touch()
    success, msg = check_file_exists(str(test_file))
    assert success is True
    assert msg == f"✓ File exists: {test_file}"

def test_check_file_exists_not_found(tmp_path):
    non_existent_file = tmp_path / "non_existent.txt"
    success, msg = check_file_exists(str(non_existent_file))
    assert success is False
    assert msg == f"File not found: {non_existent_file}"

def test_check_file_exists_not_readable(tmp_path):
    test_file = tmp_path / "unreadable.txt"
    test_file.touch()

    # Remove read permissions
    os.chmod(test_file, 0o222) # Write-only

    try:
        success, msg = check_file_exists(str(test_file))
        assert success is False
        assert msg == f"File not readable: {test_file}"
    finally:
        # Restore permissions so pytest can clean up
        os.chmod(test_file, 0o644)
