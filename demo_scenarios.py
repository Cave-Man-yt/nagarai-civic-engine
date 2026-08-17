"""
Interactive Demo Suite for NagarAI Civic Complaint Intelligence Engine
PS-S05 (NagarAI Hackathon)
"""

import os
import sys
import time
import json
import logging
from typing import Dict, Any

from main import process_civic_complaint
from deduplicator import ComplaintClusterStore, calculate_priority_score, check_and_merge_complaint
from text_processor import parse_complaint_text, generate_text_embedding
from image_classifier import classify_image, generate_image_embedding
from audio_processor import audio_to_text

# ANSI Terminal Colors for visual polish
HEADER = "\033[95m\033[1m"
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner(title: str):
    print("\n" + "=" * 75)
    print(f"{HEADER}{title.center(75)}{RESET}")
    print("=" * 75)


def demo_multilingual_voice():
    print_banner("DEMO 1: Multilingual Voice & Audio Processing (Task 1)")
    print(f"{BLUE}Simulating audio complaint ingestion across Hindi, English, and corrupted audio...{RESET}\n")

    sample_fixtures = [
        ("Corrupt/Empty Audio", "test_fixtures/corrupt_empty.wav", "hi"),
        ("Non-existent File", "missing_voice_note.wav", "en"),
        ("Valid Audio Tone", "test_fixtures/sample_voice.wav", "hi"),
    ]

    for label, file_path, lang in sample_fixtures:
        print(f"{BOLD}► Scenario:{RESET} {label}")
        print(f"  Audio Path: {file_path}")
        print(f"  Target Language: {lang}")
        
        start = time.time()
        transcript = audio_to_text(file_path, lang=lang)
        elapsed = (time.time() - start) * 1000
        
        status_color = GREEN if transcript != "Unclear audio" else YELLOW
        print(f"  Transcript Output: {status_color}'{transcript}'{RESET} ({elapsed:.1f}ms)")
        print("-" * 50)


def demo_visual_intelligence():
    print_banner("DEMO 2: Visual Classification with YOLOv8 & CLIP (Task 2)")
    print(f"{BLUE}Testing civic issue image classification & visual feature extraction...{RESET}\n")

    fixtures_dir = "test_fixtures"
    os.makedirs(fixtures_dir, exist_ok=True)
    pothole_img = os.path.join(fixtures_dir, "sample_pothole.jpg")
    manhole_img = os.path.join(fixtures_dir, "sample_manhole.jpg")

    # Generate synthetic demo image files if missing
    if not os.path.exists(pothole_img) or not os.path.exists(manhole_img):
        try:
            from PIL import Image, ImageDraw
            img1 = Image.new('RGB', (400, 300), color=(100, 100, 100))
            draw1 = ImageDraw.Draw(img1)
            draw1.ellipse([100, 80, 300, 220], fill=(40, 40, 40)) # Simulated pothole
            img1.save(pothole_img)

            img2 = Image.new('RGB', (400, 300), color=(120, 120, 120))
            draw2 = ImageDraw.Draw(img2)
            draw2.rectangle([120, 90, 280, 210], fill=(20, 20, 20)) # Simulated open manhole
            img2.save(manhole_img)
        except Exception as e:
            logger.warning(f"Could not generate synthetic image files: {e}")

    test_cases = [
        ("Pothole Image", pothole_img),
        ("Open Manhole Image", manhole_img)
    ]

    for label, img_path in test_cases:
        print(f"{BOLD}► Testing Input:{RESET} {label} ({img_path})")
        res = classify_image(img_path)
        print(f"  Detected Category : {GREEN}{res['category']}{RESET}")
        print(f"  Severity Rating   : {RED}{res['severity']} / 5{RESET}")
        print(f"  Confidence Score  : {BOLD}{res['confidence'] * 100:.1f}%{RESET}")
        
        clip_vec = generate_image_embedding(img_path)
        vec_preview = f"[{clip_vec[0]:.4f}, {clip_vec[1]:.4f}, ... {len(clip_vec)} dims]" if clip_vec else "[Fallback / None]"
        print(f"  CLIP Embedding    : {vec_preview}\n")



