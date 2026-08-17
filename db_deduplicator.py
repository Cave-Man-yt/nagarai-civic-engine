import math
import logging
from typing import Dict, Any, List, Optional, Tuple
from landmarks import (
    get_haversine_distance_meters,
    find_nearby_landmarks,
    calculate_centroid,
    calculate_spread_radius_meters
)
from priority_engine import calculate_priority_score

logger = logging.getLogger("nagarai.deduplicator")

def cosine_similarity(vec_a: Optional[List[float]], vec_b: Optional[List[float]]) -> float:
    """Calculates cosine similarity between two numeric vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b) or len(vec_a) == 0:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))

def text_semantic_similarity(text1: str, text2: str) -> float:
    """Fallback keyword token overlap similarity."""
    if not text1 or not text2:
        return 0.0
    
    def tokenize(t: str) -> set:
        words = ''.join(c.lower() if c.isalnum() else ' ' for c in t).split()
        return {w for w in words if len(w) > 2}
    
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    if not tokens1 or not tokens2:
        return 0.0
    intersection = len(tokens1.intersection(tokens2))
    union = len(tokens1.union(tokens2))
    return float(intersection / union) if union > 0 else 0.0

def is_duplicate_complaint(
    candidate: Dict[str, Any],
    cluster: Dict[str, Any],
    max_geo_distance_meters: int = 250
) -> Tuple[bool, float, List[str]]:
    """
    Determines whether a new complaint belongs to an existing cluster.
    Criteria:
    1. Category match
    2. Distance <= 250m
    3. Cosine similarity >= 0.70 OR text overlap >= 0.18 OR distance <= 90m
    """
    reasons = []
    
    cand_cat = candidate.get("category", "")
    cluster_cat = cluster.get("category", "")
    if cand_cat != cluster_cat:
        return False, 0.0, ["Category mismatch"]

    cand_coords = candidate.get("coordinates") or {
        "lat": candidate.get("gps_lat") or candidate.get("latitude") or 13.0827,
        "lng": candidate.get("gps_lng") or candidate.get("longitude") or 80.2707
    }
    cluster_coords = cluster.get("coordinates") or {
        "lat": cluster.get("center_lat") or 13.0827,
        "lng": cluster.get("center_lng") or 80.2707
    }

    distance = get_haversine_distance_meters(
        cand_coords["lat"], cand_coords["lng"],
        cluster_coords["lat"], cluster_coords["lng"]
    )

    if distance > max_geo_distance_meters:
        return False, 0.0, [f"Distance too far ({distance}m > {max_geo_distance_meters}m)"]

    reasons.append(f"Close proximity ({distance}m within {max_geo_distance_meters}m)")

    # Vector similarity
    cand_emb = candidate.get("embedding") or candidate.get("text_embedding")
    cluster_complaints = cluster.get("complaints") or []
    cluster_emb = None
    if cluster_complaints:
        first_cmp = cluster_complaints[0]
        if isinstance(first_cmp, dict):
            cluster_emb = first_cmp.get("embedding") or first_cmp.get("text_embedding")
        elif hasattr(first_cmp, "text_embedding"):
            cluster_emb = first_cmp.text_embedding

    sim_score = 0.5
    if cand_emb and cluster_emb:
        sim_score = cosine_similarity(cand_emb, cluster_emb)
        reasons.append(f"Embedding similarity: {sim_score*100:.1f}%")
    else:
        text1 = candidate.get("cleanDescription") or candidate.get("rawInputText") or candidate.get("raw_text") or ""
        text2 = cluster.get("title") or cluster.get("summary") or ""
        sim_score = text_semantic_similarity(text1, text2)
        reasons.append(f"Keyword semantic overlap: {sim_score*100:.1f}%")

    is_dup = (distance <= max_geo_distance_meters) and (sim_score >= 0.18 or distance <= 90)
    return is_dup, sim_score, reasons
