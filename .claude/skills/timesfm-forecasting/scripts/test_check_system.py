import sys
import os
import unittest
import importlib.util
from unittest.mock import patch, MagicMock

# Dynamically import the module since it's not a proper package
script_dir = os.path.dirname(os.path.abspath(__file__))
module_path = os.path.join(script_dir, "check_system.py")
spec = importlib.util.spec_from_file_location("check_system", module_path)
check_system = importlib.util.module_from_spec(spec)
sys.modules["check_system"] = check_system
spec.loader.exec_module(check_system)

from check_system import recommend_batch_size, SystemReport, CheckResult

class TestRecommendBatchSize(unittest.TestCase):

    def setUp(self):
        self.report = SystemReport(model="test_model")

    @patch('check_system._get_total_ram_gb')
    def test_gpu_with_vram(self, mock_ram):
        # RAM shouldn't matter for GPU with VRAM
        mock_ram.return_value = 8.0

        # Test >= 24
        self.report.checks = [CheckResult(name="GPU", status="pass", detail="", value="GPU Name | VRAM: 24.0 GB")]
        self.assertEqual(recommend_batch_size(self.report), 256)

        # Test >= 16
        self.report.checks = [CheckResult(name="GPU", status="pass", detail="", value="GPU Name | VRAM: 16.5 GB")]
        self.assertEqual(recommend_batch_size(self.report), 128)

        # Test >= 8
        self.report.checks = [CheckResult(name="GPU", status="pass", detail="", value="GPU Name | VRAM: 8.0 GB")]
        self.assertEqual(recommend_batch_size(self.report), 64)

        # Test >= 4
        self.report.checks = [CheckResult(name="GPU", status="pass", detail="", value="GPU Name | VRAM: 4.0 GB")]
        self.assertEqual(recommend_batch_size(self.report), 32)

        # Test < 4
        self.report.checks = [CheckResult(name="GPU", status="pass", detail="", value="GPU Name | VRAM: 2.0 GB")]
        self.assertEqual(recommend_batch_size(self.report), 16)

    @patch('check_system._get_total_ram_gb')
    def test_gpu_invalid_vram_format(self, mock_ram):
        mock_ram.return_value = 8.0

        # Missing number
        self.report.checks = [CheckResult(name="GPU", status="pass", detail="", value="GPU Name | VRAM: unknown GB")]
        self.assertEqual(recommend_batch_size(self.report), 32)

    @patch('check_system._get_total_ram_gb')
    def test_mps(self, mock_ram):
        self.report.checks = [CheckResult(name="GPU", status="pass", detail="", value="Apple Silicon MPS")]

        # Test >= 32
        mock_ram.return_value = 32.0
        self.assertEqual(recommend_batch_size(self.report), 64)

        # Test >= 16
        mock_ram.return_value = 16.0
        self.assertEqual(recommend_batch_size(self.report), 32)

        # Test < 16
        mock_ram.return_value = 8.0
        self.assertEqual(recommend_batch_size(self.report), 16)

    @patch('check_system._get_total_ram_gb')
    def test_cpu_only(self, mock_ram):
        # No GPU check present or it failed
        self.report.checks = []

        # Test >= 32
        mock_ram.return_value = 32.0
        self.assertEqual(recommend_batch_size(self.report), 64)

        # Test >= 16
        mock_ram.return_value = 16.0
        self.assertEqual(recommend_batch_size(self.report), 32)

        # Test >= 8
        mock_ram.return_value = 8.0
        self.assertEqual(recommend_batch_size(self.report), 8)

        # Test < 8
        mock_ram.return_value = 4.0
        self.assertEqual(recommend_batch_size(self.report), 4)

    @patch('check_system._get_total_ram_gb')
    def test_failed_gpu_fallback_to_cpu(self, mock_ram):
        self.report.checks = [CheckResult(name="GPU", status="fail", detail="", value="")]

        mock_ram.return_value = 16.0
        self.assertEqual(recommend_batch_size(self.report), 32)

if __name__ == "__main__":
    unittest.main()
