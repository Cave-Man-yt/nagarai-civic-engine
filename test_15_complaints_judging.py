"""
Live 15-Complaint Deduplication Test & Priority Worked Example Suite
PS-S05: NagarAI Civic Complaint Intelligence Engine (Backend Evaluation Suite)
"""

import sys
import os
import json
import time
from typing import Dict, Any, List

from deduplicator import ComplaintClusterStore, check_and_merge_complaint, calculate_priority_score
from text_processor import parse_complaint_text, generate_text_embedding
from image_classifier import classify_image

# ANSI Colors for visual polish
HEADER = "\033[95m\033[1m"
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


# 15-Complaint Judging Test Dataset (Multimodal, Regional Languages, Geo-Tagged)
JUDGING_DATASET = [
    # Cluster 1: Pothole on MG Road (4 complaints near 28.6315, 77.2167)
    {
        "id": "C01",
        "type": "English Text",
        "text": "Dangerous deep pothole right outside Connaught Place Metro Gate 2.",
        "lat": 28.6315, "lon": 77.2167, "sensitive": False, "days": 0.5, "expected_cluster": "CP_Pothole"
    },
    {
        "id": "C02",
        "type": "Text + Photo",
        "text": "Deep pit on road near CP Metro gate 2. Vehicles getting damaged.",
        "lat": 28.6316, "lon": 77.2168, "sensitive": False, "days": 1.0, "expected_cluster": "CP_Pothole"
    },
    {
        "id": "C03",
        "type": "Hindi Voice Note",
        "text": "CP metro gate 2 ke paas sadak pe bada dangerous gadda hai.",
        "lat": 28.6314, "lon": 77.2166, "sensitive": False, "days": 1.5, "expected_cluster": "CP_Pothole"
    },
    {
        "id": "C04",
        "type": "Tamil Voice Note",
        "text": "CP மெட்ரோ கேட் 2 அருகில் சாலையில் பெரிய குழி உள்ளது ஆபத்தானது.",
        "lat": 28.6315, "lon": 77.2166, "sensitive": False, "days": 2.0, "expected_cluster": "CP_Pothole"
    },

    # Cluster 2: Emergency Open Sewer Manhole near City Hospital (2 complaints near 28.6318, 77.2170)
    {
        "id": "C05",
        "type": "English Text",
        "text": "Emergency! Open sewer manhole cover missing in front of City Hospital!",
        "category": "open_manhole", "severity": 5,
        "lat": 28.6318, "lon": 77.2170, "sensitive": True, "days": 0.2, "expected_cluster": "Hospital_Manhole"
    },
    {
        "id": "C06",
        "type": "Hindi Text",
        "text": "City hospital gate ke samne khula gutter manhole hai kripya jaldi thik karein.",
        "category": "open_manhole", "severity": 5,
        "lat": 28.6319, "lon": 77.2171, "sensitive": True, "days": 0.5, "expected_cluster": "Hospital_Manhole"
    },

    # Cluster 3: Overflowing Garbage Dump in Sector 15 Park (3 complaints near 28.5800, 77.3200)
    {
        "id": "C07",
        "type": "English Text",
        "text": "Massive pile of rotting garbage overflowing near Sector 15 community park entrance.",
        "category": "garbage", "severity": 3,
        "lat": 28.5800, "lon": 77.3200, "sensitive": False, "days": 2.0, "expected_cluster": "Sec15_Garbage"
    },
    {
        "id": "C08",
        "type": "Hindi Voice Note",
        "text": "Sector 15 park ke paas bahut saara kachra pada hua hai badboo aa rahi hai.",
        "category": "garbage", "severity": 3,
        "lat": 28.5801, "lon": 77.3201, "sensitive": False, "days": 2.5, "expected_cluster": "Sec15_Garbage"
    },
    {
        "id": "C09",
        "type": "Text + Photo",
        "text": "Trash dump blocking Sector 15 park gate, stinking up the whole road.",
        "category": "garbage", "severity": 3,
        "lat": 28.5799, "lon": 77.3199, "sensitive": False, "days": 3.0, "expected_cluster": "Sec15_Garbage"
    },

    # Cluster 4: Severe Waterlogging under Lajpat Nagar Flyover (3 complaints near 28.5688, 77.2433)
    {
        "id": "C10",
        "type": "English Text",
        "text": "Severe waterlogging under the Lajpat Nagar flyover after heavy rains. Cars stranded.",
        "category": "waterlogging", "severity": 4,
        "lat": 28.5688, "lon": 77.2433, "sensitive": True, "days": 1.0, "expected_cluster": "Lajpat_Waterlogging"
    },
    {
        "id": "C11",
        "type": "Hindi Voice Note",
        "text": "Lajpat Nagar flyover ke niche pura paani bhara hua hai gaadi nahi nikal rahi.",
        "category": "waterlogging", "severity": 4,
        "lat": 28.5689, "lon": 77.2434, "sensitive": True, "days": 1.2, "expected_cluster": "Lajpat_Waterlogging"
    },
    {
        "id": "C12",
        "type": "English Text",
        "text": "Waterlogging blocking all 3 lanes under Lajpat flyover.",
        "category": "waterlogging", "severity": 4,
        "lat": 28.5687, "lon": 77.2432, "sensitive": True, "days": 1.5, "expected_cluster": "Lajpat_Waterlogging"
    },

    # Cluster 5: Broken Streetlights in Sector 4 Lane (3 complaints near 28.6565, 77.2417)
    {
        "id": "C13",
        "type": "English Text",
        "text": "Dark streetlights broken and not glowing in Sector 4 residential lane.",
        "category": "streetlight", "severity": 2,
        "lat": 28.6565, "lon": 77.2417, "sensitive": False, "days": 4.0, "expected_cluster": "Sec4_Streetlight"
    },
    {
        "id": "C14",
        "type": "Hindi Text",
        "text": "Sector 4 lane mein bijli light kharab hai andhera hai.",
        "category": "streetlight", "severity": 2,
        "lat": 28.6566, "lon": 77.2418, "sensitive": False, "days": 4.5, "expected_cluster": "Sec4_Streetlight"
    },
    {
        "id": "C15",
        "type": "English Text",
        "text": "Streetlights out for past 4 days in Sector 4 main street.",
        "category": "streetlight", "severity": 2,
        "lat": 28.6564, "lon": 77.2416, "sensitive": False, "days": 5.0, "expected_cluster": "Sec4_Streetlight"
    }
]


