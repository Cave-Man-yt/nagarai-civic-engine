"""
Test suite for Task 1: Audio Processing (audio_to_text)
"""

import os
import sys
import unittest
import numpy as np
import scipy.io.wavfile as wavfile
from audio_processor import audio_to_text


class TestAudioProcessor(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.test_dir = os.path.join(os.path.dirname(__file__), "test_fixtures")
        os.makedirs(cls.test_dir, exist_ok=True)
        
        # 1. Create a valid 16kHz sine wave audio file (simulated audio tone)
        cls.valid_wav = os.path.join(cls.test_dir, "sample_voice.wav")
        sr = 16000
        duration = 2.0  # 2 seconds
        t = np.linspace(0, duration, int(sr * duration), False)
        # Generate 440 Hz tone + slight noise
        audio_data = (np.sin(2 * np.pi * 440 * t) * 16384).astype(np.int16)
        wavfile.write(cls.valid_wav, sr, audio_data)

        # 2. Create 0-byte corrupt file
        cls.empty_wav = os.path.join(cls.test_dir, "corrupt_empty.wav")
        with open(cls.empty_wav, "wb") as f:
            f.write(b"")

        # 3. Create invalid text file with .wav extension
        cls.bad_header_wav = os.path.join(cls.test_dir, "bad_header.wav")
        with open(cls.bad_header_wav, "w") as f:
            f.write("This is not an audio file")

    def test_missing_file_returns_unclear(self):
        """Should return 'Unclear audio' when file does not exist."""
        result = audio_to_text("non_existent_file.wav")
        print("\n[Test Missing File] Result:", result)
        self.assertEqual(result, "Unclear audio")

    def test_empty_file_returns_unclear(self):
        """Should return 'Unclear audio' when file is 0 bytes."""
        result = audio_to_text(self.empty_wav)
        print("[Test Empty File] Result:", result)
        self.assertEqual(result, "Unclear audio")

    def test_corrupt_file_returns_unclear(self):
        """Should return 'Unclear audio' when audio header is corrupt."""
        result = audio_to_text(self.bad_header_wav)
        print("[Test Corrupt File] Result:", result)
        self.assertEqual(result, "Unclear audio")

    def test_valid_audio_execution(self):
        """Should execute audio_to_text without crashing on valid audio file."""
        result = audio_to_text(self.valid_wav)
        print("[Test Valid Audio] Result:", result)
        self.assertIsInstance(result, str)
        self.assertTrue(len(result) > 0)


if __name__ == "__main__":
    unittest.main()
