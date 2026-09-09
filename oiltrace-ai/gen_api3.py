import sys, os, json
from pathlib import Path

def w(path, text):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')
    print(f'  wrote {path}')

# ── backend/app/api/vessels.py ─────────────────────────────────────────────
w('backend/app/api/vessels.py', '''from fastapi import APIRouter, HTTPException
from app.database.engine import get_connection, row_to_dict, parse_json

router = APIRouter(prefix="/api/vessels", tags=["vessels"])

@router.get("/")
def list_vessels():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM vessels").fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        conn.close()

@router.get("/{mmsi}")
def get_vessel(mmsi: str):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM vessels WHERE mmsi=?", (mmsi,)).fetchone()
        if not row:
            raise HTTPException(404, f"Vessel {mmsi} not found")
        return row_to_dict(row)
    finally:
        conn.close()

@router.get("/{mmsi}/track")
def get_vessel_track(mmsi: str, spill_id: str = None):
    conn = get_connection()
    try:
        if spill_id:
            row = conn.execute("SELECT * FROM vessel_tracks WHERE mmsi=? AND spill_id=?", (mmsi, spill_id)).fetchone()
        else:
            row = conn.execute("SELECT * FROM vessel_tracks WHERE mmsi=? ORDER BY start_time DESC LIMIT 1", (mmsi,)).fetchone()
        if not row:
            return {"mmsi": mmsi, "track_geojson": None, "message": "No track found"}
        d = row_to_dict(row)
        d["track_geojson"] = parse_json(d["track_geojson"])
        obs = conn.execute("SELECT * FROM ais_observations WHERE mmsi=? ORDER BY timestamp", (mmsi,)).fetchall()
        d["observations"] = [row_to_dict(o) for o in obs]
        return d
    finally:
        conn.close()

@router.get("/{mmsi}/attribution/{spill_id}")
def get_vessel_attribution(mmsi: str, spill_id: str):
    conn = get_connection()
    try:
        row = conn.execute("SELECT a.*, v.vessel_name, v.vessel_type, v.imo, v.flag FROM attributions a JOIN vessels v ON a.mmsi=v.mmsi WHERE a.mmsi=? AND a.spill_id=?", (mmsi, spill_id)).fetchone()
        if not row:
            raise HTTPException(404, "Attribution not found")
        d = row_to_dict(row)
        d["behaviour_observations"] = parse_json(d.get("behaviour_observations_json")) or []
        return d
    finally:
        conn.close()
''')

