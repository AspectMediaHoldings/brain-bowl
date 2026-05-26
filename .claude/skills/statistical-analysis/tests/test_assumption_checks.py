import pytest
import numpy as np
import pandas as pd
from unittest.mock import patch

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scripts'))
from assumption_checks import check_normality

def test_check_normality_normal_data():
    np.random.seed(42)
    # Generate random normal data
    data = np.random.normal(0, 1, 100)

    result = check_normality(data, plot=False)

    assert result['test'] == 'Shapiro-Wilk'
    assert bool(result['is_normal']) is True
    assert result['p_value'] > 0.05
    assert result['n'] == 100

def test_check_normality_non_normal_data():
    np.random.seed(42)
    # Generate non-normal (exponential) data
    data = np.random.exponential(1, 100)

    result = check_normality(data, plot=False)

    assert result['test'] == 'Shapiro-Wilk'
    assert bool(result['is_normal']) is False
    assert result['p_value'] <= 0.05
    assert result['n'] == 100

def test_check_normality_with_nan():
    np.random.seed(42)
    data = np.random.normal(0, 1, 100)
    # Add some NaNs
    data_with_nan = np.append(data, [np.nan, np.nan])

    result = check_normality(data_with_nan, plot=False)

    assert bool(result['is_normal']) is True
    assert result['n'] == 100 # Should only count valid values

@patch('matplotlib.pyplot.show')
def test_check_normality_plot(mock_show):
    np.random.seed(42)
    data = np.random.normal(0, 1, 100)

    result = check_normality(data, plot=True)

    assert bool(result['is_normal']) is True
    mock_show.assert_called_once()
