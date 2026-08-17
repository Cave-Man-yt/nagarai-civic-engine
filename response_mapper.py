import datetime
from typing import Dict, Any, List, Optional
from landmarks import find_nearby_landmarks
from priority_engine import calculate_priority_score

def format_iso(dt: Optional[Any]) -> str:
    if dt is None:
        return datetime.datetime.now(datetime.timezone.utc).isoformat()
    if isinstance(dt, str):
        return dt
    if hasattr(dt, 'isoformat'):
        return dt.isoformat()
    return str(dt)

def map_complaint_to_frontend(cmp_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Maps a complaint record to StructuredComplaint interface."""
    coords = cmp_dict.get("coordinates") or {
        "lat": cmp_dict.get("gps_lat") or cmp_dict.get("latitude") or 0.0,
        "lng": cmp_dict.get("gps_lng") or cmp_dict.get("longitude") or 0.0,
    }
    
    landmarks = cmp_dict.get("nearbyLandmarks")
    if landmarks is None:
        landmarks = find_nearby_landmarks(coords["lat"], coords["lng"])

    category = cmp_dict.get("category") or "pothole"
    clean_desc = (
        cmp_dict.get("cleanDescription") or
        cmp_dict.get("summary") or
        cmp_dict.get("clean_description") or
        cmp_dict.get("rawText") or
        cmp_dict.get("raw_text") or
        f"{category.replace('_', ' ').title()} reported"
    )

    department_map = {
        'pothole': 'Roads & PWD',
        'garbage_dump': 'Solid Waste Management',
        'live_wire_hazard': 'Electricity & Power',
        'broken_streetlight': 'Electricity & Power',
        'open_manhole': 'Water Supply & Drainage',
        'waterlogging': 'Water Supply & Drainage',
        'water_leakage': 'Water Supply & Drainage',
        'fallen_tree': 'Urban Forestry & Disaster',
        'sewage_overflow': 'Water Supply & Drainage',
    }
    department = cmp_dict.get("department") or department_map.get(category, "Roads & PWD")

    return {
        "id": cmp_dict.get("id") or f"cmp-{int(datetime.datetime.now().timestamp()*1000)}",
        "ticketNumber": cmp_dict.get("ticketNumber") or cmp_dict.get("ticket_number") or f"NGR-{int(datetime.datetime.now().timestamp())%100000:05d}",
        "timestamp": format_iso(cmp_dict.get("timestamp") or cmp_dict.get("created_at")),
        "citizenName": cmp_dict.get("citizenName") or cmp_dict.get("citizen_name") or cmp_dict.get("user_id") or "Anonymous",
        "citizenPhone": cmp_dict.get("citizenPhone") or cmp_dict.get("citizen_phone") or "",
        "language": cmp_dict.get("language") or cmp_dict.get("inputLanguage") or "ta",
        "originalInputType": cmp_dict.get("originalInputType") or "text",
        "rawInputText": cmp_dict.get("rawInputText") or cmp_dict.get("raw_text") or clean_desc,
        "audioUrl": cmp_dict.get("audioUrl") or cmp_dict.get("audio_url"),
        "photoUrl": cmp_dict.get("photoUrl") or cmp_dict.get("photo_url") or cmp_dict.get("image_url"),
        "category": category,
        "severity": int(cmp_dict.get("severity") or 3),
        "cleanDescription": clean_desc,
        "locationName": cmp_dict.get("locationName") or cmp_dict.get("location_name") or "Municipal Ward",
        "coordinates": coords,
        "ward": cmp_dict.get("ward") or "Unassigned Ward",
        "department": department,
        "nearbyLandmarks": landmarks,
        "visionAnalysis": cmp_dict.get("visionAnalysis"),
        "clusterId": cmp_dict.get("clusterId") or cmp_dict.get("cluster_id"),
        "isDuplicate": bool(cmp_dict.get("isDuplicate") or cmp_dict.get("is_duplicate", False)),
        "transcription": cmp_dict.get("transcription"),
        "embedding": cmp_dict.get("embedding") or cmp_dict.get("text_embedding")
    }

def map_cluster_to_frontend(cluster_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Maps a cluster record to MasterCluster interface."""
    coords = cluster_dict.get("coordinates") or {
        "lat": cluster_dict.get("center_lat") or cluster_dict.get("latitude") or 0.0,
        "lng": cluster_dict.get("center_lng") or cluster_dict.get("longitude") or 0.0,
    }

    raw_complaints = cluster_dict.get("complaints") or []
    complaints = [map_complaint_to_frontend(c if isinstance(c, dict) else c.__dict__) for c in raw_complaints]

    category = cluster_dict.get("category") or (complaints[0]["category"] if complaints else "pothole")
    severity = int(cluster_dict.get("baseSeverity") or cluster_dict.get("severity") or (max([c["severity"] for c in complaints]) if complaints else 3))
    affected = int(cluster_dict.get("affectedCitizenCount") or cluster_dict.get("affected_citizens") or max(len(complaints), 1))
    days_pending = float(cluster_dict.get("daysPending") or cluster_dict.get("days_pending") or 0.0)

    landmarks = find_nearby_landmarks(coords["lat"], coords["lng"])
    priority_breakdown = cluster_dict.get("priorityBreakdown")
    if not priority_breakdown or not isinstance(priority_breakdown, dict):
        priority_breakdown = calculate_priority_score(severity, affected, days_pending, category, landmarks)

    priority_score = float(priority_breakdown.get("totalScore", cluster_dict.get("priority_score", 50.0)))

    department_map = {
        'pothole': 'Roads & PWD',
        'garbage_dump': 'Solid Waste Management',
        'live_wire_hazard': 'Electricity & Power',
        'broken_streetlight': 'Electricity & Power',
        'open_manhole': 'Water Supply & Drainage',
        'waterlogging': 'Water Supply & Drainage',
        'water_leakage': 'Water Supply & Drainage',
        'fallen_tree': 'Urban Forestry & Disaster',
        'sewage_overflow': 'Water Supply & Drainage',
    }
    department = cluster_dict.get("department") or cluster_dict.get("assigned_department") or department_map.get(category, "Roads & PWD")

    sla_hours_map = {
        'live_wire_hazard': 4,
        'open_manhole': 6,
        'water_leakage': 12,
        'waterlogging': 12,
        'sewage_overflow': 18,
        'garbage_dump': 24,
        'broken_streetlight': 24,
        'fallen_tree': 12,
        'pothole': 48,
    }
    sla_hours = int(cluster_dict.get("slaHours") or cluster_dict.get("sla_hours") or sla_hours_map.get(category, 24))

    title = (
        cluster_dict.get("title") or
        cluster_dict.get("summary") or
        (complaints[0]["cleanDescription"] if complaints else f"{category.replace('_', ' ').title()} Issue")
    )

    assigned_crew = cluster_dict.get("assignedCrew")
    if not assigned_crew and cluster_dict.get("assigned_crew"):
        assigned_crew = cluster_dict.get("assigned_crew")

    activity_logs = cluster_dict.get("activityLogs") or [
        {
            "timestamp": format_iso(cluster_dict.get("created_at")),
            "action": "CLUSTER_INITIALIZED",
            "actor": "NagarAI Engine",
            "details": f"Cluster created with {affected} complaint(s)"
        }
    ]

    status = (cluster_dict.get("status") or "pending").lower()
    if status == "submitted":
        status = "pending"

    return {
        "id": str(cluster_dict.get("id") or f"cluster-{int(datetime.datetime.now().timestamp()*1000)}"),
        "clusterCode": cluster_dict.get("clusterCode") or cluster_dict.get("cluster_code") or f"CL-{int(datetime.datetime.now().timestamp())%10000:04d}",
        "title": title,
        "category": category,
        "department": department,
        "ward": cluster_dict.get("ward") or "Unassigned Ward",
        "locationName": cluster_dict.get("locationName") or cluster_dict.get("location_name") or "Municipal Ward",
        "coordinates": coords,
        "centroidRadiusMeters": int(cluster_dict.get("centroidRadiusMeters") or cluster_dict.get("centroid_radius_meters") or 30),
        "status": status,
        "slaHours": sla_hours,
        "reportedAt": format_iso(cluster_dict.get("reportedAt") or cluster_dict.get("reported_at") or cluster_dict.get("created_at")),
        "daysPending": days_pending,
        "affectedCitizenCount": affected,
        "baseSeverity": severity,
        "priorityScore": priority_score,
        "priorityBreakdown": priority_breakdown,
        "complaints": complaints,
        "assignedCrew": assigned_crew,
        "resolution": cluster_dict.get("resolution") or cluster_dict.get("resolution_data"),
        "activityLogs": activity_logs
    }

def map_crew_to_frontend(crew: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "crewId": crew.get("crewId") or crew.get("crew_id") or "CREW-01",
        "name": crew.get("name") or "Rapid Response Unit",
        "department": crew.get("department") or "Roads & PWD",
        "contact": crew.get("contact") or "",
        "vehicleNumber": crew.get("vehicleNumber") or crew.get("vehicle_number") or "",
        "status": crew.get("status") or "available"
    }

def map_citizen_notification_to_frontend(notif: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": notif.get("id") or f"notif-{int(datetime.datetime.now().timestamp()*1000)}",
        "citizenPhone": notif.get("citizenPhone") or notif.get("recipient_phone") or notif.get("citizen_phone") or "",
        "recipientPhone": notif.get("recipientPhone") or notif.get("recipient_phone") or notif.get("citizen_phone") or "",
        "citizenName": notif.get("citizenName") or notif.get("recipient_name") or "Citizen",
        "clusterCode": notif.get("clusterCode") or notif.get("cluster_code") or "CL-1001",
        "ticketNumber": notif.get("ticketNumber") or notif.get("ticket_number") or "NGR-1001",
        "channel": notif.get("channel") or "sms",
        "type": notif.get("type") or "intake_received",
        "message": notif.get("message") or "Your civic grievance has been recorded.",
        "timestamp": format_iso(notif.get("timestamp") or notif.get("sentAt") or notif.get("sent_at")),
        "sentAt": format_iso(notif.get("sentAt") or notif.get("timestamp")),
        "status": notif.get("status") or "delivered",
        "actionTaken": notif.get("actionTaken") or notif.get("action_taken")
    }

def map_officer_notification_to_frontend(notif: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": notif.get("id") or f"off-notif-{int(datetime.datetime.now().timestamp()*1000)}",
        "clusterId": notif.get("clusterId") or notif.get("cluster_id"),
        "clusterCode": notif.get("clusterCode") or notif.get("cluster_code") or "CL-1001",
        "title": notif.get("title") or "Tactical Alert",
        "department": notif.get("department") or "Roads & PWD",
        "priorityScore": float(notif.get("priorityScore") or notif.get("priority_score") or 50.0),
        "severity": int(notif.get("severity") or 3),
        "type": notif.get("type") or "critical_emergency",
        "message": notif.get("message") or "Attention required for emergency ticket.",
        "timestamp": format_iso(notif.get("timestamp")),
        "ward": notif.get("ward") or "Unassigned Ward",
        "locationName": notif.get("locationName") or notif.get("location_name") or "Municipal Ward",
        "actionRequired": bool(notif.get("actionRequired") if "actionRequired" in notif else notif.get("action_required", True))
    }
