from pathlib import Path

def w(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.lstrip("\n"), encoding="utf-8")
    print(f"  wrote {path}")

# ── api/health.py ──────────────────────────────────────────────────────────
w("backend/app/api/health.py", """
from fastapi import APIRouter
from datetime import datetime, timezone
from app.database.engine import get_connection
import os

router = APIRouter(prefix="/api", tags=["health"])

def check_db():
    try:
        conn = get_connection()
        conn.execute("SELECT 1")
        conn.close()
        return "online"
    except Exception:
        return "unavailable"

@router.get("/health")
def health_check():
    db_status = check_db()
    return {
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "services": {
            "backend": "online",
            "database": db_status,
            "ml_model": "precomputed_demo",
            "environment_data": "synthetic_available",
            "ais_dataset": "synthetic_available",
            "report_engine": "online",
            "map_engine": "online",
        }
    }
""")

# ── api/dashboard.py ───────────────────────────────────────────────────────
w("backend/app/api/dashboard.py", """
from fastapi import APIRouter
from app.database.engine import get_connection, row_to_dict

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats():
    conn = get_connection()
    try:
        spills = conn.execute("SELECT * FROM oil_spills").fetchall()
        vessels = conn.execute("SELECT COUNT(*) as c FROM vessels").fetchone()
        attributions = conn.execute("SELECT COUNT(*) as c FROM attributions WHERE rank=1").fetchone()
        high_priority = [s for s in spills if dict(s).get("severity") in ("high","critical")]
        return {
            "active_incidents": len(spills),
            "analyzed_scenes": len(spills),
            "analyzed_vessels": dict(vessels)["c"] if vessels else 0,
            "high_priority_cases": len(high_priority),
            "incidents": [row_to_dict(s) for s in spills],
        }
    finally:
        conn.close()
""")

