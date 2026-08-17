"""
Spatio-Semantic Deduplication & Priority Engine for NagarAI Civic Engine
PS-S05: Performs 50m radius spatial filtering, cosine similarity text matching (>0.80 threshold),
and deterministic priority score calculations.
"""

import math
import time
import uuid
import logging
from typing import Dict, Any, List, Optional
import numpy as np


from text_processor import parse_complaint_text, generate_text_embedding
from image_classifier import classify_image, generate_image_embedding

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two points in meters using Haversine formula.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculates cosine similarity between two feature vectors.
    """
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return float(np.dot(a, b) / (norm_a * norm_b))


def calculate_priority_score(
    severity: int,
    affected_citizens: int,
    days_pending: float = 0.0,
    is_sensitive_location: bool = False
) -> float:
    """
    Transparent, Deterministic Civic Priority Score Calculator (Not a black-box model).

    Explicit Mathematical Formula:
    --------------------------------------------------------------------------------------
    1. Base Severity Score   = Severity (1-5) * 15.0               [Range: 15 to 75 pts]
    2. Affected Citizen Boost = min(Affected Citizens * 5.0, 40.0)  [Range: 5 to 40 pts]
    3. Location Weight       = 20.0 if Sensitive Area else 10.0    [Range: 10 to 20 pts]
    4. Days Pending Boost    = min(Days Pending * 5.0, 25.0)        [Range: 0 to 25 pts]

    Total Priority Score = min(100.0, Base + Citizen + Location + Days Pending)
    --------------------------------------------------------------------------------------
    """
    base_score = max(1, min(5, severity)) * 15.0
    citizen_score = min(affected_citizens * 5.0, 40.0)
    location_score = 20.0 if is_sensitive_location else 10.0
    time_score = min(days_pending * 5.0, 25.0)

    total_score = base_score + citizen_score + location_score + time_score
    return round(min(100.0, total_score), 2)



# Municipal Department Routing Table & SLA Timers (in hours)
DEPARTMENT_SLA_MAP = {
    "open_manhole": {"dept": "Sewerage & Emergency Infrastructure", "sla_hours": 12},
    "pothole": {"dept": "Roads & Traffic Engineering", "sla_hours": 24},
    "waterlogging": {"dept": "Drainage & Flood Management", "sla_hours": 18},
    "garbage": {"dept": "Solid Waste & Sanitation", "sla_hours": 36},
    "streetlight": {"dept": "Electrical & Public Lighting", "sla_hours": 48},
    "other": {"dept": "General Public Grievances", "sla_hours": 48}
}


def get_department_routing(category: str) -> Dict[str, Any]:
    """Returns department name and SLA duration for given category."""
    cat_clean = (category or "other").lower().replace(" ", "_")
    for key, info in DEPARTMENT_SLA_MAP.items():
        if key in cat_clean or cat_clean in key:
            return info
    return DEPARTMENT_SLA_MAP["other"]


class ComplaintClusterStore:
    """
    In-memory spatial & vector database store for deduplication testing and PostGIS emulation.
    """
    def __init__(self):
        self.clusters: Dict[str, Dict[str, Any]] = {}

    def get_all_clusters(self) -> List[Dict[str, Any]]:
        return list(self.clusters.values())

    def get_cluster(self, cluster_id: str) -> Optional[Dict[str, Any]]:
        return self.clusters.get(cluster_id)

    def add_cluster(self, cluster_data: Dict[str, Any]) -> str:
        cluster_id = cluster_data.get("cluster_id", f"cluster_{uuid.uuid4().hex[:8]}")
        cluster_data["cluster_id"] = cluster_id
        
        # Attach Department Routing & SLA
        dept_info = get_department_routing(cluster_data.get("category", "other"))
        cluster_data["assigned_department"] = dept_info["dept"]
        cluster_data["sla_hours"] = dept_info["sla_hours"]
        cluster_data["status"] = cluster_data.get("status", "SUBMITTED")
        cluster_data["created_at"] = cluster_data.get("created_at", time.time())
        cluster_data["notifications"] = cluster_data.get("notifications", [])

        self.clusters[cluster_id] = cluster_data
        return cluster_id

    def update_cluster_status(self, cluster_id: str, new_status: str) -> Optional[Dict[str, Any]]:
        """Updates status ('SUBMITTED' -> 'IN_PROGRESS' -> 'RESOLVED') and notifies citizens."""
        cluster = self.clusters.get(cluster_id)
        if not cluster:
            return None
        
        cluster["status"] = new_status
        msg = f"Status updated to '{new_status}' for cluster {cluster_id}. Notifying {cluster['affected_citizens']} citizen(s)."
        logger.info(msg)
        
        cluster["notifications"].append({
            "timestamp": time.time(),
            "status": new_status,
            "message": f"Dear Citizen, your civic complaint (Cluster {cluster_id}) status has been updated to {new_status}."
        })
        return cluster

    def clear(self):
        """Clears all stored complaint clusters to start fresh."""
        self.clusters.clear()
        logger.info("Complaint cluster store cleared. Starting fresh!")


# Global cluster store instance
DEFAULT_STORE = ComplaintClusterStore()


def clear_all_complaints(store: Optional[ComplaintClusterStore] = None):
    """Resets the complaint store to empty state."""
    if store is None:
        store = DEFAULT_STORE
    store.clear()


def check_and_merge_complaint(complaint_data: Dict[str, Any], store: Optional[ComplaintClusterStore] = None) -> Dict[str, Any]:
    """
    Task 4: Deduplication Logic.
    1. Extracts text & image embeddings.
    2. Queries DB for clusters within 50m radius.
    3. Compares text embeddings (cosine similarity > 0.80).
    4. If match found -> Increment affected_citizens, recalculate priority_score.
    5. If no match -> Create new cluster.
    6. Returns dict containing cluster_id, action ("merged" or "created"), and updated cluster info.
    """
    if store is None:
        store = DEFAULT_STORE

    lat = float(complaint_data.get("latitude", 0.0))
    lon = float(complaint_data.get("longitude", 0.0))
    raw_text = complaint_data.get("raw_text", "")
    image_path = complaint_data.get("image_path", "")
    is_sensitive = bool(complaint_data.get("is_sensitive_location", False))
    days_pending = float(complaint_data.get("days_pending", 0.0))

    # 1. Parse text & generate embeddings
    parsed_info = parse_complaint_text(raw_text)
    category = complaint_data.get("category") or parsed_info["category"]
    severity = complaint_data.get("severity") or parsed_info["severity"]
    summary = parsed_info["summary"]

    text_embedding = generate_text_embedding(summary)
    image_embedding = generate_image_embedding(image_path) if image_path else []

    # 2. Query store for nearby clusters within 50m radius
    nearby_clusters = []
    for cluster in store.get_all_clusters():
        dist_m = haversine_distance(lat, lon, cluster["latitude"], cluster["longitude"])
        if dist_m <= 50.0:
            nearby_clusters.append((dist_m, cluster))

    # 3. Compare text embeddings (cosine similarity > 0.80 threshold) & category matching
    matched_cluster = None
    highest_sim = 0.0

    for dist, cluster in nearby_clusters:
        sim = cosine_similarity(text_embedding, cluster["text_embedding"])
        same_category = (category.lower() == cluster.get("category", "").lower())
        logger.info(f"Comparing with cluster {cluster['cluster_id']}: dist={dist:.1f}m, similarity={sim:.4f}, same_category={same_category}")
        
        # Match if cosine similarity > 0.80 OR (same category within 50m radius and similarity > 0.30)
        if (sim >= 0.80 or (same_category and sim >= 0.30)) and sim > highest_sim:
            highest_sim = sim
            matched_cluster = cluster

    # 4. If match found -> Update cluster
    if matched_cluster is not None:
        cluster_id = matched_cluster["cluster_id"]
        matched_cluster["affected_citizens"] += 1
        matched_cluster["reports"].append({
            "report_id": complaint_data.get("report_id", f"rep_{uuid.uuid4().hex[:6]}"),
            "raw_text": raw_text,
            "timestamp": complaint_data.get("timestamp", time.time())
        })
        
        # Recalculate priority score
        new_priority = calculate_priority_score(
            severity=matched_cluster["severity"],
            affected_citizens=matched_cluster["affected_citizens"],
            days_pending=days_pending,
            is_sensitive_location=matched_cluster["is_sensitive_location"]
        )
        matched_cluster["priority_score"] = new_priority
        logger.info(f"Merged complaint into existing cluster {cluster_id}. New priority score: {new_priority}")

        return {
            "cluster_id": cluster_id,
            "action": "merged",
            "similarity": round(highest_sim, 4),
            "priority_score": new_priority,
            "affected_citizens": matched_cluster["affected_citizens"],
            "cluster": matched_cluster
        }

    # 5. If no match -> Create new cluster
    initial_priority = calculate_priority_score(
        severity=severity,
        affected_citizens=1,
        days_pending=days_pending,
        is_sensitive_location=is_sensitive
    )
    
    dept_info = get_department_routing(category)

    new_cluster = {
        "cluster_id": f"cluster_{uuid.uuid4().hex[:8]}",
        "category": category,
        "severity": severity,
        "summary": summary,
        "latitude": lat,
        "longitude": lon,
        "text_embedding": text_embedding,
        "image_embedding": image_embedding,
        "affected_citizens": 1,
        "priority_score": initial_priority,
        "is_sensitive_location": is_sensitive,
        "assigned_department": dept_info["dept"],
        "sla_hours": dept_info["sla_hours"],
        "status": "SUBMITTED",
        "created_at": time.time(),
        "notifications": [{
            "timestamp": time.time(),
            "status": "SUBMITTED",
            "message": "Complaint received and cluster created. Assigned to " + dept_info["dept"]
        }],
        "reports": [{
            "report_id": complaint_data.get("report_id", f"rep_{uuid.uuid4().hex[:6]}"),
            "raw_text": raw_text,
            "timestamp": complaint_data.get("timestamp", time.time())
        }]
    }

    cluster_id = store.add_cluster(new_cluster)
    logger.info(f"Created new cluster {cluster_id}. Initial priority score: {initial_priority}")

    return {
        "cluster_id": cluster_id,
        "action": "created",
        "similarity": 0.0,
        "priority_score": initial_priority,
        "affected_citizens": 1,
        "cluster": new_cluster
    }

