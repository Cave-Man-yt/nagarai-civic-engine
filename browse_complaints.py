"""
Interactive Complaint Browser for NagarAI Civic Intelligence Engine
PS-S05

Allows users to view all complaint clusters in a formatted list, select any complaint,
and view its full detailed description, voice transcripts, priority score, and merged reports.
"""

import sys
import os
import json
from typing import Dict, Any, List

from deduplicator import ComplaintClusterStore, check_and_merge_complaint, DEFAULT_STORE
from text_processor import parse_complaint_text

# ANSI Terminal Colors
HEADER = "\033[95m\033[1m"
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


def seed_sample_complaints(store: ComplaintClusterStore):
    """Seeds sample civic complaint clusters for demonstration if store is empty."""
    if len(store.get_all_clusters()) > 0:
        return

    sample_data = [
        {
            "report_id": "rep_101",
            "latitude": 28.6315,
            "longitude": 77.2167,
            "raw_text": "Dangerous deep pothole right outside Connaught Place Metro Gate 2.",
            "is_sensitive_location": True
        },
        {
            "report_id": "rep_102",
            "latitude": 28.6316,
            "longitude": 77.2168,
            "raw_text": "Deep pit on road near CP Metro gate 2. Vehicles are getting damaged.",
            "is_sensitive_location": True
        },
        {
            "report_id": "rep_103",
            "latitude": 28.6314,
            "longitude": 77.2166,
            "raw_text": "CP metro gate 2 ke paas sadak pe bada dangerous gadda hai.",
            "is_sensitive_location": True
        },
        {
            "report_id": "rep_201",
            "latitude": 28.6317,
            "longitude": 77.2169,
            "raw_text": "Emergency! Open sewer manhole cover missing near gate 2!",
            "category": "open_manhole",
            "severity": 5,
            "is_sensitive_location": True
        },
        {
            "report_id": "rep_301",
            "latitude": 28.6565,
            "longitude": 77.2417,
            "raw_text": "Streetlight broken and not glowing in Sector 4 residential lane.",
            "category": "streetlight",
            "severity": 2,
            "is_sensitive_location": False
        },
        {
            "report_id": "rep_401",
            "latitude": 28.5355,
            "longitude": 77.3910,
            "raw_text": "Massive waterlogging after rain blocking Noida Sector 62 main road.",
            "category": "waterlogging",
            "severity": 4,
            "is_sensitive_location": True
        },
        {
            "report_id": "rep_501",
            "latitude": 28.7041,
            "longitude": 77.1025,
            "raw_text": "Illegal garbage dump overflowing near community park gate.",
            "category": "garbage",
            "severity": 3,
            "is_sensitive_location": False
        }
    ]

    for item in sample_data:
        check_and_merge_complaint(item, store=store)


def display_complaint_details(cluster: Dict[str, Any], rank: int):
    print("\n" + "=" * 75)
    print(f"{HEADER}COMPLAINT CLUSTER DETAILS (Rank #{rank}){RESET}".center(75))
    print("=" * 75)
    
    p_score = cluster['priority_score']
    score_color = RED if p_score >= 80 else (YELLOW if p_score >= 50 else GREEN)

    print(f"{BOLD}► Cluster ID         :{RESET} {cluster['cluster_id']}")
    print(f"{BOLD}► Category           :{RESET} {GREEN}{cluster['category'].upper()}{RESET}")
    print(f"{BOLD}► Severity Rating    :{RESET} {RED}{cluster['severity']} / 5{RESET}")
    print(f"{BOLD}► Priority Score     :{RESET} {score_color}{p_score:.2f} / 100{RESET}")
    print(f"{BOLD}► Affected Citizens  :{RESET} {BOLD}{cluster['affected_citizens']} citizen(s){RESET}")
    print(f"{BOLD}► GPS Location       :{RESET} ({cluster['latitude']:.4f}, {cluster['longitude']:.4f})")
    print(f"{BOLD}► Sensitive Location :{RESET} {'YES (Hospital/School/Main Road)' if cluster.get('is_sensitive_location') else 'NO'}")
    print(f"\n{BOLD}► Auto Generated Description:{RESET}")
    print(f"  \"{GREEN}{cluster['summary']}{RESET}\"")

    print(f"\n{BOLD}► Merged Reports History ({len(cluster['reports'])} reports):{RESET}")
    for idx, rep in enumerate(cluster['reports'], 1):
        print(f"  [{idx}] Report ID: {rep['report_id']}")
        print(f"      Transcript / Text: \"{rep['raw_text']}\"")
    
    print("=" * 75 + "\n")