def run_15_complaint_live_dedup_test():
    print("\n" + "=" * 80)
    print(f"{HEADER}LIVE 15-COMPLAINT JUDGING DEDUPLICATION TEST (PS-S05 BACKEND){RESET}".center(80))
    print("=" * 80)
    print(f"{BLUE}Ingesting 15 multimodal regional complaints across 5 distinct real-world locations...{RESET}\n")

    store = ComplaintClusterStore()
    cluster_mapping = {}

    start_time = time.time()

    for idx, item in enumerate(JUDGING_DATASET, 1):
        print(f"{BOLD}[{idx}/15] Ingesting Complaint {item['id']} ({item['type']}):{RESET}")
        print(f"  Text: \"{item['text']}\"")
        print(f"  Geo-Location: ({item['lat']:.4f}, {item['lon']:.4f}) | Pending: {item['days']} days")

        payload = {
            "report_id": item["id"],
            "latitude": item["lat"],
            "longitude": item["lon"],
            "raw_text": item["text"],
            "category": item.get("category"),
            "severity": item.get("severity"),
            "is_sensitive_location": item["sensitive"]
        }

        res = check_and_merge_complaint(payload, store=store)
        
        # Override priority with days_pending if passed
        cluster_obj = res["cluster"]
        cluster_obj["priority_score"] = calculate_priority_score(
            severity=cluster_obj["severity"],
            affected_citizens=cluster_obj["affected_citizens"],
            days_pending=item["days"],
            is_sensitive_location=cluster_obj["is_sensitive_location"]
        )

        cluster_mapping[item["id"]] = res["cluster_id"]

        if res["action"] == "created":
            status_str = f"{GREEN}[NEW CLUSTER CREATED]{RESET} -> ID: {res['cluster_id']}"
        else:
            status_str = f"{YELLOW}[MERGED INTO CLUSTER]{RESET} -> ID: {res['cluster_id']} (Sim: {res['similarity']:.4f})"

        print(f"  Result: {status_str} | Citizens: {cluster_obj['affected_citizens']} | Priority: {RED}{cluster_obj['priority_score']:.2f}{RESET}\n")

    total_time = (time.time() - start_time) * 1000

    print("=" * 80)
    print(f"{HEADER}15-COMPLAINT DEDUPLICATION RESULTS SUMMARY{RESET}".center(80))
    print("=" * 80)

    final_clusters = store.get_all_clusters()
    sorted_clusters = sorted(final_clusters, key=lambda c: c["priority_score"], reverse=True)

    print(f"\n{BOLD}Total Ingested Complaints : 15{RESET}")
    print(f"{BOLD}Unique Clusters Produced  : {GREEN}{len(final_clusters)}{RESET} (Expected Target: 5 Clusters)")
    print(f"{BOLD}Deduplication Efficiency  : {GREEN}{(1 - len(final_clusters)/15.0)*100:.1f}% Reduction in Official Workload{RESET}")
    print(f"{BOLD}Total Processing Time    : {total_time:.1f} ms\n")

    print(f"{BOLD}{'Rank':<5} {'Cluster ID':<18} {'Category':<15} {'Citizens':<10} {'Priority':<12} {'Location'}{RESET}")
    print("-" * 80)

    for rank, c in enumerate(sorted_clusters, 1):
        p_score = c["priority_score"]
        score_color = RED if p_score >= 80 else (YELLOW if p_score >= 50 else GREEN)
        loc_str = f"({c['latitude']:.4f}, {c['longitude']:.4f})"
        
        print(f"{rank:<5} {c['cluster_id']:<18} {c['category']:<15} {c['affected_citizens']:<10} {score_color}{p_score:<12.2f}{RESET} {loc_str}")

    print("=" * 80 + "\n")
    return store, sorted_clusters


