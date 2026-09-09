from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database.engine import init_db, get_connection
from app.config import settings
from app.api import health, dashboard, vessels, attribution, reports
from app.api import spills as spills_router

def seed_demo_data():
    """Seed the demo incident if not already present."""
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM oil_spills WHERE id=?", ("SIH-2024-001",)).fetchone()
        if existing:
            print("[SEED] Demo data already present.")
            return
        from app.simulation.generator import generate_demo_incident
        demo = generate_demo_incident()
        # Insert satellite image
        img = demo["satellite_image"]
        conn.execute("""INSERT OR IGNORE INTO satellite_images
            (id,filename,file_size_bytes,format,crs,resolution_m,acquisition_time,
             region_name,bounds_geojson,channels,width_px,height_px,satellite_name,
             data_mode,provenance,source,created_at,metadata_json)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (img["id"],img["filename"],img["file_size_bytes"],img["format"],img["crs"],
             img["resolution_m"],img["acquisition_time"],img["region_name"],img["bounds_geojson"],
             img["channels"],img["width_px"],img["height_px"],img["satellite_name"],
             img["data_mode"],img["provenance"],img["source"],img["created_at"],img["metadata_json"]))
        # Insert spill
        sp = demo["spill"]
        conn.execute("""INSERT OR IGNORE INTO oil_spills
            (id,satellite_image_id,incident_name,status,detected_class,detection_confidence,
             spill_polygon_geojson,centroid_geojson,bounding_box_geojson,area_km2,perimeter_km,
             length_km,width_km,orientation_deg,compactness,detection_time,satellite_acquisition_time,
             data_mode,provenance,model_version,preprocessing_version,model_threshold,region_name,
             severity,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (sp["id"],sp["satellite_image_id"],sp["incident_name"],sp["status"],sp["detected_class"],
             sp["detection_confidence"],sp["spill_polygon_geojson"],sp["centroid_geojson"],
             sp["bounding_box_geojson"],sp["area_km2"],sp["perimeter_km"],sp["length_km"],
             sp["width_km"],sp["orientation_deg"],sp["compactness"],sp["detection_time"],
             sp["satellite_acquisition_time"],sp["data_mode"],sp["provenance"],sp["model_version"],
             sp["preprocessing_version"],sp["model_threshold"],sp["region_name"],sp["severity"],
             sp["created_at"],sp["updated_at"]))
        # Insert vessels
        for v in demo["vessels"]:
            conn.execute("""INSERT OR IGNORE INTO vessels
                (mmsi,imo,vessel_name,vessel_type,call_sign,flag,length_m,beam_m,draught_m,gross_tonnage,data_mode,provenance,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (v["mmsi"],v["imo"],v["vessel_name"],v["vessel_type"],v.get("call_sign"),v.get("flag"),
                 v.get("length_m"),v.get("beam_m"),v.get("draught_m"),v.get("gross_tonnage"),
                 v["data_mode"],v["provenance"],v["created_at"]))
        # Insert AIS observations
        for obs in demo["ais_observations"]:
            conn.execute("""INSERT OR IGNORE INTO ais_observations
                (id,mmsi,timestamp,latitude,longitude,sog_knots,cog_deg,heading_deg,nav_status,data_mode,provenance,source)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (obs["id"],obs["mmsi"],obs["timestamp"],obs["latitude"],obs["longitude"],
                 obs.get("sog_knots"),obs.get("cog_deg"),obs.get("heading_deg"),obs.get("nav_status"),
                 obs["data_mode"],obs["provenance"],obs.get("source")))
        # Insert tracks
        for t in demo["vessel_tracks"]:
            conn.execute("""INSERT OR IGNORE INTO vessel_tracks
                (id,mmsi,spill_id,track_geojson,start_time,end_time,point_count,data_mode,provenance)
                VALUES (?,?,?,?,?,?,?,?,?)""",
                (t["id"],t["mmsi"],t["spill_id"],t["track_geojson"],t["start_time"],t["end_time"],
                 t["point_count"],t["data_mode"],t["provenance"]))
        # Insert environmental fields
        for ef in demo["environmental_fields"]:
            conn.execute("""INSERT OR IGNORE INTO environmental_fields
                (id,spill_id,field_type,timestamp,valid_time_start,valid_time_end,source,source_version,
                 resolution_deg,region_geojson,field_data_json,data_mode,provenance,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (ef["id"],ef["spill_id"],ef["field_type"],ef["timestamp"],ef.get("valid_time_start"),
                 ef.get("valid_time_end"),ef["source"],ef.get("source_version"),ef.get("resolution_deg"),
                 ef.get("region_geojson"),ef["field_data_json"],ef["data_mode"],ef["provenance"],ef["created_at"]))
        conn.commit()
        print("[SEED] Demo data inserted successfully.")
    except Exception as e:
        print(f"[SEED ERROR] {e}")
        import traceback; traceback.print_exc()
    finally:
        conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_demo_data()
    yield

app = FastAPI(
    title="OILTRACE AI API",
    description="Satellite-Based Marine Oil Spill Detection, Drift Reconstruction & Vessel Attribution",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(dashboard.router)
app.include_router(spills_router.router)
app.include_router(vessels.router)
app.include_router(attribution.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {"product": "OILTRACE AI", "version": "1.0.0", "tagline": "From Satellite Observation to Maritime Evidence"}
