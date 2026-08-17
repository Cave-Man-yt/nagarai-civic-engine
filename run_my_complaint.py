"""
Custom Complaint Submission CLI for NagarAI Civic Intelligence Engine
PS-S05

Usage:
  python run_my_complaint.py --text "Deep dangerous pothole near the station" --lat 28.6315 --lon 77.2167 --sensitive
  python run_my_complaint.py --audio "/path/to/voice_note.wav" --image "/path/to/photo.jpg" --lat 28.6315 --lon 77.2167
"""

import sys
import os
import argparse
import json
import logging
from typing import Dict, Any

from main import process_civic_complaint
from deduplicator import DEFAULT_STORE

# ANSI Colors
HEADER = "\033[95m\033[1m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


def main():
    parser = argparse.ArgumentParser(description="Submit a custom civic complaint to NagarAI Engine")
    parser.add_argument("--text", type=str, default=None, help="Raw complaint description text")
    parser.add_argument("--audio", type=str, default=None, help="Path to voice note audio file")
    parser.add_argument("--image", type=str, default=None, help="Path to civic issue photo")
    parser.add_argument("--lat", type=float, default=28.6315, help="Latitude coordinate (e.g. 28.6315)")
    parser.add_argument("--lon", type=float, default=77.2167, help="Longitude coordinate (e.g. 77.2167)")
    parser.add_argument("--sensitive", action="store_true", help="Flag if location is sensitive (hospital/school/main road)")

    args = parser.parse_args()

    if not args.text and not args.audio and not args.image:
        print(f"{RED}Error: You must provide at least one input using --text, --audio, or --image!{RESET}")
        print("Example: python run_my_complaint.py --text \"Pothole on main road\" --lat 28.6315 --lon 77.2167")
        sys.exit(1)

    print("\n" + "=" * 70)
    print(f"{HEADER}NAGARAI ENGINE — CUSTOM COMPLAINT PROCESSING{RESET}".center(70))
    print("=" * 70)
    print(f"{BOLD}Input Parameters:{RESET}")
    print(f"  • Text Description : {args.text or '[None]'}")
    print(f"  • Audio File       : {args.audio or '[None]'}")
    print(f"  • Image File       : {args.image or '[None]'}")
    print(f"  • Coordinates      : ({args.lat:.4f}, {args.lon:.4f})")
    print(f"  • Sensitive Area   : {'YES' if args.sensitive else 'NO'}\n")

    result = process_civic_complaint(
        audio_path=args.audio,
        image_path=args.image,
        raw_text=args.text,
        latitude=args.lat,
        longitude=args.lon,
        is_sensitive_location=args.sensitive,
        store=DEFAULT_STORE
    )

    print("-" * 70)
    print(f"{BOLD}PROCESSING RESULT:{RESET}")
    if result.get("transcript"):
        print(f"  Speech Transcript : '{result['transcript']}'")
    if result.get("auto_description"):
        print(f"  Auto Description  : {GREEN}'{result['auto_description']}'{RESET}")
        print(f"  Inferred Category : {GREEN}{result['category']}{RESET}")
        print(f"  Inferred Severity : {RED}{result['severity']} / 5{RESET}")

    if result["action"] == "created":
        print(f"  Action Status     : {GREEN}[NEW CLUSTER CREATED]{RESET}")
    else:
        print(f"  Action Status     : {YELLOW}[MERGED INTO EXISTING CLUSTER]{RESET}")
        print(f"  Cosine Similarity : {result['similarity']:.4f}")

    print(f"  Cluster ID        : {BOLD}{result['cluster_id']}{RESET}")
    print(f"  Affected Citizens : {BOLD}{result['affected_citizens']}{RESET}")
    print(f"  Priority Score    : {RED}{result['priority_score']} / 100{RESET}")
    print("=" * 70 + "\n")



if __name__ == "__main__":
    main()