# ── api/spills.py ──────────────────────────────────────────────────────────
w("backend/app/api/spills.py", """
import json
from fastapi import APIRouter, HTTPException
from app.database.engine import get_connection, row_to_dict, parse_json, dump_json
from app.drift.particle_engine import run_hindcast, run_forecast
from app.ais.engine import (group_by_vessel, spatial_filter, temporal_filter,
                             trajectory_filter, extract_behaviour_features)
from app.attribution.scorer import score_vessel, rank_vessels
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/spills", tags=["spills"])

@router.get("/")
def list_spills():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM oil_spills ORDER BY created_at DESC").fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        conn.close()

@router.get("/{spill_id}")
def get_spill(spill_id: str):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM oil_spills WHERE id=?", (spill_id,)).fetchone()
        if not row:
            raise HTTPException(404, f"Spill {spill_id} not found")
        d = row_to_dict(row)
        for f in ["spill_polygon_geojson","centroid_geojson","bounding_box_geojson"]:
            d[f] = parse_json(d.get(f))
        return d
    finally:
        conn.close()

@router.get("/{spill_id}/image")
def get_spill_image(spill_id: str):
    conn = get_connection()
    try:
        spill = conn.execute("SELECT * FROM oil_spills WHERE id=?", (spill_id,)).fetchone()
        if not spill:
            raise HTTPException(404, "Spill not found")
        sp = row_to_dict(spill)
        img = conn.execute("SELECT * FROM satellite_images WHERE id=?", (sp["satellite_image_id"],)).fetchone()
        if not img:
            raise HTTPException(404, "Satellite image not found")
        d = row_to_dict(img)
        d["metadata_json"] = parse_json(d.get("metadata_json"))
        d["bounds_geojson"] = parse_json(d.get("bounds_geojson"))
        return d
    finally:
        conn.close()

@router.post("/{spill_id}/hindcast")
def run_hindcast_endpoint(spill_id: str):
    conn = get_connection()
    try:
        from app.config import settings
        spill_row = conn.execute("SELECT * FROM oil_spills WHERE id=?", (spill_id,)).fetchone()
        if not spill_row:
            raise HTTPException(404, "Spill not found")
        sp = row_to_dict(spill_row)
        polygon = parse_json(sp["spill_polygon_geojson"])
        coords = polygon["coordinates"][0] if polygon else []
        env_row = conn.execute("SELECT field_data_json FROM environmental_fields WHERE spill_id=? AND field_type='current'", (spill_id,)).fetchone()
        wind_row = conn.execute("SELECT field_data_json FROM environmental_fields WHERE spill_id=? AND field_type='wind'", (spill_id,)).fetchone()
        if not env_row or not wind_row:
            raise HTTPException(422, "Environmental data unavailable for this spill")
        current_data = parse_json(env_row["field_data_json"])
        current_data["field"] = "current"
        wind_data = parse_json(wind_row["field_data_json"])
        wind_data["field"] = "wind"
        t0_str = sp["satellite_acquisition_time"]
        t0 = datetime.fromisoformat(t0_str.replace("Z", "+00:00"))
        result = run_hindcast(
            sp["area_km2"] and sp["area_km2"] or 15.42,
            sp["area_km2"] and sp["area_km2"] or 72.68,
            coords,
            t0, current_data, wind_data,
            windage_coefficient=settings.default_windage_coefficient,
            particle_count=settings.default_particle_count,
            timestep_min=settings.default_integration_timestep_minutes,
            hindcast_hours=settings.default_hindcast_hours,
            seed=settings.oiltrace_demo_seed,
        )
        centroid = parse_json(sp["centroid_geojson"])
        if centroid:
            c_lon, c_lat = centroid["coordinates"]
            result2 = run_hindcast(c_lat, c_lon, coords, t0, current_data, wind_data,
                windage_coefficient=settings.default_windage_coefficient,
                particle_count=settings.default_particle_count,
                timestep_min=settings.default_integration_timestep_minutes,
                hindcast_hours=settings.default_hindcast_hours,
                seed=settings.oiltrace_demo_seed)
            result = result2
        now = datetime.now(timezone.utc).isoformat()
        run_id = f"HCAST-{spill_id}-{uuid.uuid4().hex[:8]}"
        conn.execute("""INSERT OR REPLACE INTO particle_trajectories
            (id,spill_id,run_type,windage_coefficient,particle_count,integration_timestep_min,
             integration_hours,integration_method,particles_json,origin_region_geojson,
             origin_centroid_geojson,origin_time_estimate,origin_time_uncertainty_h,
             spatial_uncertainty_km,environmental_source,data_mode,provenance,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (run_id, spill_id, "hindcast", result["windage_coefficient"], result["particle_count"],
             result["timestep_min"], result["hindcast_hours"], result["integration_method"],
             dump_json(result["particles"]), dump_json(result["origin_region_geojson"]),
             dump_json(result["origin_centroid_geojson"]), result["origin_time_estimate"],
             result["origin_time_uncertainty_h"], result["spatial_uncertainty_km"],
             "SYNTHETIC", "simulation", "synthetic", now))
        conn.commit()
        return {**result, "run_id": run_id, "spill_id": spill_id,
                "data_mode": "simulation", "provenance": "synthetic"}
    finally:
        conn.close()

@router.get("/{spill_id}/hindcast")
def get_hindcast(spill_id: str):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM particle_trajectories WHERE spill_id=? AND run_type='hindcast' ORDER BY created_at DESC LIMIT 1", (spill_id,)).fetchone()
        if not row:
            raise HTTPException(404, "No hindcast found. Run POST /api/spills/{id}/hindcast first.")
        d = row_to_dict(row)
        d["particles"] = parse_json(d["particles_json"])
        d["origin_region_geojson"] = parse_json(d["origin_region_geojson"])
        d["origin_centroid_geojson"] = parse_json(d["origin_centroid_geojson"])
        return d
    finally:
        conn.close()

@router.post("/{spill_id}/forecast")
def run_forecast_endpoint(spill_id: str):
    conn = get_connection()
    try:
        from app.config import settings
        spill_row = conn.execute("SELECT * FROM oil_spills WHERE id=?", (spill_id,)).fetchone()
        if not spill_row:
            raise HTTPException(404, "Spill not found")
        sp = row_to_dict(spill_row)
        polygon = parse_json(sp["spill_polygon_geojson"])
        coords = polygon["coordinates"][0] if polygon else []
        env_row = conn.execute("SELECT field_data_json FROM environmental_fields WHERE spill_id=? AND field_type='current'", (spill_id,)).fetchone()
        wind_row = conn.execute("SELECT field_data_json FROM environmental_fields WHERE spill_id=? AND field_type='wind'", (spill_id,)).fetchone()
        if not env_row or not wind_row:
            raise HTTPException(422, "Environmental data unavailable")
        current_data = parse_json(env_row["field_data_json"])
        current_data["field"] = "current"
        wind_data = parse_json(wind_row["field_data_json"])
        wind_data["field"] = "wind"
        t0 = datetime.fromisoformat(sp["satellite_acquisition_time"].replace("Z", "+00:00"))
        centroid = parse_json(sp["centroid_geojson"])
        c_lat = centroid["coordinates"][1] if centroid else 15.42
        c_lon = centroid["coordinates"][0] if centroid else 72.68
        result = run_forecast(c_lat, c_lon, coords, t0, current_data, wind_data,
            windage_coefficient=settings.default_windage_coefficient,
            particle_count=settings.default_particle_count,
            timestep_min=settings.default_integration_timestep_minutes,
            forecast_hours=settings.default_forecast_hours,
            seed=settings.oiltrace_demo_seed)
        now = datetime.now(timezone.utc).isoformat()
        run_id = f"FCAST-{spill_id}-{uuid.uuid4().hex[:8]}"
        conn.execute("""INSERT OR REPLACE INTO particle_trajectories
            (id,spill_id,run_type,windage_coefficient,particle_count,integration_timestep_min,
             integration_hours,integration_method,particles_json,data_mode,provenance,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (run_id, spill_id, "forecast", result["windage_coefficient"], result["particle_count"],
             result["timestep_min"], result["forecast_hours"], result["integration_method"],
             dump_json(result["particles"]), "simulation", "synthetic", now))
        conn.commit()
        return {**result, "run_id": run_id, "spill_id": spill_id,
                "data_mode": "simulation", "provenance": "synthetic"}
    finally:
        conn.close()

@router.get("/{spill_id}/forecast")
def get_forecast(spill_id: str):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM particle_trajectories WHERE spill_id=? AND run_type='forecast' ORDER BY created_at DESC LIMIT 1", (spill_id,)).fetchone()
        if not row:
            raise HTTPException(404, "No forecast found. Run POST /api/spills/{id}/forecast first.")
        d = row_to_dict(row)
        d["particles"] = parse_json(d["particles_json"])
        return d
    finally:
        conn.close()

@router.get("/{spill_id}/environment")
def get_environment(spill_id: str):
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM environmental_fields WHERE spill_id=?", (spill_id,)).fetchall()
        result = []
        for r in rows:
            d = row_to_dict(r)
            d["field_data"] = parse_json(d["field_data_json"])
            result.append(d)
        return result
    finally:
        conn.close()

@router.get("/{spill_id}/vessels")
def get_spill_vessels(spill_id: str):
    conn = get_connection()
    try:
        attrs = conn.execute("SELECT a.*, v.vessel_name, v.vessel_type, v.imo, v.flag, v.length_m, v.gross_tonnage FROM attributions a JOIN vessels v ON a.mmsi=v.mmsi WHERE a.spill_id=? ORDER BY a.rank", (spill_id,)).fetchall()
        if attrs:
            return [row_to_dict(r) for r in attrs]
        return {"message": "No attribution analysis found. Run POST /api/attribution/analyze.", "spill_id": spill_id}
    finally:
        conn.close()
""")

print("api/spills.py done")
