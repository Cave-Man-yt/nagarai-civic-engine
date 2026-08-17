import logging
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from geoalchemy2.functions import ST_DWithin, ST_MakePoint, ST_SetSRID, ST_DistanceSphere
from app.models import Cluster, Complaint


logger = logging.getLogger(__name__)


def find_nearby_clusters(db: Session, lat: float, lng: float, radius_meters: float = 50.0) -> List[Tuple[Cluster, float]]:
    """
    Task 4: Spatial Query Utility using PostGIS ST_DistanceSphere / ST_DWithin.
    Queries active clusters within specified radius_meters (default 50m).
    """
    point_geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    
    # Calculate distance in meters using PostGIS ST_DistanceSphere
    query = (
        db.query(Cluster, ST_DistanceSphere(Cluster.center_location, point_geom).label("dist_m"))
        .filter(ST_DistanceSphere(Cluster.center_location, point_geom) <= radius_meters)
        .order_by("dist_m")
    )
    
    results = []
    for cluster, dist in query.all():
        results.append((cluster, float(dist)))
        
    return results


def semantic_similarity_check(
    db: Session,
    text_embedding: List[float],
    nearby_cluster_ids: List[str],
    threshold: float = 0.80
) -> Optional[Tuple[Cluster, float]]:
    """
    Task 4: Vector Similarity Check Utility using pgvector cosine distance operator (<=>).
    Returns matched cluster if cosine similarity >= threshold (default 0.80).
    Note: Cosine Similarity = 1 - Cosine Distance.
    """
    if not text_embedding or not nearby_cluster_ids:
        return None

    # Query complaints belonging to nearby clusters and compute pgvector cosine similarity
    # 1 - (text_embedding <=> :query_vec)
    sql = text("""
        SELECT cluster_id, 1 - (text_embedding <=> :query_vec) AS similarity
        FROM complaints
        WHERE cluster_id = ANY(:cluster_ids)
          AND text_embedding IS NOT NULL
        ORDER BY text_embedding <=> :query_vec ASC
        LIMIT 1;
    """)

    vec_str = "[" + ",".join(map(str, text_embedding)) + "]"
    res = db.execute(sql, {"query_vec": vec_str, "cluster_ids": nearby_cluster_ids}).fetchone()

    if res and res.similarity is not None:
        sim = float(res.similarity)
        if sim >= threshold:
            cluster = db.query(Cluster).filter(Cluster.id == res.cluster_id).first()
            if cluster:
                return (cluster, sim)

    return None


def merge_complaint_to_cluster(db: Session, complaint_id: str, cluster_id: str) -> Optional[Cluster]:
    """
    Task 4: Merges complaint to existing cluster and increments affected_citizens counter.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()

    if not complaint or not cluster:
        return None

    complaint.cluster_id = cluster.id
    cluster.affected_citizens += 1

    # Recalculate priority score
    # Formula: min(100.0, (Severity * 15) + min(Citizens * 5, 40) + Location Weight)
    base_sev = cluster.severity * 15.0
    cit_boost = min(cluster.affected_citizens * 5.0, 40.0)
    loc_weight = 20.0 if cluster.is_sensitive_location else 10.0
    cluster.priority_score = round(min(100.0, base_sev + cit_boost + loc_weight), 2)

    db.commit()
    db.refresh(cluster)
    logger.info(f"Merged complaint {complaint_id} into cluster {cluster_id}. Citizens count: {cluster.affected_citizens}")
    return cluster
