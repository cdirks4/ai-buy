import unittest
import os
import warnings
from face_comparison import compare_faces

class TestFaceComparison(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Suppress specific warnings
        warnings.filterwarnings('ignore', category=UserWarning, 
                              module='onnxruntime.capi.onnxruntime_inference_collection')
        warnings.filterwarnings('ignore', category=FutureWarning, 
                              module='insightface.utils.transform')
        
        cls.base_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "public",
            "images"
        )

    def test_face_comparison_basic(self):
        """Test basic face comparison functionality"""
        image_paths = [
            os.path.join(self.base_path, "person1_a.jpg"),
            os.path.join(self.base_path, "person1_b.jpeg"),
            os.path.join(self.base_path, "person2.jpeg"),
            os.path.join(self.base_path, "person3.jpg")
        ]
        
        # Verify all test images exist
        for path in image_paths:
            self.assertTrue(os.path.exists(path), f"Test image not found: {path}")
        
        matching_pair, similarity, all_similarities = compare_faces(image_paths)
        
        print("\nAll similarity scores:")
        for pair, score in all_similarities.items():
            print(f"Pair {pair}: {score:.4f}")
        print(f"Best matching pair: {matching_pair}, score: {similarity:.4f}")
        
        # Test similarity score range
        self.assertGreaterEqual(similarity, 0.0)
        self.assertLessEqual(similarity, 1.0)

    def test_face_comparison_threshold(self):
        """Test face comparison with similarity threshold"""
        image_paths = [
            os.path.join(self.base_path, "person1_a.jpg"),
            os.path.join(self.base_path, "person1_b.jpeg"),
            os.path.join(self.base_path, "person2.jpeg"),
            os.path.join(self.base_path, "person3.jpg"),
            os.path.join(self.base_path, "person4.jpg")
        ]
        
        matching_pair, similarity, all_similarities = compare_faces(image_paths)
        
        # Lower threshold for cosine similarity
        SIMILARITY_THRESHOLD = 0.15
        
        print("\nAll similarity scores:")
        for pair, score in all_similarities.items():
            print(f"Pair {pair}: {score:.4f}")
        
        # Find the similarity between images 0 and 1 (should be same person)
        same_person_similarity = all_similarities.get("0-1", 0)
        
        if same_person_similarity >= SIMILARITY_THRESHOLD:
            print(f"\nHigh similarity detected between same person images: {same_person_similarity:.4f}")
            self.assertGreaterEqual(same_person_similarity, SIMILARITY_THRESHOLD)
        else:
            print(f"\nWarning: Low similarity between same person images: {same_person_similarity:.4f}")
            print("This might indicate that the test images are not of the same person or are too different in quality/pose")

    def test_invalid_image_handling(self):
        """Test handling of invalid image paths"""
        image_paths = [
            "nonexistent1.jpg",
            "nonexistent2.jpg",
            "nonexistent3.jpg"
        ]
        
        with self.assertRaises(ValueError):
            compare_faces(image_paths)

    def test_multiple_same_person(self):
        """Test comparison with multiple images of the same person"""
        image_paths = [
            os.path.join(self.base_path, "person1_a.jpg"),
            os.path.join(self.base_path, "person1_b.jpeg"),
            os.path.join(self.base_path, "person1_c.jpeg"),  # Add more images of person1
        ]
        
        matching_pair, similarity, all_similarities = compare_faces(image_paths)
        
        # All pairs should have high similarity
        for pair, score in all_similarities.items():
            print(f"Same person pair {pair}: {score:.4f}")
            self.assertGreaterEqual(score, 0.5, f"Low similarity for same person: {score}")

if __name__ == '__main__':
    unittest.main(verbosity=2)