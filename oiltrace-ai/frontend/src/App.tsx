import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/TopBar';
import NavigationRail from './components/NavigationRail';
import CommandCenter from './pages/CommandCenter';
import DetectionPage from './pages/DetectionPage';
import DriftPage from './pages/DriftPage';
import ForecastPage from './pages/ForecastPage';
import VesselInvestigationPage from './pages/VesselInvestigationPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import ReportPage from './pages/ReportPage';
import AnalyzePage from './pages/AnalyzePage';
import { fetchHealth } from './services/api';

export default function App() {
  const [health, setHealth] = useState<any>(null);
  useEffect(() => {
    fetchHealth().then(h=>setHealth(h.services)).catch(()=>{});
  }, []);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <TopBar health={health} />
        <NavigationRail />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/incidents" element={<CommandCenter />} />
            <Route path="/incidents/:id" element={<DetectionPage />} />
            <Route path="/incidents/:id/detection" element={<DetectionPage />} />
            <Route path="/incidents/:id/drift" element={<DriftPage />} />
            <Route path="/incidents/:id/forecast" element={<ForecastPage />} />
            <Route path="/incidents/:id/vessels" element={<VesselInvestigationPage />} />
            <Route path="/incidents/:id/timeline" element={<DigitalTwinPage />} />
            <Route path="/incidents/:id/report" element={<ReportPage />} />
            <Route path="/settings" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
