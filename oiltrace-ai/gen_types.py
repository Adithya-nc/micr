from pathlib import Path

def w(path, text):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')
    print(f'  wrote {path}')

w('frontend/src/types/index.ts', """
export type DataMode = 'simulation' | 'real';
export type Provenance = 'observed' | 'reconstructed' | 'predicted' | 'synthetic';
export type SpillStatus = 'processing' | 'detected' | 'no_detection' | 'error';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ServiceStatus = 'online' | 'degraded' | 'unavailable';
export type RunType = 'hindcast' | 'forecast';

export interface GeoJSONPoint { type: 'Point'; coordinates: [number, number]; }
export interface GeoJSONPolygon { type: 'Polygon'; coordinates: [number, number][][]; }
export interface GeoJSONLineString { type: 'LineString'; coordinates: [number, number][]; }

export interface SatelliteImage {
  id: string;
  filename: string;
  file_size_bytes: number;
  format: string;
  crs: string;
  resolution_m: number;
  acquisition_time: string;
  region_name: string;
  bounds_geojson: GeoJSONPolygon;
  channels: number;
  width_px: number;
  height_px: number;
  satellite_name: string;
  data_mode: DataMode;
  provenance: Provenance;
  source: string;
  metadata_json?: Record<string, unknown>;
}

export interface OilSpill {
  id: string;
  satellite_image_id: string;
  incident_name: string;
  status: SpillStatus;
  detected_class: string;
  detection_confidence: number;
  spill_polygon_geojson: GeoJSONPolygon;
  centroid_geojson: GeoJSONPoint;
  bounding_box_geojson: GeoJSONPolygon;
  area_km2: number;
  perimeter_km: number;
  length_km: number;
  width_km: number;
  orientation_deg: number;
  compactness: number;
  detection_time: string;
  satellite_acquisition_time: string;
  data_mode: DataMode;
  provenance: Provenance;
  model_version: string;
  preprocessing_version: string;
  model_threshold: number;
  region_name: string;
  severity: Severity;
  created_at: string;
  updated_at: string;
}

export interface Vessel {
  mmsi: string;
  imo?: string;
  vessel_name: string;
  vessel_type: string;
  call_sign?: string;
  flag?: string;
  length_m?: number;
  beam_m?: number;
  draught_m?: number;
  gross_tonnage?: number;
  data_mode: DataMode;
  provenance: Provenance;
}

export interface AISObservation {
  id: string;
  mmsi: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  sog_knots?: number;
  cog_deg?: number;
  heading_deg?: number;
  nav_status?: string;
  data_mode: DataMode;
  provenance: Provenance;
}

export interface VesselTrack {
  id: string;
  mmsi: string;
  spill_id: string;
  track_geojson: GeoJSONLineString;
  start_time: string;
  end_time: string;
  point_count: number;
  vessel_name?: string;
  vessel_type?: string;
  data_mode: DataMode;
  provenance: Provenance;
  observations?: AISObservation[];
}

export interface EvidenceFactor {
  factor: string;
  label: string;
  raw_value: number;
  raw_unit: string;
  normalized: number;
  weight: number;
  contribution: number;
}

export interface Attribution {
  id?: string;
  mmsi: string;
  spill_id: string;
  rank: number;
  vessel_name?: string;
  vessel_type?: string;
  imo?: string;
  flag?: string;
  length_m?: number;
  gross_tonnage?: number;
  distance_km: number;
  time_delta_h: number;
  track_overlap_score: number;
  heading_compat_score: number;
  ais_continuity_score: number;
  evidence_score: number;
  data_confidence: number;
  final_score: number;
  factors?: EvidenceFactor[];
  behaviour_observations: string[];
  ais_gap_detected: boolean;
  ais_gap_duration_min?: number;
  slowdown_observed: boolean;
  course_change_observed: boolean;
  ais_coverage_pct: number;
  data_mode: DataMode;
  provenance: Provenance;
}

export interface ParticleState {
  step: number;
  lat: number;
  lon: number;
  timestamp: string;
  mode: Provenance;
}

export interface Particle {
  particle_id: number;
  trajectory: ParticleState[];
}

export interface HindcastResult {
  run_id: string;
  spill_id: string;
  run_type: 'hindcast';
  particles: Particle[];
  origin_lat: number;
  origin_lon: number;
  spatial_uncertainty_km: number;
  origin_time_estimate: string;
  origin_time_uncertainty_h: number;
  origin_region_geojson: GeoJSONPolygon;
  origin_centroid_geojson: GeoJSONPoint;
  windage_coefficient: number;
  particle_count: number;
  timestep_min: number;
  hindcast_hours: number;
  integration_hours?: number;
  integration_method: string;
  data_mode: DataMode;
  provenance: Provenance;
}

export interface HorizonStat {
  centroid_lat: number;
  centroid_lon: number;
  spread_km: number;
  particle_count: number;
}

export interface ForecastResult {
  run_id: string;
  spill_id: string;
  run_type: 'forecast';
  particles: Particle[];
  horizon_stats: Record<string, HorizonStat>;
  windage_coefficient: number;
  particle_count: number;
  timestep_min: number;
  forecast_hours: number;
  integration_hours?: number;
  integration_method: string;
  data_mode: DataMode;
  provenance: Provenance;
}

export interface EnvironmentalField {
  id: string;
  spill_id: string;
  field_type: 'current' | 'wind';
  timestamp: string;
  valid_time_start?: string;
  valid_time_end?: string;
  source: string;
  source_version?: string;
  resolution_deg?: number;
  field_data?: {
    points: Array<{lat: number; lon: number; current_u?: number; current_v?: number; wind_u?: number; wind_v?: number}>;
    note?: string;
  };
  data_mode: DataMode;
  provenance: Provenance;
}

export interface FilteringFunnel {
  total_ais_observations: number;
  spatial_filter: { input_count: number; output_count: number; removed_count: number; radius_km: number };
  temporal_filter: { input_count: number; output_count: number; removed_count: number; window_hours: number };
  trajectory_filter: { input_count: number; output_count: number; removed_count: number; oil_transport_direction_deg: number };
  behaviour_analysis_count: number;
  ranked_candidates: number;
  vessels: Attribution[];
  weights_used: Record<string, number>;
  data_mode: DataMode;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  version: string;
  services: Record<string, string>;
}

export interface DashboardStats {
  active_incidents: number;
  analyzed_scenes: number;
  analyzed_vessels: number;
  high_priority_cases: number;
  incidents: OilSpill[];
}

export interface LayerState {
  satellite: boolean;
  detectionMask: boolean;
  slickGeometry: boolean;
  originRegion: boolean;
  hindcast: boolean;
  forecast: boolean;
  currentVectors: boolean;
  windVectors: boolean;
  aisVessels: boolean;
  vesselTracks: boolean;
  candidateVessel: boolean;
  uncertainty: boolean;
}

export const DEFAULT_LAYERS: LayerState = {
  satellite: false,
  detectionMask: true,
  slickGeometry: true,
  originRegion: true,
  hindcast: true,
  forecast: true,
  currentVectors: false,
  windVectors: false,
  aisVessels: true,
  vesselTracks: true,
  candidateVessel: true,
  uncertainty: true,
};
""")

print('types/index.ts done')
