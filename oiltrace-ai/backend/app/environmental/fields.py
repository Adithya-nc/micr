import math
from typing import Dict, List, Tuple, Optional, Any


def interpolate_field(
    lat: float, lon: float, field_data: Dict[str, Any]
) -> Tuple[float, float]:
    points = field_data.get("points", [])
    if not points:
        raise ValueError("Empty environmental field data")
    field_type = field_data.get("field", "current")
    if field_type == "wind":
        u_key, v_key = "wind_u", "wind_v"
    else:
        u_key, v_key = "current_u", "current_v"

    min_dist = float("inf")
    nearest_u, nearest_v = 0.0, 0.0
    for pt in points:
        d = math.sqrt((pt["lat"] - lat)**2 + (pt["lon"] - lon)**2)
        if d < min_dist:
            min_dist = d
            nearest_u = pt[u_key]
            nearest_v = pt[v_key]

    if min_dist < 0.5:
        return nearest_u, nearest_v

    total_w = 0.0
    sum_u, sum_v = 0.0, 0.0
    for pt in points:
        d = math.sqrt((pt["lat"] - lat)**2 + (pt["lon"] - lon)**2)
        if d < 1e-10:
            return pt[u_key], pt[v_key]
        w = 1.0 / d**2
        sum_u += w * pt[u_key]
        sum_v += w * pt[v_key]
        total_w += w
    return sum_u / total_w, sum_v / total_w


def get_field_summary(field_data: Dict[str, Any]) -> Dict[str, Any]:
    points = field_data.get("points", [])
    field_type = field_data.get("field", "current")
    if field_type == "wind":
        u_key, v_key = "wind_u", "wind_v"
    else:
        u_key, v_key = "current_u", "current_v"
    us = [p[u_key] for p in points]
    vs = [p[v_key] for p in points]
    if not us:
        return {}
    import math as _m
    speeds = [_m.sqrt(u**2 + v**2) for u, v in zip(us, vs)]
    return {
        "mean_speed": sum(speeds) / len(speeds),
        "max_speed": max(speeds),
        "mean_u": sum(us) / len(us),
        "mean_v": sum(vs) / len(vs),
        "point_count": len(points),
    }
