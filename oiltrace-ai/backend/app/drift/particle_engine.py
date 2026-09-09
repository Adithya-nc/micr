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