def print_worked_priority_example(cluster: Dict[str, Any]):
    print("=" * 80)
    print(f"{HEADER}PRIORITY FORMULA DOCUMENTATION & WORKED MATHEMATICAL EXAMPLE{RESET}".center(80))
    print("=" * 80)
    
    print(f"\n{BOLD}Mathematical Formula (Transparent & Fully Explainable):{RESET}")
    print("""
  Priority Score = min(100.0, Base Score + Citizen Boost + Location Weight + Days Pending Boost)

  Where:
    1. Base Score            = Severity (1-5) * 15.0               [Range: 15 to 75 pts]
    2. Citizen Boost         = min(Affected Citizens * 5.0, 40.0)  [Range: 5 to 40 pts]
    3. Location Weight       = 20.0 if Sensitive Area else 10.0    [Range: 10 to 20 pts]
    4. Days Pending Boost    = min(Days Pending * 5.0, 25.0)        [Range: 0 to 25 pts]
    """)

    print(f"{BOLD}Worked Example using Top Cluster #{cluster['cluster_id']}:{RESET}")
    sev = cluster["severity"]
    cit = cluster["affected_citizens"]
    sens = cluster.get("is_sensitive_location", False)
    days = 1.0

    b_score = sev * 15.0
    c_score = min(cit * 5.0, 40.0)
    l_score = 20.0 if sens else 10.0
    d_score = min(days * 5.0, 25.0)
    tot = min(100.0, b_score + c_score + l_score + d_score)

    print(f"  • Category & Severity Rating : {cluster['category'].upper()} (Severity = {sev})")
    print(f"  • Affected Citizens Count   : {cit} citizen(s)")
    print(f"  • Location Sensitivity      : {'Sensitive Area (Hospital/School/Main Road)' if sens else 'Normal Area'}")
    print(f"  • Days Unresolved Pending   : {days} day(s)\n")

    print(f"  1. Base Severity Score      : {sev} × 15.0                    = {b_score:.1f} pts")
    print(f"  2. Affected Citizen Boost   : min({cit} × 5.0, 40.0)           = {c_score:.1f} pts")
    print(f"  3. Location Weight          : {'20.0 (Sensitive)' if sens else '10.0 (Normal)'}               = {l_score:.1f} pts")
    print(f"  4. Days Pending Boost       : min({days} × 5.0, 25.0)            = {d_score:.1f} pts")
    print(f"  -------------------------------------------------------------------------")
    print(f"  {BOLD}FINAL PRIORITY SCORE       : min(100.0, {b_score + c_score + l_score + d_score:.1f})      = {RED}{tot:.2f} / 100{RESET}\n")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    store, sorted_clusters = run_15_complaint_live_dedup_test()
    if len(sorted_clusters) > 0:
        print_worked_priority_example(sorted_clusters[0])