def main():
    store = DEFAULT_STORE
    
    # Only seed sample complaints if store has never been used/initialized
    if not hasattr(store, "_was_initialized"):
        seed_sample_complaints(store)
        store._was_initialized = True

    while True:
        clusters = store.get_all_clusters()
        sorted_clusters = sorted(clusters, key=lambda c: c["priority_score"], reverse=True)

        print("\n" + "=" * 75)
        print(f"{HEADER}NAGARAI CIVIC COMPLAINT BROWSER & LEADERBOARD{RESET}".center(75))
        print("=" * 75)
        
        if len(sorted_clusters) == 0:
            print(f"\n{YELLOW}{BOLD}  [DATABASE IS EMPTY — 0 ACTIVE COMPLAINTS]{RESET}")
            print("  Submit new complaints using `python run_interactive.py` or `python run_my_complaint.py`!\n")
            print("=" * 75)
            print(f"{BOLD}Type 's' to seed sample complaints, or 'q' to quit:{RESET}")
        else:
            print(f"{BOLD}{'No.':<5} {'Cluster ID':<18} {'Category':<15} {'Citizens':<10} {'Priority':<12} {'Description Summary'}{RESET}")
            print("-" * 75)

            for idx, c in enumerate(sorted_clusters, 1):
                p_score = c["priority_score"]
                score_color = RED if p_score >= 80 else (YELLOW if p_score >= 50 else GREEN)
                summary_short = (c['summary'][:25] + "...") if len(c['summary']) > 25 else c['summary']
                
                print(f"{idx:<5} {c['cluster_id']:<18} {c['category']:<15} {c['affected_citizens']:<10} {score_color}{p_score:<12.2f}{RESET} {summary_short}")

            print("=" * 75)
            print(f"{BOLD}Enter a Complaint Number (1-{len(sorted_clusters)}) to inspect details,{RESET}")
            print(f"{BOLD}Type 'r' to RESET/CLEAR all complaints, or 'q' to quit:{RESET}")
        
        choice = input("> ").strip().lower()
        if choice in ["q", "quit", "exit"]:
            print(f"{GREEN}Exiting Complaint Browser. Goodbye!{RESET}\n")
            break

        if choice in ["r", "reset", "clear"]:
            store.clear()
            print(f"\n{GREEN}{BOLD}✓ ALL COMPLAINTS PERMANENTLY DELETED! Database is empty.{RESET}\n")
            continue

        if choice in ["s", "seed"]:
            seed_sample_complaints(store)
            print(f"\n{GREEN}{BOLD}✓ Sample complaints seeded into database.{RESET}\n")
            continue

        if choice.isdigit() and len(sorted_clusters) > 0:
            num = int(choice)
            if 1 <= num <= len(sorted_clusters):
                selected_cluster = sorted_clusters[num - 1]
                display_complaint_details(selected_cluster, rank=num)
                input(f"{BOLD}Press Enter to return to the complaint list...{RESET}")
            else:
                print(f"{RED}Invalid selection! Please enter a number between 1 and {len(sorted_clusters)}.{RESET}")
        else:
                print(f"{RED}Invalid input!{RESET}")




if __name__ == "__main__":
    main()