# ── backend/app/api/attribution.py ────────────────────────────────────────
w('backend/app/api/attribution.py', '''from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.database.engine import get_connection, row_to_dict, parse_json, dump_json
from app.ais.engine import group_by_vessel, spatial_filter, temporal_filter, trajectory_filter, extract_behaviour_features
from app.attribution.scorer import score_vessel, rank_vessels
from app.config import settings
import uuid, json

router = APIRouter(prefix="/api/attribution", tags=["attribution"])

@router.post("/analyze")
def analyze_attribution(payload: dict):
    spill_id = payload.get("spill_id", "SIH-2024-001")
    conn = get_connection()
    try:
        spill = conn.execute("SELECT * FROM oil_spills WHERE id=?", (spill_id,)).fetchone()
        if not spill:
            raise HTTPException(404, "Spill not found")
        sp = row_to_dict(spill)
        centroid = parse_json(sp.get("centroid_geojson"))
        spill_lat = centroid["coordinates"][1] if centroid else 15.42
        spill_lon = centroid["coordinates"][0] if centroid else 72.68

        hindcast = conn.execute("SELECT * FROM particle_trajectories WHERE spill_id=? AND run_type=? ORDER BY created_at DESC LIMIT 1",
                                 (spill_id, "hindcast")).fetchone()
        if not hindcast:
            raise HTTPException(422, "Hindcast required before attribution. Run POST /api/spills/{id}/hindcast")

        hc = row_to_dict(hindcast)
        origin_lat = hc.get("origin_lat") or 15.21
        origin_lon = hc.get("origin_lon") or 72.41
        origin_centroid = parse_json(hc.get("origin_centroid_geojson"))
        if origin_centroid:
            origin_lon, origin_lat = origin_centroid["coordinates"]
        origin_time_str = hc.get("origin_time_estimate", "2024-03-14T12:00:00+00:00")

        env_current = conn.execute("SELECT field_data_json FROM environmental_fields WHERE spill_id=? AND field_type=?",
                                    (spill_id, "current")).fetchone()
        current_u, current_v = 0.18, 0.12
        wind_u, wind_v = 5.2, 3.8
        if env_current:
            fd = parse_json(env_current["field_data_json"])
            pts = fd.get("points", [])
            if pts:
                mid = pts[len(pts)//2]
                current_u = mid.get("current_u", 0.18)
                current_v = mid.get("current_v", 0.12)
                wind_u = mid.get("wind_u", 5.2)
                wind_v = mid.get("wind_v", 3.8)

        all_obs = conn.execute("SELECT * FROM ais_observations").fetchall()
        obs_list = [row_to_dict(o) for o in all_obs]
        total_obs = len(obs_list)

        spatial_passed, spatial_stats = spatial_filter(obs_list, origin_lat, origin_lon, settings.default_ais_radius_km)
        origin_time = datetime.fromisoformat(origin_time_str.replace("Z", "+00:00"))
        temporal_passed, temporal_stats = temporal_filter(spatial_passed, origin_time, settings.default_ais_temporal_window_hours)

        by_vessel = group_by_vessel(temporal_passed)
        all_by_vessel = group_by_vessel(obs_list)
        traj_passed, traj_stats = trajectory_filter(by_vessel, origin_lat, origin_lon, spill_lat, spill_lon, current_u, current_v, wind_u, wind_v)

        weights = settings.attribution_weights
        vessel_scores = []
        now = datetime.now(timezone.utc).isoformat()

        for mmsi, obs in traj_passed.items():
            all_obs_vessel = all_by_vessel.get(mmsi, obs)
            bf = extract_behaviour_features(all_obs_vessel, settings.default_track_gap_threshold_minutes)
            score = score_vessel(mmsi, obs, origin_lat, origin_lon, origin_time_str,
                                  spill_lat, spill_lon, current_u, current_v, wind_u, wind_v,
                                  alpha=settings.default_windage_coefficient,
                                  spatial_radius_km=settings.default_ais_radius_km,
                                  temporal_window_h=settings.default_ais_temporal_window_hours,
                                  weights=weights, behaviour_features=bf)
            score["mmsi"] = mmsi
            vessel_scores.append(score)

        for mmsi, obs in all_by_vessel.items():
            if mmsi not in traj_passed:
                all_obs_v = obs
                bf = extract_behaviour_features(all_obs_v, settings.default_track_gap_threshold_minutes)
                score = score_vessel(mmsi, all_obs_v, origin_lat, origin_lon, origin_time_str,
                                      spill_lat, spill_lon, current_u, current_v, wind_u, wind_v,
                                      alpha=settings.default_windage_coefficient,
                                      spatial_radius_km=settings.default_ais_radius_km,
                                      temporal_window_h=settings.default_ais_temporal_window_hours,
                                      weights=weights, behaviour_features=bf)
                score["mmsi"] = mmsi
                score["filtered_at"] = "trajectory"
                vessel_scores.append(score)

        ranked = rank_vessels(vessel_scores)
        conn.execute("DELETE FROM attributions WHERE spill_id=?", (spill_id,))
        for vs in ranked:
            attr_id = f"ATTR-{spill_id}-{vs['mmsi']}"
            conn.execute("""INSERT INTO attributions
                (id,spill_id,mmsi,rank,distance_km,time_delta_h,track_overlap_score,heading_compat_score,ais_continuity_score,
                 norm_proximity,norm_temporal,norm_trajectory,norm_heading,norm_continuity,
                 weight_proximity,weight_temporal,weight_trajectory,weight_heading,weight_continuity,
                 evidence_score,data_confidence,final_score,behaviour_observations_json,
                 ais_gap_detected,ais_gap_duration_min,slowdown_observed,course_change_observed,ais_coverage_pct,
                 spatial_radius_km,temporal_window_h,data_mode,provenance,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (attr_id, spill_id, vs["mmsi"], vs.get("rank"), vs.get("distance_km"), vs.get("time_delta_h"),
                 vs.get("track_overlap_score"), vs.get("heading_compat_score"), vs.get("ais_continuity_score"),
                 vs.get("norm_proximity"), vs.get("norm_temporal"), vs.get("norm_trajectory"),
                 vs.get("norm_heading"), vs.get("norm_continuity"),
                 weights.get("proximity"), weights.get("temporal"), weights.get("trajectory"),
                 weights.get("heading"), weights.get("continuity"),
                 vs.get("evidence_score"), vs.get("data_confidence"), vs.get("final_score"),
                 dump_json(vs.get("behaviour_observations", [])),
                 int(vs.get("ais_gap_detected", False)), vs.get("ais_gap_duration_min"),
                 int(vs.get("slowdown_observed", False)), int(vs.get("course_change_observed", False)),
                 vs.get("ais_coverage_pct"), settings.default_ais_radius_km, settings.default_ais_temporal_window_hours,
                 "simulation", "synthetic", now))
        conn.commit()

        return {
            "spill_id": spill_id,
            "total_ais_observations": total_obs,
            "spatial_filter": spatial_stats,
            "temporal_filter": temporal_stats,
            "trajectory_filter": traj_stats,
            "behaviour_analysis_count": len(traj_passed),
            "ranked_candidates": len(ranked),
            "vessels": ranked,
            "weights_used": weights,
            "data_mode": "simulation",
            "provenance": "synthetic",
        }
    finally:
        conn.close()

@router.get("/{spill_id}")
def get_attribution(spill_id: str):
    conn = get_connection()
    try:
        rows = conn.execute("SELECT a.*, v.vessel_name, v.vessel_type, v.imo, v.flag, v.length_m, v.gross_tonnage FROM attributions a JOIN vessels v ON a.mmsi=v.mmsi WHERE a.spill_id=? ORDER BY a.rank", (spill_id,)).fetchall()
        result = [row_to_dict(r) for r in rows]
        for r in result:
            r["behaviour_observations"] = parse_json(r.get("behaviour_observations_json")) or []
        return {"spill_id": spill_id, "vessels": result, "count": len(result)}
    finally:
        conn.close()
''')

print('vessels + attribution APIs done')
