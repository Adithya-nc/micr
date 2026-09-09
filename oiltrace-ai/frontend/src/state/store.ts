import { create } from 'zustand';

const DEFAULT_LAYERS = {
  satellite: false, detectionMask: true, slickGeometry: true, originRegion: true,
  hindcast: true, forecast: true, currentVectors: false, windVectors: false,
  aisVessels: true, vesselTracks: true, candidateVessel: true, uncertainty: true,
};

export type LayerKey = keyof typeof DEFAULT_LAYERS;

interface AppState {
  dataMode: string; setDataMode: (m: string) => void;
  selectedSpillId: string | null; setSelectedSpillId: (id: string | null) => void;
  selectedMmsi: string | null; setSelectedMmsi: (mmsi: string | null) => void;
  layers: typeof DEFAULT_LAYERS; setLayer: (k: LayerKey, v: boolean) => void;
  timelinePosition: number; setTimelinePosition: (p: number) => void;
  timelinePlaying: boolean; setTimelinePlaying: (p: boolean) => void;
  timelineSpeed: number; setTimelineSpeed: (s: number) => void;
  analysisStep: number; setAnalysisStep: (s: number) => void;
}

export const useStore = create<AppState>((set) => ({
  dataMode: 'simulation', setDataMode: (m) => set({ dataMode: m }),
  selectedSpillId: null, setSelectedSpillId: (id) => set({ selectedSpillId: id }),
  selectedMmsi: null, setSelectedMmsi: (mmsi) => set({ selectedMmsi: mmsi }),
  layers: DEFAULT_LAYERS, setLayer: (k, v) => set(s => ({ layers: { ...s.layers, [k]: v } })),
  timelinePosition: 0.5, setTimelinePosition: (p) => set({ timelinePosition: p }),
  timelinePlaying: false, setTimelinePlaying: (p) => set({ timelinePlaying: p }),
  timelineSpeed: 1, setTimelineSpeed: (s) => set({ timelineSpeed: s }),
  analysisStep: 0, setAnalysisStep: (s) => set({ analysisStep: s }),
}));
