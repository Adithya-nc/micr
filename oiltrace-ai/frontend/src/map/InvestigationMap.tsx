import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '../state/store';
import type { OilSpill, HindcastResult, ForecastResult, VesselTrack, Attribution } from '../types';

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: { type: 'raster' as const, tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '(c) OpenStreetMap contributors' }
  },
  layers: [
    { id: 'osm', type: 'raster' as const, source: 'osm', paint: { 'raster-opacity': 0.3, 'raster-brightness-min': 0, 'raster-brightness-max': 0.2, 'raster-saturation': -1, 'raster-contrast': 0.1 } }
  ]
};

interface InvestigationMapProps {
  spill?: OilSpill | null;
  hindcast?: HindcastResult | null;
  forecast?: ForecastResult | null;
  tracks?: VesselTrack[];
  attributions?: Attribution[];
  selectedMmsi?: string | null;
  timelineStep?: number;
  onVesselClick?: (mmsi: string) => void;
  onSpillClick?: () => void;
  children?: React.ReactNode;
}

export default function InvestigationMap({
  spill, hindcast, forecast, tracks, attributions, selectedMmsi, timelineStep, onVesselClick, onSpillClick, children
}: InvestigationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { layers } = useStore();
  const [coords, setCoords] = useState({ lat: 0, lon: 0 });

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [72.68, 15.42],
      zoom: 7.5,
      minZoom: 3,
      maxZoom: 16,
    });
    const m = map.current;
    m.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-left');
    m.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right');
    m.on('mousemove', (e) => setCoords({ lat: e.lngLat.lat, lon: e.lngLat.lng }));
    m.on('load', () => addDataLayers(m));
    return () => { m.remove(); map.current = null; };
  }, []);

  const addDataLayers = (m: maplibregl.Map) => {
    // Spill polygon source
    if (!m.getSource('spill-src')) {
      m.addSource('spill-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'spill-fill', type: 'fill', source: 'spill-src', paint: { 'fill-color': '#F59E0B', 'fill-opacity': 0.28 } });
      m.addLayer({ id: 'spill-line', type: 'line', source: 'spill-src', paint: { 'line-color': '#FFB020', 'line-width': 2 } });
    }
    // Origin region
    if (!m.getSource('origin-src')) {
      m.addSource('origin-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'origin-fill', type: 'fill', source: 'origin-src', paint: { 'fill-color': '#7C8FA6', 'fill-opacity': 0.22 } });
      m.addLayer({ id: 'origin-line', type: 'line', source: 'origin-src', paint: { 'line-color': '#8FA3B8', 'line-width': 1.5, 'line-dasharray': [3, 2] } });
    }
    // Hindcast particles
    if (!m.getSource('hindcast-src')) {
      m.addSource('hindcast-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'hindcast-pts', type: 'circle', source: 'hindcast-src', paint: { 'circle-radius': 2, 'circle-color': '#6F879C', 'circle-opacity': 0.5 } });
    }
    // Forecast particles
    if (!m.getSource('forecast-src')) {
      m.addSource('forecast-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'forecast-pts', type: 'circle', source: 'forecast-src', paint: { 'circle-radius': 2, 'circle-color': '#A8B7C5', 'circle-opacity': 0.5 } });
    }
    // Vessel tracks
    if (!m.getSource('tracks-src')) {
      m.addSource('tracks-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'tracks-line', type: 'line', source: 'tracks-src', paint: { 'line-color': ['get','color'], 'line-width': 1.5, 'line-opacity': 0.7 } });
    }
    // Vessel points
    if (!m.getSource('vessels-src')) {
      m.addSource('vessels-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'vessels-pts', type: 'circle', source: 'vessels-src',
        paint: { 'circle-radius': ['case',['get','isCandidate'],8,5], 'circle-color': ['get','color'],
                 'circle-stroke-width': ['case',['get','isSelected'],3,1], 'circle-stroke-color': '#E6EAEE', 'circle-opacity': 0.9 } });
      m.on('click', 'vessels-pts', (e) => {
        const f = e.features?.[0]; if (!f) return;
        const mmsi = f.properties?.mmsi; if (mmsi && onVesselClick) onVesselClick(mmsi);
      });
    }
    // Centroid marker
    if (!m.getSource('centroid-src')) {
      m.addSource('centroid-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'centroid-pt', type: 'circle', source: 'centroid-src', paint: { 'circle-radius': 6, 'circle-color': '#F97316', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } });
    }
  };

  // Update spill layer
  useEffect(() => {
    const m = map.current; if (!m || !m.isStyleLoaded()) return;
    const src = m.getSource('spill-src') as maplibregl.GeoJSONSource;
    if (!src) return;
    const features = [];
    if (spill?.spill_polygon_geojson && layers.slickGeometry) {
      features.push({ type: 'Feature', geometry: spill.spill_polygon_geojson, properties: { provenance: spill.provenance } });
    }
    src.setData({ type: 'FeatureCollection', features } as any);
    const centSrc = m.getSource('centroid-src') as maplibregl.GeoJSONSource;
    if (centSrc && spill?.centroid_geojson) {
      centSrc.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: spill.centroid_geojson, properties: {} }] } as any);
    }
  }, [spill, layers.slickGeometry]);

  // Update origin region
  useEffect(() => {
    const m = map.current; if (!m || !m.isStyleLoaded()) return;
    const src = m.getSource('origin-src') as maplibregl.GeoJSONSource;
    if (!src) return;
    const features = hindcast?.origin_region_geojson && layers.originRegion
      ? [{ type: 'Feature', geometry: hindcast.origin_region_geojson, properties: {} }] : [];
    src.setData({ type: 'FeatureCollection', features } as any);
  }, [hindcast, layers.originRegion]);

  // Update hindcast particles
  useEffect(() => {
    const m = map.current; if (!m || !m.isStyleLoaded()) return;
    const src = m.getSource('hindcast-src') as maplibregl.GeoJSONSource;
    if (!src || !hindcast?.particles || !layers.hindcast) { src?.setData({ type: 'FeatureCollection', features: [] } as any); return; }
    const step = timelineStep ?? -(hindcast.particles[0]?.trajectory?.length - 1);
    const features = hindcast.particles.slice(0, 100).map(p => {
      const pos = p.trajectory[p.trajectory.length - 1];
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [pos.lon, pos.lat] }, properties: { pid: p.particle_id } };
    });
    src.setData({ type: 'FeatureCollection', features } as any);
  }, [hindcast, layers.hindcast, timelineStep]);

  // Update forecast particles
  useEffect(() => {
    const m = map.current; if (!m || !m.isStyleLoaded()) return;
    const src = m.getSource('forecast-src') as maplibregl.GeoJSONSource;
    if (!src || !forecast?.particles || !layers.forecast) { src?.setData({ type: 'FeatureCollection', features: [] } as any); return; }
    const features = forecast.particles.slice(0, 100).map(p => {
      const idx = Math.min(Math.floor((timelineStep ?? 0.5) * p.trajectory.length), p.trajectory.length - 1);
      const pos = p.trajectory[Math.max(0, idx)];
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [pos.lon, pos.lat] }, properties: { pid: p.particle_id } };
    });
    src.setData({ type: 'FeatureCollection', features } as any);
  }, [forecast, layers.forecast, timelineStep]);

  // Update vessel tracks + points
  useEffect(() => {
    const m = map.current; if (!m || !m.isStyleLoaded()) return;
    const trackSrc = m.getSource('tracks-src') as maplibregl.GeoJSONSource;
    const vesselSrc = m.getSource('vessels-src') as maplibregl.GeoJSONSource;
    if (!trackSrc || !vesselSrc) return;
    const candidateMmsis = new Set(attributions?.slice(0,3).map(a=>a.mmsi)||[]);
    const trackFeatures: any[] = [];
    const vesselFeatures: any[] = [];
    (tracks||[]).forEach(t => {
      const isCandidate = candidateMmsis.has(t.mmsi);
      const isSelected = t.mmsi === selectedMmsi;
      const color = isSelected ? '#3FA7D6' : isCandidate ? '#D97706' : '#59636E';
      if (layers.vesselTracks && t.track_geojson) {
        trackFeatures.push({ type: 'Feature', geometry: t.track_geojson, properties: { mmsi: t.mmsi, color, isCandidate, isSelected } });
      }
      if (layers.aisVessels && t.track_geojson?.coordinates?.length) {
        const coords = t.track_geojson.coordinates;
        const midIdx = Math.floor(coords.length / 2);
        const midPt = coords[midIdx];
        vesselFeatures.push({ type: 'Feature', geometry: { type: 'Point', coordinates: midPt }, properties: { mmsi: t.mmsi, vessel_name: t.vessel_name || t.mmsi, color, isCandidate, isSelected } });
      }
    });
    trackSrc.setData({ type: 'FeatureCollection', features: trackFeatures } as any);
    vesselSrc.setData({ type: 'FeatureCollection', features: vesselFeatures } as any);
  }, [tracks, attributions, selectedMmsi, layers.vesselTracks, layers.aisVessels]);

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map-gl" />
      <div className="coord-display">Lat {coords.lat.toFixed(5)} &nbsp; Lon {coords.lon.toFixed(5)}</div>
      {children}
    </div>
  );
}
