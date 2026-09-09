import axios from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8001';
const api = axios.create({ baseURL: BASE_URL, timeout: 60000 });

export const fetchHealth = () => api.get('/api/health').then(r => r.data);
export const fetchDashboardStats = () => api.get('/api/dashboard/stats').then(r => r.data);
export const fetchSpills = () => api.get('/api/spills/').then(r => r.data);
export const fetchSpill = (id: string) => api.get('/api/spills/' + id).then(r => r.data);
export const fetchSpillImage = (id: string) => api.get('/api/spills/' + id + '/image').then(r => r.data);
export const fetchEnvironment = (spillId: string) => api.get('/api/spills/' + spillId + '/environment').then(r => r.data);
export const runHindcast = (spillId: string) => api.post('/api/spills/' + spillId + '/hindcast').then(r => r.data);
export const fetchHindcast = (spillId: string) => api.get('/api/spills/' + spillId + '/hindcast').then(r => r.data);
export const runForecast = (spillId: string) => api.post('/api/spills/' + spillId + '/forecast').then(r => r.data);
export const fetchForecast = (spillId: string) => api.get('/api/spills/' + spillId + '/forecast').then(r => r.data);
export const fetchSpillVessels = (spillId: string) => api.get('/api/spills/' + spillId + '/vessels').then(r => Array.isArray(r.data) ? r.data : []);
export const fetchAllTracks = (spillId: string) => api.get('/api/spills/' + spillId + '/tracks').then(r => r.data);
export const fetchVessel = (mmsi: string) => api.get('/api/vessels/' + mmsi).then(r => r.data);
export const fetchVesselTrack = (mmsi: string, spillId?: string) => api.get('/api/vessels/' + mmsi + '/track' + (spillId ? '?spill_id=' + spillId : '')).then(r => r.data);
export const fetchVesselAttribution = (mmsi: string, spillId: string) => api.get('/api/vessels/' + mmsi + '/attribution/' + spillId).then(r => r.data);
export const runAttribution = (spillId: string) => api.post('/api/attribution/analyze', { spill_id: spillId }).then(r => r.data);
export const fetchAttribution = (spillId: string) => api.get('/api/attribution/' + spillId).then(r => r.data);
export const generateReport = (spillId: string) => api.post('/api/reports/' + spillId + '/generate').then(r => r.data);
export const fetchReport = (spillId: string) => api.get('/api/reports/' + spillId).then(r => r.data);
export const getReportHtmlUrl = (spillId: string) => BASE_URL + '/api/reports/' + spillId + '/html';
export const getTimelineData = (spillId: string) => api.get('/api/spills/' + spillId + '/timeline').then(r => r.data);
export default api;
