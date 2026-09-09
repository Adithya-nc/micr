from pathlib import Path

def w(path, text):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')
    print(f'  wrote {path}')

# ── CSS Design System ──────────────────────────────────────────────────────
w('frontend/src/styles/variables.css', """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

:root {
  /* ── Base Surfaces ── */
  --bg-primary:      #0B0F14;
  --bg-secondary:    #10151B;
  --surface-1:       #151B22;
  --surface-2:       #19212A;
  --surface-3:       #1D2731;

  /* ── Borders ── */
  --border:          #232B34;
  --border-strong:   #34404C;

  /* ── Text ── */
  --text-primary:    #E6EAEE;
  --text-secondary:  #A7B0BA;
  --text-muted:      #7F8A96;
  --text-disabled:   #59636E;

  /* ── Accent ── */
  --accent:          #3FA7D6;
  --accent-hover:    #2E96C5;
  --accent-dim:      rgba(63,167,214,0.12);

  /* ── Oil Data ── */
  --oil:             #F59E0B;
  --oil-strong:      #F97316;
  --oil-fill:        rgba(245,158,11,0.28);
  --oil-outline:     #FFB020;

  /* ── Origin / Uncertainty ── */
  --origin:          #7C8FA6;
  --origin-fill:     rgba(124,143,166,0.22);
  --uncertainty:     #8FA3B8;

  /* ── Data Provenance ── */
  --reconstructed:   #6F879C;
  --predicted:       #A8B7C5;
  --synthetic:       #C8A45D;
  --observed:        #5F9E7A;

  /* ── Vessel Correlation ── */
  --corr-high:       #D97706;
  --corr-med-high:   #B8892D;
  --corr-med:        #7D8A96;
  --corr-low:        #59636E;

  /* ── Status ── */
  --status-success:  #5F9E7A;
  --status-warning:  #C9A24E;
  --status-error:    #C95C5C;
  --status-info:     #5E91B3;

  /* ── Mode Indicators ── */
  --mode-sim:        #C8A45D;
  --mode-real:       #5F9E7A;

  /* ── Typography ── */
  --font-sans:       'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:       'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace;

  /* ── Font Sizes ── */
  --text-xs:   11px;
  --text-sm:   12px;
  --text-base: 14px;
  --text-md:   15px;
  --text-lg:   17px;
  --text-xl:   20px;
  --text-2xl:  26px;

  /* ── Spacing (8px grid) ── */
  --sp-1: 8px;
  --sp-2: 16px;
  --sp-3: 24px;
  --sp-4: 32px;
  --sp-5: 40px;
  --sp-6: 48px;

  /* ── Radius ── */
  --radius-sm:  2px;
  --radius:     4px;
  --radius-md:  6px;

  /* ── Nav ── */
  --nav-width:     220px;
  --topbar-height: 56px;

  /* ── Transitions ── */
  --transition-fast:  150ms ease;
  --transition-base:  200ms ease;
  --transition-map:   350ms ease;
}
""")

w('frontend/src/styles/reset.css', """
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; overflow: hidden; }
body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--text-primary);
  background: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
}
button { font-family: inherit; cursor: pointer; border: none; outline: none; }
input, select, textarea { font-family: inherit; font-size: inherit; }
a { color: inherit; text-decoration: none; }
ul, ol { list-style: none; }
svg { display: block; }
""")

