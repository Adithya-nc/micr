import math
from typing import Dict, List, Any, Optional


EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = EARTH_RADIUS_KM
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return 2 * r * math.asin(math.sqrt(a))


def normalize_proximity(distance_km: float, max_radius_km: float = 50.0) -> float:
    return max(0.0, 1.0 - distance_km / max_radius_km)


def normalize_temporal(time_delta_h: float, window_h: float = 2.0) -> float:
    return max(0.0, 1.0 - abs(time_delta_h) / window_h)


def normalize_trajectory(overlap_score: float) -> float:
    return max(0.0, min(1.0, overlap_score))


def normalize_heading(compat_score: float) -> float:
    return max(0.0, min(1.0, compat_score))


def normalize_continuity(coverage_pct: float, gap_detected: bool, gap_duration_min: Optional[float]) -> float:
    base = coverage_pct / 100.0
    if gap_detected and gap_duration_min:
        penalty = min(0.3, gap_duration_min / 300.0)
        base = max(0.0, base - penalty)
    return base


def compute_trajectory_score(
    observations: List[Dict],
    origin_lat: float,
    origin_lon: float,
    spill_lat: float,
    spill_lon: float,
) -> float:
    if len(observations) < 2:
        return 0.0
    passage_scores = []
    origin_dist = min(
        haversine_km(o["latitude"], o["longitude"], origin_lat, origin_lon)
        for o in observations
    )
    max_passage_dist = 25.0
    score = max(0.0, 1.0 - origin_dist / max_passage_dist)
    return round(score, 4)


def compute_heading_score(
    observations: List[Dict],
    current_u: float, current_v: float,
    wind_u: float, wind_v: float,
    alpha: float = 0.03,
) -> float:
    if len(observations) < 2:
        return 0.0
    eff_u = current_u + alpha * wind_u
    eff_v = current_v + alpha * wind_v
    oil_dir = math.degrees(math.atan2(eff_u, eff_v)) % 360

    ship_dirs = []
    sorted_obs = sorted(observations, key=lambda x: x["timestamp"])
    for i in range(len(sorted_obs) - 1):
        dlat = sorted_obs[i+1]["latitude"] - sorted_obs[i]["latitude"]
        dlon = sorted_obs[i+1]["longitude"] - sorted_obs[i]["longitude"]
        if abs(dlat) + abs(dlon) > 1e-6:
            d = math.degrees(math.atan2(dlon, dlat)) % 360
            ship_dirs.append(d)

    if not ship_dirs:
        return 0.5
    ship_dir_mean = sum(ship_dirs) / len(ship_dirs)
    angle_diff = abs((ship_dir_mean - oil_dir + 180) % 360 - 180)
    return max(0.0, 1.0 - angle_diff / 180.0)


