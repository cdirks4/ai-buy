import unittest
import json
import os
import warnings
import numpy as np
from face_analyzer import analyze_face

class TestFaceAnalyzer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Suppress specific warnings
        warnings.filterwarnings('ignore', category=UserWarning, 
                              module='onnxruntime.capi.onnxruntime_inference_collection')
        warnings.filterwarnings('ignore', category=FutureWarning, 
                              module='insightface.utils.transform')
        
        cls.test_image_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "public",
            "images",
            "selfie.webp"
        )

    def test_face_analysis_exists(self):
        """Test if the test image exists"""
        self.assertTrue(os.path.exists(self.test_image_path), 
                       f"Test image not found at {self.test_image_path}")

    def test_face_analysis_output(self):
        """Test the face analysis output structure and content"""
        result = analyze_face(self.test_image_path)
        result_dict = json.loads(result)
        
        self.assertIsInstance(result_dict, dict)
        
        if result_dict:
            # Test required fields existence
            required_fields = ['embedding', 'landmarks', 'bbox', 'det_score']
            for field in required_fields:
                self.assertIn(field, result_dict, f"Missing required field: {field}")
            
            # Test data types
            self.assertIsInstance(result_dict['embedding'], list)
            self.assertIsInstance(result_dict['landmarks'], list)
            self.assertIsInstance(result_dict['bbox'], list)
            self.assertIsInstance(result_dict['det_score'], float)
            
            # Test dimensions
            self.assertEqual(len(result_dict['embedding']), 512, 
                           "Embedding should be 512-dimensional")
            self.assertEqual(len(result_dict['bbox']), 4, 
                           "Bounding box should have 4 coordinates")
            
            # Test value ranges
            self.assertGreaterEqual(result_dict['det_score'], 0.0, 
                                  "Detection score should be non-negative")
            self.assertLessEqual(result_dict['det_score'], 1.0, 
                               "Detection score should be <= 1.0")
            
            # Test bbox coordinates are valid
            x1, y1, x2, y2 = result_dict['bbox']
            self.assertLess(x1, x2, "Invalid bbox: x1 should be less than x2")
            self.assertLess(y1, y2, "Invalid bbox: y1 should be less than y2")

    def test_face_analysis_invalid_image(self):
        """Test handling of invalid image path"""
        result = analyze_face("nonexistent_image.jpg")
        result_dict = json.loads(result)
        self.assertEqual(result_dict, {}, "Should return empty dict for invalid image")

if __name__ == '__main__':
    unittest.main(verbosity=2)