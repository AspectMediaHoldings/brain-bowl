import pytest
import pandas as pd
from io import StringIO

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from forecast_csv import load_csv

def test_load_csv_simple():
    csv_content = """date,value1,value2
2023-01-01,10.5,20.1
2023-01-02,11.2,19.8
2023-01-03,12.0,21.5
"""
    # use StringIO to mock file path
    # actually load_csv uses pd.read_csv which accepts file paths or buffers
    # but the type hint is str. we can pass a StringIO object to pd.read_csv

    df, value_cols, date_col = load_csv(StringIO(csv_content), date_col="date")

    assert list(df.columns) == ["date", "value1", "value2"]
    assert value_cols == ["value1", "value2"]
    assert date_col == "date"
    assert len(df) == 3


def test_load_csv_no_date_col():
    csv_content = """value1,value2
10.5,20.1
11.2,19.8
12.0,21.5
"""
    df, value_cols, date_col = load_csv(StringIO(csv_content))

    assert list(df.columns) == ["value1", "value2"]
    assert value_cols == ["value1", "value2"]
    assert date_col is None
    assert len(df) == 3

def test_load_csv_missing_date_col():
    csv_content = """val1,val2
1,2
3,4
"""
    df, value_cols, date_col = load_csv(StringIO(csv_content), date_col="missing_date")
    assert date_col is None
    assert value_cols == ["val1", "val2"]

def test_load_csv_specific_value_cols():
    csv_content = """date,val1,val2,val3
2023-01-01,1,2,3
2023-01-02,4,5,6
"""
    df, value_cols, date_col = load_csv(
        StringIO(csv_content),
        date_col="date",
        value_cols=["val1", "val3"]
    )
    assert value_cols == ["val1", "val3"]
    assert date_col == "date"

def test_load_csv_missing_value_cols():
    csv_content = """date,val1,val2
2023-01-01,1,2
2023-01-02,4,5
"""
    df, value_cols, date_col = load_csv(
        StringIO(csv_content),
        date_col="date",
        value_cols=["val1", "missing_val"]
    )
    assert value_cols == ["val1"]

def test_load_csv_no_numeric_cols():
    csv_content = """date,text1,text2
2023-01-01,abc,def
2023-01-02,ghi,jkl
"""
    with pytest.raises(SystemExit):
        load_csv(StringIO(csv_content), date_col="date")