def score_vessel(
    mmsi: str,
    observations: List[Dict],
    origin_lat: float,
    origin_lon: float,
    origin_time_str: str,
    spill_lat: float,
    spill_lon: float,
    current_u: float = 0.18,
    current_v: float = 0.12,
    wind_u: float = 5.2,
    wind_v: float = 3.8,
    alpha: float = 0.03,
    spatial_radius_km: float = 50.0,
    temporal_window_h: float = 2.0,
    weights: Optional[Dict[str, float]] = None,
    behaviour_features: Optional[Dict] = None,
) -> Dict[str, Any]:
    from datetime import datetime, timezone
    if weights is None:
        weights = {"proximity": 0.35, "temporal": 0.25, "trajectory": 0.20,
                   "heading": 0.10, "continuity": 0.10}

    from app.ais.engine import nearest_obs_to_origin, parse_dt
    nearest = nearest_obs_to_origin(observations, origin_lat, origin_lon)
    if nearest is None:
        return {"mmsi": mmsi, "evidence_score": 0.0, "data_confidence": 0.0, "final_score": 0.0}

    distance_km = haversine_km(nearest["latitude"], nearest["longitude"], origin_lat, origin_lon)
    origin_time = parse_dt(origin_time_str)
    obs_time = parse_dt(nearest["timestamp"])
    time_delta_h = (obs_time - origin_time).total_seconds() / 3600.0

    traj_score = compute_trajectory_score(observations, origin_lat, origin_lon, spill_lat, spill_lon)
    heading_score = compute_heading_score(observations, current_u, current_v, wind_u, wind_v, alpha)

    bf = behaviour_features or {}
    coverage_pct = bf.get("ais_coverage_pct", 80.0)
    gap_detected = bf.get("ais_gap_detected", False)
    gap_dur = bf.get("ais_gap_duration_min", None)

    norm_prox = normalize_proximity(distance_km, spatial_radius_km)
    norm_temp = normalize_temporal(time_delta_h, temporal_window_h)
    norm_traj = normalize_trajectory(traj_score)
    norm_head = normalize_heading(heading_score)
    norm_cont = normalize_continuity(coverage_pct, gap_detected, gap_dur)

    evidence_score = (
        weights["proximity"] * norm_prox +
        weights["temporal"] * norm_temp +
        weights["trajectory"] * norm_traj +
        weights["heading"] * norm_head +
        weights["continuity"] * norm_cont
    )

    data_confidence = min(1.0, (coverage_pct / 100.0) * (0.9 if not gap_detected else 0.75))
    final_score = evidence_score * data_confidence

    factors = [
        {
            "factor": "spatial_proximity",
            "label": "Distance proximity",
            "raw_value": round(distance_km, 3),
            "raw_unit": "km",
            "normalized": round(norm_prox, 4),
            "weight": weights["proximity"],
            "contribution": round(weights["proximity"] * norm_prox, 4),
        },
        {
            "factor": "temporal_alignment",
            "label": "Temporal alignment",
            "raw_value": round(abs(time_delta_h), 3),
            "raw_unit": "h",
            "normalized": round(norm_temp, 4),
            "weight": weights["temporal"],
            "contribution": round(weights["temporal"] * norm_temp, 4),
        },
        {
            "factor": "track_compatibility",
            "label": "Track compatibility",
            "raw_value": round(traj_score, 4),
            "raw_unit": "score",
            "normalized": round(norm_traj, 4),
            "weight": weights["trajectory"],
            "contribution": round(weights["trajectory"] * norm_traj, 4),
        },
        {
            "factor": "heading_compatibility",
            "label": "Heading compatibility",
            "raw_value": round(heading_score, 4),
            "raw_unit": "score",
            "normalized": round(norm_head, 4),
            "weight": weights["heading"],
            "contribution": round(weights["heading"] * norm_head, 4),
        },
        {
            "factor": "ais_continuity",
            "label": "AIS continuity",
            "raw_value": round(coverage_pct, 1),
            "raw_unit": "%",
            "normalized": round(norm_cont, 4),
            "weight": weights["continuity"],
            "contribution": round(weights["continuity"] * norm_cont, 4),
        },
    ]

    return {
        "mmsi": mmsi,
        "distance_km": round(distance_km, 3),
        "time_delta_h": round(time_delta_h, 3),
        "track_overlap_score": round(traj_score, 4),
        "heading_compat_score": round(heading_score, 4),
        "ais_continuity_score": round(norm_cont, 4),
        "norm_proximity": round(norm_prox, 4),
        "norm_temporal": round(norm_temp, 4),
        "norm_trajectory": round(norm_traj, 4),
        "norm_heading": round(norm_head, 4),
        "norm_continuity": round(norm_cont, 4),
        "evidence_score": round(evidence_score, 4),
        "data_confidence": round(data_confidence, 4),
        "final_score": round(final_score, 4),
        "factors": factors,
        "behaviour_observations": bf.get("behaviour_observations", []),
        "ais_gap_detected": gap_detected,
        "ais_gap_duration_min": gap_dur,
        "slowdown_observed": bf.get("slowdown_observed", False),
        "course_change_observed": bf.get("course_change_observed", False),
        "ais_coverage_pct": coverage_pct,
        "weights_used": weights,
    }


def rank_vessels(vessel_scores: List[Dict]) -> List[Dict]:
    sorted_scores = sorted(vessel_scores, key=lambda x: x["final_score"], reverse=True)
    for i, v in enumerate(sorted_scores):
        v["rank"] = i + 1
    return sorted_scores
