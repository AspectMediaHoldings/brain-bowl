import sys
from pathlib import Path

# Add the scripts directory to the path so we can import the module
scripts_dir = Path(__file__).parent.parent / "scripts"
sys.path.insert(0, str(scripts_dir))

import pytest
import matplotlib.pyplot as plt
from figure_export import check_figure_size

def test_check_figure_size_nature_single():
    # Nature single column is 89mm (~3.5 inches)
    fig = plt.figure(figsize=(89 / 25.4, 3))
    info = check_figure_size(fig, journal='nature')
    assert info['column_type'] == 'single'
    assert info['width_ok'] == True
    assert info['height_ok'] == True
    assert info['compliant'] == True
    plt.close(fig)

def test_check_figure_size_nature_double():
    # Nature double column is 183mm (~7.2 inches)
    fig = plt.figure(figsize=(183 / 25.4, 5))
    info = check_figure_size(fig, journal='nature')
    assert info['column_type'] == 'double'
    assert info['width_ok'] == True
    assert info['height_ok'] == True
    assert info['compliant'] == True
    plt.close(fig)

def test_check_figure_size_too_tall():
    # Nature max height is 247mm (~9.72 inches)
    fig = plt.figure(figsize=(89 / 25.4, 10))
    info = check_figure_size(fig, journal='nature')
    assert info['column_type'] == 'single'
    assert info['width_ok'] == True
    assert info['height_ok'] == False
    assert info['compliant'] == False
    plt.close(fig)

def test_check_figure_size_invalid_width():
    # 130mm is between single and double column
    fig = plt.figure(figsize=(130 / 25.4, 3))
    info = check_figure_size(fig, journal='nature')
    assert info['column_type'] is None
    assert info['width_ok'] == False
    assert info['height_ok'] == True
    assert info['compliant'] == False
    plt.close(fig)

def test_check_figure_size_unrecognized_journal(capsys):
    # Unrecognized journal should fall back to nature
    fig = plt.figure(figsize=(89 / 25.4, 3))
    info = check_figure_size(fig, journal='unknown_journal')

    # Check that warning was printed
    captured = capsys.readouterr()
    assert "Warning: Journal 'unknown_journal' not found, using Nature specifications" in captured.out

    # Should evaluate against Nature's 89mm single column
    assert info['column_type'] == 'single'
    assert info['width_ok'] == True
    assert info['height_ok'] == True
    assert info['compliant'] == True
    plt.close(fig)
