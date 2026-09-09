import sqlite3
import json
from pathlib import Path
from typing import Any, Optional


def get_db_path() -> str:
    from app.config import settings
    url = settings.database_url
    if url.startswith("sqlite:///"):
        path = url[len("sqlite:///"):]
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        return path
    raise ValueError(f"Unsupported DB URL: {url}")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(get_db_path(), detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


SCHEMA_SQL = (
    "CREATE TABLE IF NOT EXISTS satellite_images ("
    " id TEXT PRIMARY KEY, filename TEXT, file_size_bytes INTEGER, format TEXT,"
    " crs TEXT, resolution_m REAL, acquisition_time TEXT NOT NULL,"
    " region_name TEXT, bounds_geojson TEXT, channels INTEGER,"
    " width_px INTEGER, height_px INTEGER, satellite_name TEXT DEFAULT 'Sentinel-1A',"
    " data_mode TEXT NOT NULL, provenance TEXT NOT NULL, source TEXT,"
    " created_at TEXT NOT NULL, metadata_json TEXT);"
    "CREATE TABLE IF NOT EXISTS oil_spills ("
    " id TEXT PRIMARY KEY, satellite_image_id TEXT REFERENCES satellite_images(id),"
    " incident_name TEXT, status TEXT NOT NULL, detected_class TEXT,"
    " detection_confidence REAL, spill_polygon_geojson TEXT, centroid_geojson TEXT,"
    " bounding_box_geojson TEXT, area_km2 REAL, perimeter_km REAL, length_km REAL,"
    " width_km REAL, orientation_deg REAL, compactness REAL, detection_time TEXT,"
    " satellite_acquisition_time TEXT, data_mode TEXT NOT NULL, provenance TEXT NOT NULL,"
    " model_version TEXT, preprocessing_version TEXT, model_threshold REAL,"
    " region_name TEXT, severity TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);"
    "CREATE TABLE IF NOT EXISTS vessels ("
    " mmsi TEXT PRIMARY KEY, imo TEXT, vessel_name TEXT, vessel_type TEXT,"
    " call_sign TEXT, flag TEXT, length_m REAL, beam_m REAL, draught_m REAL,"
    " gross_tonnage REAL, data_mode TEXT NOT NULL, provenance TEXT NOT NULL, created_at TEXT NOT NULL);"
    "CREATE TABLE IF NOT EXISTS ais_observations ("
    " id TEXT PRIMARY KEY, mmsi TEXT NOT NULL, timestamp TEXT NOT NULL,"
    " latitude REAL NOT NULL, longitude REAL NOT NULL, sog_knots REAL, cog_deg REAL,"
    " heading_deg REAL, nav_status TEXT, data_mode TEXT NOT NULL, provenance TEXT NOT NULL, source TEXT);"
    "CREATE TABLE IF NOT EXISTS vessel_tracks ("
    " id TEXT PRIMARY KEY, mmsi TEXT NOT NULL, spill_id TEXT REFERENCES oil_spills(id),"
    " track_geojson TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL,"
    " point_count INTEGER, data_mode TEXT NOT NULL, provenance TEXT NOT NULL);"
    "CREATE TABLE IF NOT EXISTS environmental_fields ("
    " id TEXT PRIMARY KEY, spill_id TEXT REFERENCES oil_spills(id),"
    " field_type TEXT NOT NULL, timestamp TEXT NOT NULL, valid_time_start TEXT, valid_time_end TEXT,"
    " source TEXT NOT NULL, source_version TEXT, resolution_deg REAL, region_geojson TEXT,"
    " field_data_json TEXT NOT NULL, data_mode TEXT NOT NULL, provenance TEXT NOT NULL, created_at TEXT NOT NULL);"
    "CREATE TABLE IF NOT EXISTS particle_trajectories ("
    " id TEXT PRIMARY KEY, spill_id TEXT REFERENCES oil_spills(id),"
    " run_type TEXT NOT NULL, windage_coefficient REAL NOT NULL, particle_count INTEGER NOT NULL,"
    " integration_timestep_min INTEGER NOT NULL, integration_hours REAL NOT NULL,"
    " integration_method TEXT NOT NULL, particles_json TEXT NOT NULL,"
    " origin_region_geojson TEXT, origin_centroid_geojson TEXT, origin_time_estimate TEXT,"
    " origin_time_uncertainty_h REAL, spatial_uncertainty_km REAL, environmental_source TEXT,"
    " data_mode TEXT NOT NULL, provenance TEXT NOT NULL, created_at TEXT NOT NULL);"
    "CREATE TABLE IF NOT EXISTS attributions ("
    " id TEXT PRIMARY KEY, spill_id TEXT NOT NULL REFERENCES oil_spills(id),"
    " mmsi TEXT NOT NULL REFERENCES vessels(mmsi), rank INTEGER,"
    " distance_km REAL, time_delta_h REAL, track_overlap_score REAL,"
    " heading_compat_score REAL, ais_continuity_score REAL,"
    " norm_proximity REAL, norm_temporal REAL, norm_trajectory REAL, norm_heading REAL, norm_continuity REAL,"
    " weight_proximity REAL, weight_temporal REAL, weight_trajectory REAL, weight_heading REAL, weight_continuity REAL,"
    " evidence_score REAL, data_confidence REAL, final_score REAL,"
    " behaviour_observations_json TEXT, ais_gap_detected INTEGER DEFAULT 0, ais_gap_duration_min REAL,"
    " slowdown_observed INTEGER DEFAULT 0, course_change_observed INTEGER DEFAULT 0,"
    " ais_coverage_pct REAL, spatial_radius_km REAL, temporal_window_h REAL,"
    " data_mode TEXT NOT NULL, provenance TEXT NOT NULL, created_at TEXT NOT NULL);"
    "CREATE TABLE IF NOT EXISTS investigation_reports ("
    " id TEXT PRIMARY KEY, spill_id TEXT NOT NULL REFERENCES oil_spills(id),"
    " report_version TEXT NOT NULL, status TEXT NOT NULL,"
    " report_html TEXT, report_pdf_path TEXT, sections_json TEXT,"
    " generated_at TEXT, created_at TEXT NOT NULL);"
    "CREATE TABLE IF NOT EXISTS analysis_runs ("
    " id TEXT PRIMARY KEY, spill_id TEXT REFERENCES oil_spills(id),"
    " run_type TEXT NOT NULL, status TEXT NOT NULL, data_mode TEXT NOT NULL,"
    " satellite_scene_id TEXT, satellite_source TEXT, capture_timestamp TEXT,"
    " model_version TEXT, preprocessing_version TEXT, model_threshold REAL,"
    " environment_source TEXT, environment_time_range_start TEXT, environment_time_range_end TEXT,"
    " windage_coefficient REAL, particle_count INTEGER, integration_timestep_min INTEGER,"
    " hindcast_hours REAL, forecast_hours REAL, ais_source TEXT, ais_coverage_pct REAL,"
    " scoring_config_json TEXT, error_message TEXT,"
    " started_at TEXT NOT NULL, completed_at TEXT, report_version TEXT DEFAULT '1.0');"
    "CREATE TABLE IF NOT EXISTS audit_log ("
    " id TEXT PRIMARY KEY, analysis_run_id TEXT REFERENCES analysis_runs(id),"
    " event_type TEXT NOT NULL, event_data_json TEXT, timestamp TEXT NOT NULL);"
    "CREATE INDEX IF NOT EXISTS idx_ais_mmsi ON ais_observations(mmsi, timestamp);"
    "CREATE INDEX IF NOT EXISTS idx_attr_spill ON attributions(spill_id);"
    "CREATE INDEX IF NOT EXISTS idx_particles_spill ON particle_trajectories(spill_id, run_type);"
)


def init_db():
    conn = get_connection()
    try:
        conn.executescript(SCHEMA_SQL)
        conn.commit()
        print(f"[DB] Initialized at {get_db_path()}")
    finally:
        conn.close()


def row_to_dict(row):
    return dict(row)


def parse_json(value):
    if value is None:
        return None
    try:
        return json.loads(value)
    except Exception:
        return value


def dump_json(value):
    if value is None:
        return None
    return json.dumps(value, default=str)
