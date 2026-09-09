from pathlib import Path

def w(path, text):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')
    print(f'  wrote {path}')

w('backend/app/api/spills.py', '''import json, uuid
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.database.engine import get_connection, row_to_dict, parse_json, dump_json
from app.drift.particle_engine import run_hindcast, run_forecast
from app.config import settings

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

@router.post("/{spill_id}/hindcast")
def run_hindcast_endpoint(spill_id: str):
    conn = get_connection()
    try:
        spill_row = conn.execute("SELECT * FROM oil_spills WHERE id=?", (spill_id,)).fetchone()
        if not spill_row:
            raise HTTPException(404, "Spill not found")
        sp = row_to_dict(spill_row)
        polygon = parse_json(sp["spill_polygon_geojson"])
        coords = polygon["coordinates"][0] if polygon else []
        centroid = parse_json(sp["centroid_geojson"])
        c_lat = centroid["coordinates"][1] if centroid else 15.42
        c_lon = centroid["coordinates"][0] if centroid else 72.68
        env_row = conn.execute("SELECT field_data_json FROM environmental_fields WHERE spill_id=? AND field_type=?", (spill_id,"current")).fetchone()
        wind_row = conn.execute("SELECT field_data_json FROM environmental_fields WHERE spill_id=? AND field_type=?", (spill_id,"wind")).fetchone()
        if not env_row or not wind_row:
            raise HTTPException(422, "Environmental current/wind data unavailable for this spill.")
        current_data = parse_json(env_row["field_data_json"])
        current_data["field"] = "current"
        wind_data = parse_json(wind_row["field_data_json"])
        wind_data["field"] = "wind"
        t0 = datetime.fromisoformat(sp["satellite_acquisition_time"].replace("Z", "+00:00"))
        result = run_hindcast(c_lat, c_lon, coords, t0, current_data, wind_data,
            windage_coefficient=settings.default_windage_coefficient,
            particle_count=settings.default_particle_count,
            timestep_min=settings.default_integration_timestep_minutes,
            hindcast_hours=settings.default_hindcast_hours,
            seed=settings.oiltrace_demo_seed)
        now = datetime.now(timezone.utc).isoformat()
        run_id = f"HCAST-{spill_id}-{uuid.uuid4().hex[:8]}"
        conn.execute("""DELETE FROM particle_trajectories WHERE spill_id=? AND run_type=?""", (spill_id,"hindcast"))
        conn.execute("""INSERT INTO particle_trajectories
            (id,spill_id,run_type,windage_coefficient,particle_count,integration_timestep_min,
             integration_hours,integration_method,particles_json,origin_region_geojson,
             origin_centroid_geojson,origin_time_estimate,origin_time_uncertainty_h,
             spatial_uncertainty_km,environmental_source,data_mode,provenance,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (run_id,spill_id,"hindcast",result["windage_coefficient"],result["particle_count"],
             result["timestep_min"],result["hindcast_hours"],result["integration_method"],
             dump_json(result["particles"]),dump_json(result["origin_region_geojson"]),
             dump_json(result["origin_centroid_geojson"]),result["origin_time_estimate"],
             result["origin_time_uncertainty_h"],result["spatial_uncertainty_km"],
             "SYNTHETIC","simulation","synthetic",now))
        conn.commit()
        return {**result, "run_id": run_id, "spill_id": spill_id, "data_mode": "simulation", "provenance": "synthetic"}
    finally:
        conn.close()

@router.get("/{spill_id}/hindcast")
def get_hindcast(spill_id: str):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM particle_trajectories WHERE spill_id=? AND run_type=? ORDER BY created_at DESC LIMIT 1", (spill_id,"hindcast")).fetchone()
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
        spill_row = conn.execute("SELECT * FROM oil_spills WHERE id=?", (spill_id,)).fetchone()
        if not spill_row:
            raise HTTPException(404, "Spill not found")
        sp = row_to_dict(spill_row)
        polygon = parse_json(sp["spill_polygon_geojson"])
        coords = polygon["coordinates"][0] if polygon else []
        centroid = parse_json(sp["centroid_geojson"])
        c_lat = centroid["coordinates"][1] if centroid else 15.42
        c_lon = centroid["coordinates"][0] if centroid else 72.68
        env_row = conn.execute("SELECT field_data_json FROM environmental_fields WHERE spill_id=? AND field_type=?", (spill_id,"current")).fetchone()
        wind_row = conn.execute("SELECT field_data_json FROM environmental_fields WHERE spill_id=? AND field_type=?", (spill_id,"wind")).fetchone()
        if not env_row or not wind_row:
            raise HTTPException(422, "Environmental data unavailable")
        current_data = parse_json(env_row["field_data_json"])
        current_data["field"] = "current"
        wind_data = parse_json(wind_row["field_data_json"])
        wind_data["field"] = "wind"
        t0 = datetime.fromisoformat(sp["satellite_acquisition_time"].replace("Z", "+00:00"))
        result = run_forecast(c_lat, c_lon, coords, t0, current_data, wind_data,
            windage_coefficient=settings.default_windage_coefficient,
            particle_count=settings.default_particle_count,
            timestep_min=settings.default_integration_timestep_minutes,
            forecast_hours=settings.default_forecast_hours,
            seed=settings.oiltrace_demo_seed)
        now = datetime.now(timezone.utc).isoformat()
        run_id = f"FCAST-{spill_id}-{uuid.uuid4().hex[:8]}"
        conn.execute("DELETE FROM particle_trajectories WHERE spill_id=? AND run_type=?", (spill_id,"forecast"))
        conn.execute("""INSERT INTO particle_trajectories
            (id,spill_id,run_type,windage_coefficient,particle_count,integration_timestep_min,
             integration_hours,integration_method,particles_json,data_mode,provenance,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (run_id,spill_id,"forecast",result["windage_coefficient"],result["particle_count"],
             result["timestep_min"],result["forecast_hours"],result["integration_method"],
             dump_json(result["particles"]),"simulation","synthetic",now))
        conn.commit()
        return {**result, "run_id": run_id, "spill_id": spill_id, "data_mode": "simulation", "provenance": "synthetic",
                "horizon_stats": result.get("horizon_stats",{})}
    finally:
        conn.close()

@router.get("/{spill_id}/forecast")
def get_forecast(spill_id: str):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM particle_trajectories WHERE spill_id=? AND run_type=? ORDER BY created_at DESC LIMIT 1", (spill_id,"forecast")).fetchone()
        if not row:
            raise HTTPException(404, "No forecast found. Run POST /api/spills/{id}/forecast first.")
        d = row_to_dict(row)
        d["particles"] = parse_json(d["particles_json"])
        return d
    finally:
        conn.close()

@router.get("/{spill_id}/vessels")
def get_spill_vessels(spill_id: str):
    conn = get_connection()
    try:
        attrs = conn.execute("SELECT a.*, v.vessel_name, v.vessel_type, v.imo, v.flag, v.length_m, v.gross_tonnage FROM attributions a JOIN vessels v ON a.mmsi=v.mmsi WHERE a.spill_id=? ORDER BY a.rank", (spill_id,)).fetchall()
        if attrs:
            result = [row_to_dict(r) for r in attrs]
            for r in result:
                r["behaviour_observations"] = parse_json(r.get("behaviour_observations_json")) or []
            return result
        return []
    finally:
        conn.close()

@router.get("/{spill_id}/tracks")
def get_all_tracks(spill_id: str):
    conn = get_connection()
    try:
        rows = conn.execute("SELECT t.*, v.vessel_name, v.vessel_type FROM vessel_tracks t JOIN vessels v ON t.mmsi=v.mmsi WHERE t.spill_id=?", (spill_id,)).fetchall()
        result = []
        for r in rows:
            d = row_to_dict(r)
            d["track_geojson"] = parse_json(d["track_geojson"])
            result.append(d)
        return result
    finally:
        conn.close()

@router.get("/{spill_id}/timeline")
def get_timeline(spill_id: str):
    conn = get_connection()
    try:
        sp = conn.execute("SELECT * FROM oil_spills WHERE id=?", (spill_id,)).fetchone()
        if not sp:
            raise HTTPException(404, "Spill not found")
        sp_d = row_to_dict(sp)
        hcast = conn.execute("SELECT * FROM particle_trajectories WHERE spill_id=? AND run_type=? ORDER BY created_at DESC LIMIT 1", (spill_id,"hindcast")).fetchone()
        fcast = conn.execute("SELECT * FROM particle_trajectories WHERE spill_id=? AND run_type=? ORDER BY created_at DESC LIMIT 1", (spill_id,"forecast")).fetchone()
        tracks = conn.execute("SELECT t.*, v.vessel_name, v.vessel_type FROM vessel_tracks t JOIN vessels v ON t.mmsi=v.mmsi WHERE t.spill_id=?", (spill_id,)).fetchall()
        attrs = conn.execute("SELECT * FROM attributions WHERE spill_id=? ORDER BY rank LIMIT 3", (spill_id,)).fetchall()
        return {
            "spill": sp_d,
            "hindcast": row_to_dict(hcast) if hcast else None,
            "forecast": row_to_dict(fcast) if fcast else None,
            "tracks": [row_to_dict(t) for t in tracks],
            "top_candidates": [row_to_dict(a) for a in attrs],
            "data_mode": "simulation",
        }
    finally:
        conn.close()
''')

print('spills API done')
