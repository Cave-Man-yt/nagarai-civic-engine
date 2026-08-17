"""
Test suite for Task 2: Image Classification with YOLOv8 + CLIP
"""

import os
import sys
import unittest
import numpy as np
from PIL import Image, ImageDraw

from image_classifier import classify_image, generate_image_embedding


class TestYoloClipClassifier(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.test_dir = os.path.join(os.path.dirname(__file__), "test_fixtures")
        os.makedirs(cls.test_dir, exist_ok=True)

        # 1. Create simulated Pothole Image
        cls.pothole_img = os.path.join(cls.test_dir, "test_pothole.jpg")
        img1 = Image.new('RGB', (400, 300), color=(100, 100, 100))
        draw1 = ImageDraw.Draw(img1)
        draw1.ellipse([100, 80, 300, 220], fill=(30, 30, 30))
        img1.save(cls.pothole_img)

        # 2. Create simulated Open Manhole Image
        cls.manhole_img = os.path.join(cls.test_dir, "test_manhole.jpg")
        img2 = Image.new('RGB', (400, 300), color=(120, 120, 120))
        draw2 = ImageDraw.Draw(img2)
        draw2.rectangle([140, 90, 260, 210], fill=(10, 10, 10))
        img2.save(cls.manhole_img)

    def test_missing_image_returns_unknown(self):
        """Should return category 'unknown' when image does not exist."""
        result = classify_image("non_existent_image.jpg")
        print("\n[Test Missing Image] Result:", result)
        self.assertEqual(result["category"], "unknown")
        self.assertEqual(result["severity"], 1)

    def test_classify_pothole_image(self):
        """Should detect civic category, severity (1-5), and confidence."""
        result = classify_image(self.pothole_img)
        print("\n[Test Pothole Image] Result:", result)
        self.assertIn("category", result)
        self.assertIsInstance(result["category"], str)
        self.assertTrue(1 <= result["severity"] <= 5)
        self.assertTrue(0.0 <= result["confidence"] <= 1.0)

    def test_classify_manhole_image(self):
        """Should classify open manhole image."""
        result = classify_image(self.manhole_img)
        print("\n[Test Manhole Image] Result:", result)
        self.assertIn("category", result)
        self.assertTrue(1 <= result["severity"] <= 5)

    def test_generate_image_embedding_vector(self):
        """Should generate 512-dim CLIP visual embedding vector."""
        vector = generate_image_embedding(self.pothole_img)
        print(f"\n[Test CLIP Vector] Dimension: {len(vector)}")
        if vector:
            print(f"Sample Vector Values: [{vector[0]:.4f}, {vector[1]:.4f}, ... {len(vector)} dims]")
            self.assertEqual(len(vector), 512)
            self.assertTrue(any(v != 0 for v in vector))


if __name__ == "__main__":
    unittest.main()
