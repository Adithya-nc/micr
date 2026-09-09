from pathlib import Path

def w(path, text):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    print(f"wrote {path}")

store_ts = (
    "import { create } from 'zustand';\n\n"
    "const DEFAULT_LAYERS = {\n"
    "  satellite: false, detectionMask: true, slickGeometry: true, originRegion: true,\n"
    "  hindcast: true, forecast: true, currentVectors: false, windVectors: false,\n"
    "  aisVessels: true, vesselTracks: true, candidateVessel: true, uncertainty: true,\n"
    "};\n\n"
    "export type LayerKey = keyof typeof DEFAULT_LAYERS;\n\n"
    "interface AppState {\n"
    "  dataMode: string; setDataMode: (m: string) => void;\n"
    "  selectedSpillId: string | null; setSelectedSpillId: (id: string | null) => void;\n"
    "  selectedMmsi: string | null; setSelectedMmsi: (mmsi: string | null) => void;\n"
    "  layers: typeof DEFAULT_LAYERS; setLayer: (k: LayerKey, v: boolean) => void;\n"
    "  timelinePosition: number; setTimelinePosition: (p: number) => void;\n"
    "  timelinePlaying: boolean; setTimelinePlaying: (p: boolean) => void;\n"
    "  timelineSpeed: number; setTimelineSpeed: (s: number) => void;\n"
    "  analysisStep: number; setAnalysisStep: (s: number) => void;\n"
    "}\n\n"
    "export const useStore = create<AppState>((set) => ({\n"
    "  dataMode: 'simulation', setDataMode: (m) => set({ dataMode: m }),\n"
    "  selectedSpillId: null, setSelectedSpillId: (id) => set({ selectedSpillId: id }),\n"
    "  selectedMmsi: null, setSelectedMmsi: (mmsi) => set({ selectedMmsi: mmsi }),\n"
    "  layers: DEFAULT_LAYERS, setLayer: (k, v) => set(s => ({ layers: { ...s.layers, [k]: v } })),\n"
    "  timelinePosition: 0.5, setTimelinePosition: (p) => set({ timelinePosition: p }),\n"
    "  timelinePlaying: false, setTimelinePlaying: (p) => set({ timelinePlaying: p }),\n"
    "  timelineSpeed: 1, setTimelineSpeed: (s) => set({ timelineSpeed: s }),\n"
    "  analysisStep: 0, setAnalysisStep: (s) => set({ analysisStep: s }),\n"
    "}));\n"
)
w("frontend/src/state/store.ts", store_ts)
print("store done")