w('frontend/src/styles/components.css', """
/* ── Layout ── */
.app-shell {
  display: grid;
  grid-template-rows: var(--topbar-height) 1fr;
  grid-template-columns: var(--nav-width) 1fr;
  height: 100vh;
  overflow: hidden;
}
.app-topbar { grid-column: 1/-1; }
.app-nav    { grid-row: 2; overflow-y: auto; }
.app-main   { grid-row: 2; overflow: hidden; display: flex; flex-direction: column; }

/* ── Top Bar ── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--topbar-height);
  padding: 0 var(--sp-2);
  background: var(--surface-1);
  border-bottom: 1px solid var(--border);
  z-index: 100;
}
.topbar-brand { display: flex; align-items: center; gap: var(--sp-1); }
.topbar-brand-name { font-size: 15px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.02em; }
.topbar-brand-id   { font-size: var(--text-xs); font-family: var(--font-mono); color: var(--text-muted); }
.topbar-brand-desc { font-size: var(--text-xs); color: var(--text-disabled); }
.topbar-incident   { font-size: var(--text-sm); color: var(--text-secondary); font-family: var(--font-mono); }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.topbar-time  { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); }

/* ── Mode Badge ── */
.mode-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 3px 8px; border-radius: var(--radius-sm);
  font-size: var(--text-xs); font-weight: 600; font-family: var(--font-mono);
  letter-spacing: 0.05em; border: 1px solid;
}
.mode-badge--sim  { color: var(--mode-sim);  background: rgba(200,164,93,0.08);  border-color: rgba(200,164,93,0.4);  }
.mode-badge--real { color: var(--mode-real); background: rgba(95,158,122,0.08); border-color: rgba(95,158,122,0.4); }
.mode-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* ── Navigation Rail ── */
.nav-rail {
  background: var(--surface-1);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  padding: var(--sp-1) 0;
  overflow-y: auto;
}
.nav-section-label {
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-disabled); padding: 12px var(--sp-2) 4px;
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px var(--sp-2); font-size: var(--text-sm);
  color: var(--text-secondary); transition: background var(--transition-fast), color var(--transition-fast);
  cursor: pointer; border-left: 2px solid transparent;
}
.nav-item:hover { background: var(--surface-2); color: var(--text-primary); }
.nav-item--active { color: var(--accent); background: var(--accent-dim); border-left-color: var(--accent); }
.nav-item__icon  { width: 16px; height: 16px; opacity: 0.7; flex-shrink: 0; }
.nav-item--active .nav-item__icon { opacity: 1; }
.nav-item__badge {
  margin-left: auto; font-size: 10px; font-family: var(--font-mono);
  background: var(--surface-3); color: var(--text-muted); padding: 1px 5px; border-radius: 2px;
}
.nav-divider { height: 1px; background: var(--border); margin: var(--sp-1) 0; }

/* ── KPI Strip ── */
.kpi-strip { display: flex; gap: 1px; background: var(--border); border-bottom: 1px solid var(--border); flex-shrink: 0; }
.kpi-card {
  flex: 1; padding: 10px var(--sp-2); background: var(--surface-1);
  display: flex; flex-direction: column; gap: 2px;
}
.kpi-card__value  { font-size: 22px; font-weight: 600; font-family: var(--font-mono); color: var(--text-primary); line-height: 1.2; }
.kpi-card__label  { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.kpi-card__source { font-size: 10px; color: var(--text-disabled); font-family: var(--font-mono); }

/* ── Buttons ── */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: 500;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}
.btn-primary {
  background: var(--accent); color: var(--bg-primary); border: 1px solid var(--accent);
}
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
.btn-secondary {
  background: var(--surface-3); color: var(--text-secondary); border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--surface-2); color: var(--text-primary); border-color: var(--border-strong); }
.btn-ghost {
  background: transparent; color: var(--text-secondary); border: 1px solid var(--border);
}
.btn-ghost:hover { background: var(--surface-2); color: var(--text-primary); }
.btn-sm { padding: 4px 10px; font-size: var(--text-xs); }
.btn-icon { padding: 6px; min-width: 30px; justify-content: center; }

/* ── Panels ── */
.panel { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--radius-md); }
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px var(--sp-2); border-bottom: 1px solid var(--border);
}
.panel-title { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
.panel-body { padding: var(--sp-2); }

/* ── Tables ── */
.data-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
.data-table th {
  text-align: left; padding: 6px 8px; background: var(--bg-secondary);
  color: var(--text-muted); font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  border-bottom: 1px solid var(--border); white-space: nowrap;
}
.data-table td { padding: 6px 8px; border-bottom: 1px solid var(--border); color: var(--text-primary); }
.data-table td.mono { font-family: var(--font-mono); font-size: var(--text-xs); }
.data-table tr:hover td { background: var(--surface-2); cursor: pointer; }
.data-table tr.selected td { background: var(--accent-dim); border-left: 2px solid var(--accent); }

/* ── Provenance Tags ── */
.tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 1px 6px; border-radius: var(--radius-sm);
  font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
  font-family: var(--font-mono); flex-shrink: 0;
}
.tag-observed     { color: var(--observed);     background: rgba(95,158,122,0.12);  border: 1px solid rgba(95,158,122,0.3);  }
.tag-reconstructed{ color: var(--reconstructed); background: rgba(111,135,156,0.12); border: 1px solid rgba(111,135,156,0.3); }
.tag-predicted    { color: var(--predicted);     background: rgba(168,183,197,0.10); border: 1px solid rgba(168,183,197,0.3); }
.tag-synthetic    { color: var(--synthetic);     background: rgba(200,164,93,0.12);  border: 1px solid rgba(200,164,93,0.4);  }

/* ── Processing Pipeline ── */
.pipeline { display: flex; flex-direction: column; gap: 4px; }
.pipeline-stage { display: flex; align-items: center; gap: 8px; font-size: var(--text-sm); }
.pipeline-stage__icon { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; }
.pipeline-stage--complete .pipeline-stage__icon { background: var(--status-success); color: var(--bg-primary); }
.pipeline-stage--processing .pipeline-stage__icon { background: var(--accent); color: var(--bg-primary); }
.pipeline-stage--waiting .pipeline-stage__icon { background: var(--surface-3); color: var(--text-disabled); }
.pipeline-stage--error .pipeline-stage__icon { background: var(--status-error); color: var(--bg-primary); }
.pipeline-stage__label { flex: 1; color: var(--text-secondary); }
.pipeline-stage--complete .pipeline-stage__label { color: var(--text-primary); }
.pipeline-stage--processing .pipeline-stage__label { color: var(--accent); }
.pipeline-stage--error .pipeline-stage__label { color: var(--status-error); }

/* ── Map Container ── */
.map-container { position: relative; flex: 1; overflow: hidden; }
.map-gl { width: 100%; height: 100%; }

/* ── Layer Control ── */
.layer-control {
  position: absolute; top: var(--sp-2); right: var(--sp-2);
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--radius-md); padding: var(--sp-1); z-index: 10;
  min-width: 180px;
}
.layer-toggle {
  display: flex; align-items: center; gap: 8px; padding: 5px 6px;
  font-size: var(--text-xs); color: var(--text-secondary); cursor: pointer;
  border-radius: var(--radius-sm); transition: background var(--transition-fast);
}
.layer-toggle:hover { background: var(--surface-2); color: var(--text-primary); }
.layer-toggle input { accent-color: var(--accent); cursor: pointer; }
.layer-toggle-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }

/* ── Filtering Funnel ── */
.funnel { display: flex; flex-direction: column; gap: 2px; }
.funnel-stage {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 8px 10px;
  display: flex; align-items: center; justify-content: space-between;
}
.funnel-stage__label { font-size: var(--text-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
.funnel-stage__count { font-family: var(--font-mono); font-size: var(--text-md); font-weight: 600; color: var(--text-primary); }
.funnel-stage__removed { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); }
.funnel-arrow { text-align: center; color: var(--border-strong); font-size: 12px; padding: 2px 0; }
.funnel-stage--active { border-color: var(--accent); background: var(--accent-dim); }

/* ── Evidence Bar ── */
.evidence-bar { margin-bottom: 10px; }
.evidence-bar__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.evidence-bar__label  { font-size: var(--text-xs); color: var(--text-secondary); }
.evidence-bar__values { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); }
.evidence-bar__track  { height: 6px; background: var(--surface-3); border-radius: 2px; overflow: hidden; }
.evidence-bar__fill   { height: 100%; border-radius: 2px; background: var(--accent); transition: width var(--transition-map); }
.evidence-bar__contribution { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--accent); margin-top: 2px; }

/* ── Timeline ── */
.timeline-bar {
  background: var(--surface-1); border-top: 1px solid var(--border);
  padding: 8px var(--sp-2); display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;
  height: 110px;
}
.timeline-controls { display: flex; align-items: center; gap: 8px; }
.timeline-scrubber { flex: 1; accent-color: var(--accent); height: 3px; cursor: pointer; }
.timeline-markers { display: flex; justify-content: space-between; font-size: 10px; font-family: var(--font-mono); color: var(--text-disabled); }
.timeline-current-time { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary); }

/* ── Data Attribution ── */
.data-source-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid var(--border); }
.data-source-label { font-size: var(--text-xs); color: var(--text-muted); width: 120px; flex-shrink: 0; }
.data-source-value { font-size: var(--text-xs); font-family: var(--font-mono); color: var(--text-primary); }

/* ── Alerts ── */
.alert {
  display: flex; gap: 8px; padding: 10px 12px;
  border-radius: var(--radius); font-size: var(--text-sm); border: 1px solid;
}
.alert-warning { background: rgba(201,162,78,0.08); border-color: rgba(201,162,78,0.3); color: #C9A24E; }
.alert-info    { background: rgba(94,145,179,0.08); border-color: rgba(94,145,179,0.3); color: var(--status-info); }
.alert-error   { background: rgba(201,92,92,0.08);  border-color: rgba(201,92,92,0.3);  color: var(--status-error); }

/* ── Score Indicator ── */
.score-ring {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.score-value { font-family: var(--font-mono); font-size: 28px; font-weight: 600; line-height: 1; }
.score-label { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

/* ── Status States ── */
.state-container {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--sp-1); padding: var(--sp-3); text-align: center; flex: 1;
}
.state-icon  { font-size: 24px; color: var(--text-muted); margin-bottom: 4px; }
.state-title { font-size: var(--text-lg); color: var(--text-secondary); font-weight: 600; }
.state-desc  { font-size: var(--text-sm); color: var(--text-muted); max-width: 320px; }

/* ── Coordinate Display ── */
.coord-display {
  position: absolute; bottom: var(--sp-1); left: 50%; transform: translateX(-50%);
  font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted);
  background: rgba(11,15,20,0.8); padding: 3px 8px; border-radius: var(--radius-sm);
  pointer-events: none; z-index: 5;
}

/* ── Map Legend ── */
.map-legend {
  position: absolute; bottom: 28px; left: var(--sp-2);
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--radius-md); padding: 10px var(--sp-2); z-index: 10; min-width: 160px;
}
.map-legend__title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 8px; }
.map-legend__item  { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; }
.map-legend__swatch { width: 20px; height: 3px; flex-shrink: 0; }
.map-legend__swatch--dashed { background: repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 8px); }

/* ── Utility ── */
.mono { font-family: var(--font-mono); }
.text-muted { color: var(--text-muted); }
.text-sm { font-size: var(--text-sm); }
.text-xs { font-size: var(--text-xs); }
.flex { display: flex; }
.flex-col { display: flex; flex-direction: column; }
.items-center { align-items: center; }
.gap-1 { gap: var(--sp-1); }
.gap-2 { gap: var(--sp-2); }
.flex-1 { flex: 1; }
.overflow-auto { overflow: auto; }
.overflow-hidden { overflow: hidden; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.border-b { border-bottom: 1px solid var(--border); }
.border-t { border-top: 1px solid var(--border); }
.p-2 { padding: var(--sp-2); }
.p-1 { padding: var(--sp-1); }
.px-2 { padding-left: var(--sp-2); padding-right: var(--sp-2); }
.py-1 { padding-top: var(--sp-1); padding-bottom: var(--sp-1); }
.mt-1 { margin-top: var(--sp-1); }
.mt-2 { margin-top: var(--sp-2); }
.mb-1 { margin-bottom: var(--sp-1); }
.mb-2 { margin-bottom: var(--sp-2); }

/* ── Scroll ── */
.scroll-y { overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; }
.scroll-y::-webkit-scrollbar { width: 4px; }
.scroll-y::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }

/* ── Loading Spinner ── */
@keyframes spin { to { transform: rotate(360deg); } }
.spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }

/* ── Separator ── */
.separator { height: 1px; background: var(--border); margin: var(--sp-1) 0; }

/* ── Section heading ── */
.section-heading { font-size: var(--text-lg); font-weight: 600; color: var(--text-primary); }
.section-subheading { font-size: var(--text-sm); color: var(--text-muted); }

/* ── Investigation Layout ── */
.investigation-layout {
  display: grid;
  grid-template-columns: 260px 1fr 360px;
  grid-template-rows: 1fr;
  height: 100%;
  overflow: hidden;
  gap: 0;
}
.investigation-left   { overflow-y: auto; border-right: 1px solid var(--border); background: var(--bg-secondary); }
.investigation-center { position: relative; overflow: hidden; display: flex; flex-direction: column; }
.investigation-right  { overflow-y: auto; border-left: 1px solid var(--border); background: var(--bg-secondary); }

@media (max-width: 1280px) {
  :root { --nav-width: 48px; }
  .nav-item__label { display: none; }
  .nav-section-label { display: none; }
  .nav-item { justify-content: center; padding: 8px; }
  .investigation-layout { grid-template-columns: 1fr; }
  .investigation-left, .investigation-right { display: none; }
}
""")

print('CSS design system done')
