from pathlib import Path

def w(path, text):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    print(f"wrote {path}")

w("frontend/src/App.tsx", (
    "import React, { useEffect, useState } from 'react';\n"
    "import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';\n"
    "import TopBar from './components/TopBar';\n"
    "import NavigationRail from './components/NavigationRail';\n"
    "import CommandCenter from './pages/CommandCenter';\n"
    "import DetectionPage from './pages/DetectionPage';\n"
    "import DriftPage from './pages/DriftPage';\n"
    "import ForecastPage from './pages/ForecastPage';\n"
    "import VesselInvestigationPage from './pages/VesselInvestigationPage';\n"
    "import DigitalTwinPage from './pages/DigitalTwinPage';\n"
    "import ReportPage from './pages/ReportPage';\n"
    "import AnalyzePage from './pages/AnalyzePage';\n"
    "import { fetchHealth } from './services/api';\n\n"
    "export default function App() {\n"
    "  const [health, setHealth] = useState<any>(null);\n"
    "  useEffect(() => {\n"
    "    fetchHealth().then(h=>setHealth(h.services)).catch(()=>{});\n"
    "  }, []);\n\n"
    "  return (\n"
    "    <BrowserRouter>\n"
    "      <div className=\"app-shell\">\n"
    "        <TopBar health={health} />\n"
    "        <NavigationRail />\n"
    "        <main className=\"app-main\">\n"
    "          <Routes>\n"
    "            <Route path=\"/\" element={<CommandCenter />} />\n"
    "            <Route path=\"/analyze\" element={<AnalyzePage />} />\n"
    "            <Route path=\"/incidents\" element={<CommandCenter />} />\n"
    "            <Route path=\"/incidents/:id\" element={<DetectionPage />} />\n"
    "            <Route path=\"/incidents/:id/detection\" element={<DetectionPage />} />\n"
    "            <Route path=\"/incidents/:id/drift\" element={<DriftPage />} />\n"
    "            <Route path=\"/incidents/:id/forecast\" element={<ForecastPage />} />\n"
    "            <Route path=\"/incidents/:id/vessels\" element={<VesselInvestigationPage />} />\n"
    "            <Route path=\"/incidents/:id/timeline\" element={<DigitalTwinPage />} />\n"
    "            <Route path=\"/incidents/:id/report\" element={<ReportPage />} />\n"
    "            <Route path=\"/settings\" element={<Navigate to=\"/\" replace />} />\n"
    "            <Route path=\"*\" element={<Navigate to=\"/\" replace />} />\n"
    "          </Routes>\n"
    "        </main>\n"
    "      </div>\n"
    "    </BrowserRouter>\n"
    "  );\n"
    "}\n"
))

w("frontend/src/index.css", (
    "@import './styles/variables.css';\n"
    "@import './styles/reset.css';\n"
    "@import './styles/components.css';\n"
))

w("frontend/src/main.tsx", (
    "import React from 'react';\n"
    "import ReactDOM from 'react-dom/client';\n"
    "import App from './App';\n"
    "import './index.css';\n\n"
    "ReactDOM.createRoot(document.getElementById('root')!).render(\n"
    "  <React.StrictMode>\n"
    "    <App />\n"
    "  </React.StrictMode>\n"
    ");\n"
))

w("frontend/index.html", (
    "<!DOCTYPE html>\n"
    "<html lang=\"en\">\n"
    "<head>\n"
    "  <meta charset=\"UTF-8\" />\n"
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n"
    "  <meta name=\"description\" content=\"OILTRACE AI SIH26143 - Satellite-Based Marine Oil Spill Detection, Drift Reconstruction and Vessel Attribution\" />\n"
    "  <title>OILTRACE AI &mdash; SIH26143</title>\n"
    "</head>\n"
    "<body>\n"
    "  <div id=\"root\"></div>\n"
    "  <script type=\"module\" src=\"/src/main.tsx\"></script>\n"
    "</body>\n"
    "</html>\n"
))

w("frontend/.env", "VITE_API_URL=http://localhost:8000\n")

print("App.tsx + main.tsx + index.css + index.html done")
