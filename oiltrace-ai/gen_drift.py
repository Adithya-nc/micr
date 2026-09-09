from pathlib import Path

def w(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.lstrip("\n"), encoding="utf-8")
    print(f"  wrote {path}")

# ── geometry/calculator.py ─────────────────────────────────────────────────
w("backend/app/geometry/calculator.py", """
import math
from typing import Dict, List, Tuple, Any


EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = EARTH_RADIUS_KM
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2)**2
    return 2 * r * math.asin(math.sqrt(a))


def polygon_area_km2(coords: List[List[float]]) -> float:
    n = len(coords)
    if n < 3:
        return 0.0
    total = 0.0
    for i in range(n):
        j = (i + 1) % n
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[j]
        lat_mid = math.radians((lat1 + lat2) / 2)
        dx = math.radians(lon2 - lon1) * EARTH_RADIUS_KM * math.cos(lat_mid)
        dy = math.radians(lat2 - lat1) * EARTH_RADIUS_KM
        total += dx * dy
    return abs(total) / 2.0


def polygon_perimeter_km(coords: List[List[float]]) -> float:
    n = len(coords)
    total = 0.0
    for i in range(n - 1):
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[i + 1]
        total += haversine_km(lat1, lon1, lat2, lon2)
    return total


def polygon_centroid(coords: List[List[float]]) -> Tuple[float, float]:
    lons = [c[0] for c in coords[:-1]]
    lats = [c[1] for c in coords[:-1]]
    return sum(lats) / len(lats), sum(lons) / len(lons)


def polygon_bounding_box(coords: List[List[float]]) -> Dict[str, float]:
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return {"min_lat": min(lats), "max_lat": max(lats), "min_lon": min(lons), "max_lon": max(lons)}


def polygon_compactness(area_km2: float, perimeter_km: float) -> float:
    if perimeter_km == 0:
        return 0.0
    return (4 * math.pi * area_km2) / (perimeter_km ** 2)


def characterize_polygon(geojson_polygon: Dict[str, Any]) -> Dict[str, Any]:
    coords = geojson_polygon["coordinates"][0]
    area = polygon_area_km2(coords)
    perim = polygon_perimeter_km(coords)
    centroid_lat, centroid_lon = polygon_centroid(coords)
    bb = polygon_bounding_box(coords)
    compactness = polygon_compactness(area, perim)
    length = haversine_km(bb["min_lat"], bb["min_lon"], bb["min_lat"], bb["max_lon"])
    width = haversine_km(bb["min_lat"], bb["min_lon"], bb["max_lat"], bb["min_lon"])
    if length < width:
        length, width = width, length
    dlat = bb["max_lat"] - bb["min_lat"]
    dlon = bb["max_lon"] - bb["min_lon"]
    orientation = math.degrees(math.atan2(dlon, dlat)) % 180
    return {
        "centroid_lat": round(centroid_lat, 6),
        "centroid_lon": round(centroid_lon, 6),
        "area_km2": round(area, 4),
        "perimeter_km": round(perim, 4),
        "length_km": round(length, 4),
        "width_km": round(width, 4),
        "orientation_deg": round(orientation, 2),
        "compactness": round(compactness, 6),
        "bounding_box": bb,
    }
""")

# ── environmental/fields.py ────────────────────────────────────────────────
w("backend/app/environmental/fields.py", """
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
""")

