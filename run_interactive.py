"""
Interactive CLI Wizard for submitting custom complaints to NagarAI Engine
PS-S05
"""

import sys
import os
from main import process_civic_complaint
from deduplicator import DEFAULT_STORE, calculate_priority_score

# ANSI Colors
HEADER = "\033[95m\033[1m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


def main():
    print("\n" + "=" * 70)
    print(f"{HEADER}NAGARAI ENGINE — INTERACTIVE COMPLAINT SUBMISSION WIZARD{RESET}".center(70))
    print("=" * 70)
    print("Answer the prompts below to ingest your custom civic issue:\n")

    # 1. Text Prompt
    raw_text = input(f"{BOLD}1. Enter complaint description text (or press Enter to skip):{RESET}\n> ").strip()

    # 2. Audio File Prompt
    audio_path = input(f"\n{BOLD}2. Enter path to audio file (or press Enter to skip):{RESET}\n> ").strip()
    if audio_path and not os.path.exists(audio_path):
        print(f"{YELLOW}Warning: File '{audio_path}' does not exist on disk.{RESET}")
        audio_path = None

    # 3. Image File Prompt
    image_path = input(f"\n{BOLD}3. Enter path to image file (or press Enter to skip):{RESET}\n> ").strip()
    if image_path and not os.path.exists(image_path):
        print(f"{YELLOW}Warning: File '{image_path}' does not exist on disk.{RESET}")
        image_path = None

    if not raw_text and not audio_path and not image_path:
        print(f"\n{RED}Error: You must provide at least a text description, audio path, or image path!{RESET}")
        sys.exit(1)

    # 4. Latitude & Longitude
    lat_str = input(f"\n{BOLD}4. Enter Latitude (default 28.6315):{RESET}\n> ").strip()
    lat = float(lat_str) if lat_str else 28.6315

    lon_str = input(f"{BOLD}5. Enter Longitude (default 77.2167):{RESET}\n> ").strip()
    lon = float(lon_str) if lon_str else 77.2167

    # 5. Sensitive location
    sens_str = input(f"\n{BOLD}6. Is this near a hospital/school/main road? (y/n, default n):{RESET}\n> ").strip().lower()
    is_sensitive = sens_str in ["y", "yes", "true"]

    print("\n" + "-" * 70)
    print(f"{BOLD}Processing your complaint through the ML pipeline...{RESET}\n")

    result = process_civic_complaint(
        audio_path=audio_path,
        image_path=image_path,
        raw_text=raw_text,
        latitude=lat,
        longitude=lon,
        is_sensitive_location=is_sensitive,
        store=DEFAULT_STORE
    )

    print("\n" + "=" * 70)
    print(f"{BOLD}PROCESSING RESULT:{RESET}")
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
