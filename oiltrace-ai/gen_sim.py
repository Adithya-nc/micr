from pathlib import Path

def w(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.lstrip("\n"), encoding="utf-8")
    print(f"  wrote {path}")

w("backend/app/simulation/generator.py", """
import json, math, hashlib, uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from app.config import settings

INCIDENT_ID = "SIH-2024-001"
T0 = datetime(2024, 3, 15, 6, 0, 0, tzinfo=timezone.utc)
SPILL_LAT, SPILL_LON = 15.42, 72.68
ORIGIN_LAT, ORIGIN_LON = 15.21, 72.41
CURRENT_U, CURRENT_V = 0.18, 0.12
WIND_U10, WIND_V10 = 5.2, 3.8
CANDIDATE_MMSI = "419001234"

VESSEL_FLEET = [
    {"mmsi":"419001234","imo":"9432156","vessel_name":"MV ARCTURUS","vessel_type":"tanker","call_sign":"VARC","flag":"IN","length_m":243.0,"beam_m":42.0,"draught_m":11.2,"gross_tonnage":55200.0,"_candidate":True,"_initial_lat":15.12,"_initial_lon":72.28,"_final_lat":15.89,"_final_lon":73.10},
    {"mmsi":"419002345","imo":"9511234","vessel_name":"MV SAGAR SAMRAT","vessel_type":"cargo","call_sign":"VSSG","flag":"IN","length_m":189.0,"beam_m":28.0,"draught_m":9.4,"gross_tonnage":22000.0,"_candidate":False,"_initial_lat":15.80,"_initial_lon":72.90,"_final_lat":16.20,"_final_lon":73.40},
    {"mmsi":"419003456","imo":"9622345","vessel_name":"FV JALADHI","vessel_type":"fishing","call_sign":"VFJD","flag":"IN","length_m":42.0,"beam_m":8.5,"draught_m":3.1,"gross_tonnage":180.0,"_candidate":False,"_initial_lat":14.90,"_initial_lon":72.55,"_final_lat":15.30,"_final_lon":72.80},
    {"mmsi":"419004567","imo":"9733456","vessel_name":"MV KONKAN ROSE","vessel_type":"cargo","call_sign":"VKRS","flag":"IN","length_m":134.0,"beam_m":22.0,"draught_m":7.8,"gross_tonnage":8500.0,"_candidate":False,"_initial_lat":14.60,"_initial_lon":72.20,"_final_lat":15.10,"_final_lon":72.60},
    {"mmsi":"636015432","imo":"9844567","vessel_name":"MT GULF PHOENIX","vessel_type":"tanker","call_sign":"A8PX","flag":"LR","length_m":274.0,"beam_m":48.0,"draught_m":14.1,"gross_tonnage":81200.0,"_candidate":False,"_initial_lat":16.40,"_initial_lon":71.80,"_final_lat":17.20,"_final_lon":72.50},
    {"mmsi":"477009876","imo":"9955678","vessel_name":"CMA CGM PADMA","vessel_type":"cargo","call_sign":"VRPD","flag":"HK","length_m":299.0,"beam_m":48.2,"draught_m":14.0,"gross_tonnage":94200.0,"_candidate":False,"_initial_lat":14.20,"_initial_lon":71.60,"_final_lat":15.50,"_final_lon":73.80},
    {"mmsi":"419005678","imo":"9066789","vessel_name":"PSV SAMUDRA SEVA","vessel_type":"service","call_sign":"VSMS","flag":"IN","length_m":78.0,"beam_m":16.0,"draught_m":4.6,"gross_tonnage":2100.0,"_candidate":False,"_initial_lat":15.60,"_initial_lon":72.95,"_final_lat":15.90,"_final_lon":73.20},
]

def get_rng(seed=None):
    return np.random.default_rng(seed if seed is not None else settings.oiltrace_demo_seed)

def _spill_polygon(lat, lon, rng):
    n = 20
    angles = [i * 2 * math.pi / n for i in range(n)]
    coords = []
    for i, a in enumerate(angles):
        r_lat = 0.048 * rng.uniform(0.7, 1.3)
        r_lon = 0.062 * rng.uniform(0.7, 1.3)
        coords.append([round(lon + r_lon * math.cos(a), 6), round(lat + r_lat * math.sin(a), 6)])
    coords.append(coords[0])
    return {"type": "Polygon", "coordinates": [coords]}

def _ais_track(vessel, rng, candidate):
    obs = []
    start = T0 - timedelta(hours=20)
    n_steps = 144
    i_lat, i_lon = vessel["_initial_lat"], vessel["_initial_lon"]
    f_lat, f_lon = vessel["_final_lat"], vessel["_final_lon"]

    if candidate:
        waypoints = [(i_lat, i_lon, 0), (ORIGIN_LAT + rng.uniform(-0.05,0.05), ORIGIN_LON + rng.uniform(-0.04,0.04), 12), (f_lat, f_lon, n_steps-1)]
        gap_start, gap_end, slow_step = 10, 18, 7
    else:
        waypoints = [(i_lat, i_lon, 0), (f_lat, f_lon, n_steps-1)]
        gap_start = gap_end = slow_step = None

    def interp(t):
        for i in range(len(waypoints)-1):
            t0w, t1w = waypoints[i][2], waypoints[i+1][2]
            if t0w <= t <= t1w:
                fr = (t - t0w) / max(t1w - t0w, 1)
                return waypoints[i][0] + fr*(waypoints[i+1][0]-waypoints[i][0]), waypoints[i][1] + fr*(waypoints[i+1][1]-waypoints[i][1])
        return waypoints[-1][0], waypoints[-1][1]

    for step in range(n_steps):
        if candidate and gap_start is not None and gap_start <= step < gap_end:
            continue
        ts = start + timedelta(minutes=step * 10)
        lat, lon = interp(step)
        lat += rng.normal(0, 0.001)
        lon += rng.normal(0, 0.001)
        sog = 10.0
        if step > 0:
            pl, po = interp(step-1)
            d = math.sqrt(((lat-pl)*111.32)**2 + ((lon-po)*111.32*math.cos(math.radians(lat)))**2)
            sog = d / (10/60) * 0.539957
        if candidate and slow_step and abs(step - slow_step) < 3:
            sog *= rng.uniform(0.1, 0.3)
        nl, no = interp(min(step+1, n_steps-1))
        cog = math.degrees(math.atan2(no - lon, nl - lat)) % 360
        obs_id = hashlib.md5(f"{vessel['mmsi']}-{ts.isoformat()}".encode()).hexdigest()
        obs.append({"id": obs_id, "mmsi": vessel["mmsi"], "timestamp": ts.isoformat(),
                     "latitude": round(lat, 6), "longitude": round(lon, 6),
                     "sog_knots": round(max(0, sog), 2), "cog_deg": round(cog, 1),
                     "heading_deg": round(cog + rng.uniform(-5, 5), 1), "nav_status": "under_way_engine",
                     "data_mode": "simulation", "provenance": "synthetic", "source": "SYNTHETIC_AIS_GENERATOR_v1"})
    return obs

def _env_grid():
    rng = get_rng()
    lats = [14.5, 15.0, 15.5, 16.0, 16.5]
    lons = [71.5, 72.0, 72.5, 73.0, 73.5]
    points = []
    for la in lats:
        for lo in lons:
            points.append({"lat": la, "lon": lo,
                            "current_u": round(CURRENT_U + rng.normal(0, 0.05), 4),
                            "current_v": round(CURRENT_V + rng.normal(0, 0.05), 4),
                            "wind_u": round(WIND_U10 + rng.normal(0, 0.3), 4),
                            "wind_v": round(WIND_V10 + rng.normal(0, 0.3), 4)})
    return {"lats": lats, "lons": lons, "points": points, "crs": "EPSG:4326",
            "units": {"current": "m/s", "wind": "m/s"}}

def generate_demo_incident():
    rng = get_rng()
    now = datetime.now(timezone.utc)
    img_id = "SAR-SIH-2024-001"
    spill_poly = _spill_polygon(SPILL_LAT, SPILL_LON, rng)

    sat_image = {"id": img_id, "filename": "S1A_IW_GRDH_1SDV_20240315T060000_demo.tif",
                  "file_size_bytes": 287443968, "format": "GeoTIFF", "crs": "EPSG:4326",
                  "resolution_m": 10.0, "acquisition_time": T0.isoformat(),
                  "region_name": "Arabian Sea - Goa/Mumbai Coast",
                  "bounds_geojson": json.dumps({"type":"Polygon","coordinates":[[[71.0,14.0],[74.5,14.0],[74.5,17.5],[71.0,17.5],[71.0,14.0]]]}),
                  "channels": 2, "width_px": 25600, "height_px": 16384,
                  "satellite_name": "Sentinel-1A", "data_mode": "simulation", "provenance": "synthetic",
                  "source": "PRECOMPUTED_DEMO", "created_at": now.isoformat(),
                  "metadata_json": json.dumps({"orbit_direction":"descending","polarization":"VV+VH","incidence_angle_center_deg":38.2,"track":79,"demo_note":"Precomputed synthetic SAR scene - not from real satellite acquisition"})}

    spill = {"id": INCIDENT_ID, "satellite_image_id": img_id,
              "incident_name": "Arabian Sea Oil Spill - Goa Sector",
              "status": "detected", "detected_class": "suspected_oil", "detection_confidence": 0.847,
              "spill_polygon_geojson": json.dumps(spill_poly),
              "centroid_geojson": json.dumps({"type":"Point","coordinates":[SPILL_LON, SPILL_LAT]}),
              "bounding_box_geojson": json.dumps({"type":"Polygon","coordinates":[[[72.50,15.28],[73.00,15.28],[73.00,15.62],[72.50,15.62],[72.50,15.28]]]}),
              "area_km2": 8.43, "perimeter_km": 17.82, "length_km": 11.24, "width_km": 6.82,
              "orientation_deg": 127.4, "compactness": round(4*math.pi*8.43/(17.82**2), 4),
              "detection_time": now.isoformat(), "satellite_acquisition_time": T0.isoformat(),
              "data_mode": "simulation", "provenance": "synthetic", "model_version": "1.0.0-demo",
              "preprocessing_version": "1.2.0", "model_threshold": 0.42,
              "region_name": "Arabian Sea - Goa/Mumbai Coast", "severity": "high",
              "created_at": now.isoformat(), "updated_at": now.isoformat()}

    vessels = [{k: v[k] for k in v if not k.startswith("_")} for v in VESSEL_FLEET]
    for v in vessels:
        v.update({"data_mode": "simulation", "provenance": "synthetic", "created_at": now.isoformat()})

    all_ais = []
    for v in VESSEL_FLEET:
        all_ais.extend(_ais_track(v, rng, v.get("_candidate", False)))

    tracks = []
    for v in VESSEL_FLEET:
        mmsi = v["mmsi"]
        obs = sorted([o for o in all_ais if o["mmsi"] == mmsi], key=lambda x: x["timestamp"])
        if len(obs) >= 2:
            coords = [[o["longitude"], o["latitude"]] for o in obs]
            tracks.append({"id": f"TRACK-{mmsi}", "mmsi": mmsi, "spill_id": INCIDENT_ID,
                            "track_geojson": json.dumps({"type":"LineString","coordinates":coords}),
                            "start_time": obs[0]["timestamp"], "end_time": obs[-1]["timestamp"],
                            "point_count": len(coords), "data_mode": "simulation", "provenance": "synthetic"})

    env_data = _env_grid()
    env_fields = [
        {"id": f"ENV-CURRENT-{INCIDENT_ID}", "spill_id": INCIDENT_ID, "field_type": "current",
          "timestamp": T0.isoformat(), "valid_time_start": (T0-timedelta(hours=24)).isoformat(),
          "valid_time_end": (T0+timedelta(hours=24)).isoformat(), "source": "SYNTHETIC_OCEAN_CURRENT_v1",
          "source_version": "1.0", "resolution_deg": 0.083,
          "region_geojson": json.dumps({"type":"Polygon","coordinates":[[[71.0,14.0],[74.5,14.0],[74.5,17.5],[71.0,17.5],[71.0,14.0]]]}),
          "field_data_json": json.dumps({**env_data, "field":"current","note":"SYNTHETIC - not real data."}),
          "data_mode": "simulation", "provenance": "synthetic", "created_at": now.isoformat()},
        {"id": f"ENV-WIND-{INCIDENT_ID}", "spill_id": INCIDENT_ID, "field_type": "wind",
          "timestamp": T0.isoformat(), "valid_time_start": (T0-timedelta(hours=24)).isoformat(),
          "valid_time_end": (T0+timedelta(hours=24)).isoformat(), "source": "SYNTHETIC_ERA5_v1",
          "source_version": "1.0", "resolution_deg": 0.25,
          "region_geojson": json.dumps({"type":"Polygon","coordinates":[[[71.0,14.0],[74.5,14.0],[74.5,17.5],[71.0,17.5],[71.0,14.0]]]}),
          "field_data_json": json.dumps({**env_data, "field":"wind","note":"SYNTHETIC - not real data."}),
          "data_mode": "simulation", "provenance": "synthetic", "created_at": now.isoformat()},
    ]

    return {"incident_id": INCIDENT_ID, "satellite_image": sat_image, "spill": spill,
            "vessels": vessels, "ais_observations": all_ais, "vessel_tracks": tracks,
            "environmental_fields": env_fields, "env_data": env_data,
            "metadata": {"seed": settings.oiltrace_demo_seed, "data_mode": "simulation",
                          "spill_lat": SPILL_LAT, "spill_lon": SPILL_LON, "t0": T0.isoformat(),
                          "candidate_mmsi": CANDIDATE_MMSI}}
""")

print("simulation/generator.py done")
