"""
NagarAI Civic Complaint Intelligence Engine (PS-S05)
Main Pipeline CLI Entrypoint
"""

import sys
import os
import json
import logging
from typing import Dict, Any

from audio_processor import audio_to_text
from image_classifier import classify_image
from text_processor import parse_complaint_text
from deduplicator import check_and_merge_complaint, ComplaintClusterStore

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def process_civic_complaint(
    audio_path: str = None,
    image_path: str = None,
    raw_text: str = None,
    latitude: float = 0.0,
    longitude: float = 0.0,
    is_sensitive_location: bool = False,
    store: ComplaintClusterStore = None
) -> Dict[str, Any]:
    """
    Main Orchestrator function integrating Task 1 -> Task 2 -> Task 3 -> Task 4 -> Task 5.
    When ONLY speech audio is provided, performs ASR speech-to-text and automatically
    generates a structured issue description, category, and severity.
    """
    logger.info("--- Starting Civic Complaint Processing ---")

    # Step 1: Audio Processing & Speech-to-Text
    transcript = ""
    if audio_path:
        logger.info(f"Processing speech audio input: {audio_path}")
        transcript = audio_to_text(audio_path)
        logger.info(f"Speech-to-Text Transcript: '{transcript}'")

    # Combine text input and audio transcript
    combined_text = (raw_text or "").strip()
    if transcript and transcript != "Unclear audio":
        combined_text = f"{combined_text} {transcript}".strip() if combined_text else transcript.strip()
    elif not combined_text and transcript == "Unclear audio":
        combined_text = "Unclear voice complaint uploaded"

    # Step 2: Visual Intelligence (if image provided)
    image_info = {"category": "unknown", "severity": 1, "confidence": 0.0}
    if image_path:
        logger.info(f"Processing image input: {image_path}")
        image_info = classify_image(image_path)
        logger.info(f"Image Classification: {image_info}")

    # Step 3: Speech/Text Parsing & Automatic Issue Description Generation
    parsed_text = parse_complaint_text(combined_text)
    logger.info(f"Automatically Generated Description & Metadata: {parsed_text}")

    category = image_info["category"] if image_info["category"] != "unknown" else parsed_text["category"]
    severity = max(image_info["severity"], parsed_text["severity"])
    auto_description = parsed_text["summary"]

    complaint_payload = {
        "latitude": latitude,
        "longitude": longitude,
        "raw_text": combined_text or auto_description,
        "image_path": image_path,
        "category": category,
        "severity": severity,
        "is_sensitive_location": is_sensitive_location,
        "days_pending": days_pending
    }

    # Step 4 & 5: Deduplication & Priority Calculation
    result = check_and_merge_complaint(complaint_payload, store=store)
    result["transcript"] = transcript
    result["auto_description"] = auto_description
    result["category"] = category
    result["severity"] = severity

    logger.info(f"Deduplication & Priority Result: {result['action'].upper()} cluster {result['cluster_id']}")
    return result



if __name__ == "__main__":
    print("NagarAI Civic Intelligence Engine loaded successfully.")