# ── drift/particle_engine.py ───────────────────────────────────────────────
w("backend/app/drift/particle_engine.py", """
import math
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from app.environmental.fields import interpolate_field


EARTH_RADIUS_KM = 6371.0


def latlon_offset(lat: float, lon: float, u_ms: float, v_ms: float, dt_s: float) -> Tuple[float, float]:
    dlat = (v_ms * dt_s) / (EARTH_RADIUS_KM * 1000) * (180 / math.pi)
    dlon = (u_ms * dt_s) / (EARTH_RADIUS_KM * 1000 * math.cos(math.radians(lat))) * (180 / math.pi)
    return lat + dlat, lon + dlon


def rk4_step(
    lat: float, lon: float, current_data: Dict, wind_data: Dict,
    windage_alpha: float, dt_s: float, direction: int = 1
) -> Tuple[float, float]:
    def velocity(la, lo):
        cu, cv = interpolate_field(la, lo, current_data)
        wu, wv = interpolate_field(la, lo, wind_data)
        u_eff = (cu + windage_alpha * wu) * direction
        v_eff = (cv + windage_alpha * wv) * direction
        return u_eff, v_eff

    u1, v1 = velocity(lat, lon)
    lat2, lon2 = latlon_offset(lat, lon, u1, v1, dt_s / 2)
    u2, v2 = velocity(lat2, lon2)
    lat3, lon3 = latlon_offset(lat, lon, u2, v2, dt_s / 2)
    u3, v3 = velocity(lat3, lon3)
    lat4, lon4 = latlon_offset(lat, lon, u3, v3, dt_s)
    u4, v4 = velocity(lat4, lon4)

    u_avg = (u1 + 2*u2 + 2*u3 + u4) / 6
    v_avg = (v1 + 2*v2 + 2*v3 + v4) / 6
    return latlon_offset(lat, lon, u_avg, v_avg, dt_s)


def run_hindcast(
    spill_lat: float,
    spill_lon: float,
    spill_polygon_coords: List[List[float]],
    t0: datetime,
    current_data: Dict,
    wind_data: Dict,
    windage_coefficient: float = 0.03,
    particle_count: int = 100,
    timestep_min: int = 30,
    hindcast_hours: float = 18.0,
    seed: int = 26143,
) -> Dict[str, Any]:
    rng = np.random.default_rng(seed)
    dt_s = timestep_min * 60
    n_steps = int(hindcast_hours * 60 / timestep_min)

    # Initialize particles from spill polygon extent
    lons = [c[0] for c in spill_polygon_coords]
    lats = [c[1] for c in spill_polygon_coords]
    lat_min, lat_max = min(lats), max(lats)
    lon_min, lon_max = min(lons), max(lons)

    init_lats = rng.uniform(lat_min, lat_max, particle_count)
    init_lons = rng.uniform(lon_min, lon_max, particle_count)

    particles_history = []
    final_positions = []

    for p_idx in range(particle_count):
        lat = float(init_lats[p_idx])
        lon = float(init_lons[p_idx])
        trajectory = [{"step": 0, "lat": round(lat, 6), "lon": round(lon, 6),
                        "timestamp": t0.isoformat(), "mode": "reconstructed"}]

        for step in range(1, n_steps + 1):
            lat, lon = rk4_step(lat, lon, current_data, wind_data, windage_coefficient,
                                  dt_s, direction=-1)
            lat += rng.normal(0, 0.002)
            lon += rng.normal(0, 0.002)
            ts = t0 - timedelta(minutes=step * timestep_min)
            trajectory.append({"step": -step, "lat": round(lat, 6), "lon": round(lon, 6),
                                 "timestamp": ts.isoformat(), "mode": "reconstructed"})

        particles_history.append({"particle_id": p_idx, "trajectory": trajectory})
        final_positions.append({"lat": lat, "lon": lon})

    final_lats = [p["lat"] for p in final_positions]
    final_lons = [p["lon"] for p in final_positions]
    origin_lat = float(np.mean(final_lats))
    origin_lon = float(np.mean(final_lons))
    std_lat = float(np.std(final_lats))
    std_lon = float(np.std(final_lons))
    spatial_uncertainty_km = float(np.sqrt(std_lat**2 + std_lon**2) * 111.32)

    n_sides = 16
    angles = [i * 2 * math.pi / n_sides for i in range(n_sides)]
    sigma = max(std_lat, std_lon, 0.05) * 2.0
    ellipse_coords = [
        [round(origin_lon + sigma * math.cos(a), 6), round(origin_lat + sigma * math.sin(a), 6)]
        for a in angles
    ]
    ellipse_coords.append(ellipse_coords[0])

    origin_time = t0 - timedelta(hours=hindcast_hours)
    time_uncertainty_h = 1.5

    return {
        "particles": particles_history,
        "origin_lat": round(origin_lat, 6),
        "origin_lon": round(origin_lon, 6),
        "spatial_uncertainty_km": round(spatial_uncertainty_km, 3),
        "origin_time_estimate": origin_time.isoformat(),
        "origin_time_uncertainty_h": time_uncertainty_h,
        "origin_region_geojson": {"type": "Polygon", "coordinates": [ellipse_coords]},
        "origin_centroid_geojson": {"type": "Point", "coordinates": [round(origin_lon, 6), round(origin_lat, 6)]},
        "windage_coefficient": windage_coefficient,
        "particle_count": particle_count,
        "timestep_min": timestep_min,
        "hindcast_hours": hindcast_hours,
        "integration_method": "RK4",
        "n_steps": n_steps,
    }


def run_forecast(
    spill_lat: float,
    spill_lon: float,
    spill_polygon_coords: List[List[float]],
    t0: datetime,
    current_data: Dict,
    wind_data: Dict,
    windage_coefficient: float = 0.03,
    particle_count: int = 100,
    timestep_min: int = 30,
    forecast_hours: float = 48.0,
    seed: int = 26143,
) -> Dict[str, Any]:
    rng = np.random.default_rng(seed + 1)
    dt_s = timestep_min * 60
    n_steps = int(forecast_hours * 60 / timestep_min)

    lons = [c[0] for c in spill_polygon_coords]
    lats = [c[1] for c in spill_polygon_coords]
    lat_min, lat_max = min(lats), max(lats)
    lon_min, lon_max = min(lons), max(lons)

    init_lats = rng.uniform(lat_min, lat_max, particle_count)
    init_lons = rng.uniform(lon_min, lon_max, particle_count)

    particles_history = []
    horizon_summaries = {}

    for p_idx in range(particle_count):
        lat = float(init_lats[p_idx])
        lon = float(init_lons[p_idx])
        trajectory = [{"step": 0, "lat": round(lat, 6), "lon": round(lon, 6),
                        "timestamp": t0.isoformat(), "mode": "observed"}]

        for step in range(1, n_steps + 1):
            lat, lon = rk4_step(lat, lon, current_data, wind_data, windage_coefficient,
                                  dt_s, direction=1)
            lat += rng.normal(0, 0.003)
            lon += rng.normal(0, 0.003)
            ts = t0 + timedelta(minutes=step * timestep_min)
            trajectory.append({"step": step, "lat": round(lat, 6), "lon": round(lon, 6),
                                 "timestamp": ts.isoformat(), "mode": "predicted"})

            hours_elapsed = step * timestep_min / 60
            for h in [6, 12, 24, 48]:
                if abs(hours_elapsed - h) < (timestep_min / 60 / 2):
                    if h not in horizon_summaries:
                        horizon_summaries[h] = []
                    horizon_summaries[h].append({"lat": lat, "lon": lon})

        particles_history.append({"particle_id": p_idx, "trajectory": trajectory})

    horizon_stats = {}
    for h, positions in horizon_summaries.items():
        lats_h = [p["lat"] for p in positions]
        lons_h = [p["lon"] for p in positions]
        c_lat = float(np.mean(lats_h))
        c_lon = float(np.mean(lons_h))
        std = float(np.sqrt(np.std(lats_h)**2 + np.std(lons_h)**2) * 111.32)
        horizon_stats[f"+{h}h"] = {
            "centroid_lat": round(c_lat, 6),
            "centroid_lon": round(c_lon, 6),
            "spread_km": round(std, 3),
            "particle_count": len(positions),
        }

    return {
        "particles": particles_history,
        "horizon_stats": horizon_stats,
        "windage_coefficient": windage_coefficient,
        "particle_count": particle_count,
        "timestep_min": timestep_min,
        "forecast_hours": forecast_hours,
        "integration_method": "RK4",
    }
""")

print("geometry + environmental + drift done")
