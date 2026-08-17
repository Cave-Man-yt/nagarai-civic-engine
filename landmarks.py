import math
from typing import List, Dict, Any, Optional

# Built-in civic landmarks for real-world simulation in demo city (Chennai / Bangalore / Delhi civic grid)
KNOWN_CIVIC_LANDMARKS: List[Dict[str, Any]] = [
    {"name": "Kendriya Vidyalaya Senior Secondary School", "type": "school", "lat": 13.0827, "lng": 80.2707},
    {"name": "St. Mary’s Anglo-Indian Girls School", "type": "school", "lat": 13.0855, "lng": 80.2785},
    {"name": "Government General Hospital (Rajiv Gandhi)", "type": "hospital", "lat": 13.0812, "lng": 80.2762},
    {"name": "Apollo Speciality Children’s Hospital", "type": "hospital", "lat": 13.0604, "lng": 80.2496},
    {"name": "Central Metro Interchange Station", "type": "metro", "lat": 13.0824, "lng": 80.2755},
    {"name": "Anna Nagar West Bus Terminus", "type": "metro", "lat": 13.0878, "lng": 80.2088},
    {"name": "Koyambedu Wholesale Market Complex", "type": "market", "lat": 13.0694, "lng": 80.1948},
    {"name": "T. Nagar Ranganathan Commercial Hub", "type": "market", "lat": 13.0405, "lng": 80.2337},
]

def get_haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    """Calculates the Haversine distance between two coordinates in meters."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return int(round(R * c))

def find_nearby_landmarks(lat: float, lng: float, radius_m: int = 1200) -> List[Dict[str, Any]]:
    """Finds nearby landmarks within radius_m of a given coordinate."""
    landmarks = []
    for lm in KNOWN_CIVIC_LANDMARKS:
        dist = get_haversine_distance_meters(lat, lng, lm["lat"], lm["lng"])
        if dist <= radius_m:
            landmarks.append({
                "name": lm["name"],
                "type": lm["type"],
                "distanceMeters": dist,
                "coordinates": {"lat": lm["lat"], "lng": lm["lng"]}
            })
    return sorted(landmarks, key=lambda x: x["distanceMeters"])

def calculate_centroid(points: List[Dict[str, float]]) -> Dict[str, float]:
    """Computes the geometric centroid of a set of coordinates."""
    if not points:
        return {"lat": 0.0, "lng": 0.0}
    sum_lat = sum(p["lat"] for p in points)
    sum_lng = sum(p["lng"] for p in points)
    n = len(points)
    return {
        "lat": round(sum_lat / n, 6),
        "lng": round(sum_lng / n, 6)
    }

def calculate_spread_radius_meters(centroid: Dict[str, float], points: List[Dict[str, float]]) -> int:
    """Computes maximum radius of spread across points in meters."""
    if len(points) <= 1:
        return 30
    max_dist = 30
    for p in points:
        dist = get_haversine_distance_meters(centroid["lat"], centroid["lng"], p["lat"], p["lng"])
        if dist > max_dist:
            max_dist = dist
    return min(max_dist + 20, 250)