def demo_spatio_semantic_deduplication():
    print_banner("DEMO 3: Real-Time Spatio-Semantic Deduplication (Task 4)")
    print(f"{BLUE}Simulating 5 citizen reports submitted in Connaught Place, New Delhi...{RESET}\n")

    store = ComplaintClusterStore()
    cp_lat, cp_lon = 28.6315, 77.2167

    citizens_reports = [
        {
            "citizen": "Citizen #1 (Rohan)",
            "latitude": cp_lat,
            "longitude": cp_lon,
            "text": "Dangerous deep pothole right outside Connaught Place Metro Gate 2.",
            "is_sensitive": True
        },
        {
            "citizen": "Citizen #2 (Priya)",
            "latitude": cp_lat + 0.0001,  # ~11m away
            "longitude": cp_lon + 0.0001,
            "text": "Deep pit on road near CP Metro gate 2. Vehicles are getting damaged.",
            "is_sensitive": True
        },
        {
            "citizen": "Citizen #3 (Amit - Hindi Voice Note)",
            "latitude": cp_lat - 0.0001,  # ~11m away
            "longitude": cp_lon - 0.0001,
            "text": "CP metro gate 2 ke paas sadak pe bada dangerous gadda hai.",
            "is_sensitive": True
        },
        {
            "citizen": "Citizen #4 (Sunita - Critical Open Manhole)",
            "latitude": cp_lat + 0.00015, # ~16m away
            "longitude": cp_lon + 0.00015,
            "text": "Emergency! Open sewer manhole cover missing near gate 2!",
            "category": "open_manhole",
            "severity": 5,
            "is_sensitive": True
        },
        {
            "citizen": "Citizen #5 (Karan - Distant Location)",
            "latitude": cp_lat + 0.025,   # ~2.8 km away
            "longitude": cp_lon + 0.025,
            "text": "Streetlight broken and not glowing in Sector 4 residential lane.",
            "category": "streetlight",
            "severity": 2,
            "is_sensitive": False
        }
    ]

    for item in citizens_reports:
        print(f"{BOLD}► Ingesting Report from {item['citizen']}:{RESET}")
        print(f"  Text: \"{item['text']}\"")
        print(f"  Location: ({item['latitude']:.4f}, {item['longitude']:.4f})")

        payload = {
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "raw_text": item["text"],
            "category": item.get("category"),
            "severity": item.get("severity"),
            "is_sensitive_location": item["is_sensitive"]
        }

        res = check_and_merge_complaint(payload, store=store)

        if res["action"] == "created":
            action_str = f"{GREEN}[NEW CLUSTER CREATED]{RESET} ID: {res['cluster_id']}"
        else:
            action_str = f"{YELLOW}[MERGED INTO CLUSTER]{RESET} ID: {res['cluster_id']} (Similarity: {res['similarity']:.4f})"

        print(f"  Result           : {action_str}")
        print(f"  Affected Citizens: {res['affected_citizens']}")
        print(f"  Priority Score   : {RED}{res['priority_score']} / 100{RESET}\n")

    return store


def demo_priority_leaderboard(store: ComplaintClusterStore):
    print_banner("DEMO 4: Deterministic Priority Leaderboard (Task 5)")
    print(f"{BLUE}Live Municipal Action Queue (Sorted by Priority Score):{RESET}\n")

    clusters = store.get_all_clusters()
    sorted_clusters = sorted(clusters, key=lambda c: c["priority_score"], reverse=True)

    print(f"{BOLD}{'Rank':<6} {'Cluster ID':<18} {'Category':<15} {'Citizens':<10} {'Priority Score':<15} {'Location'}{RESET}")
    print("-" * 75)

    for rank, c in enumerate(sorted_clusters, 1):
        p_score = c["priority_score"]
        score_color = RED if p_score >= 80 else (YELLOW if p_score >= 50 else GREEN)
        loc_str = f"({c['latitude']:.4f}, {c['longitude']:.4f})"
        
        print(f"{rank:<6} {c['cluster_id']:<18} {c['category']:<15} {c['affected_citizens']:<10} {score_color}{p_score:<15.2f}{RESET} {loc_str}")

    print("\n" + "=" * 75 + "\n")


if __name__ == "__main__":
    print_banner("NAGARAI CIVIC COMPLAINT INTELLIGENCE ENGINE (PS-S05)")
    print(f"{BOLD}Starting Interactive Feature Demonstration Suite...{RESET}")
    
    demo_multilingual_voice()
    demo_visual_intelligence()
    store = demo_spatio_semantic_deduplication()
    demo_priority_leaderboard(store)

    print(f"{GREEN}{BOLD}✓ Demo suite execution complete!{RESET}\n")
