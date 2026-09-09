import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Command Center', icon: 'CC' },
  { to: '/incidents', label: 'Incidents', icon: 'IN' },
  { to: '/analyze', label: 'Analyze', icon: 'AN' },
  { to: '/incidents/SIH-2024-001/vessels', label: 'Vessel Investigation', icon: 'VI' },
  { to: '/incidents/SIH-2024-001/timeline', label: 'Digital Twin', icon: 'DT' },
  { to: '/incidents/SIH-2024-001/report', label: 'Reports', icon: 'RP' },
  { to: '/settings', label: 'Settings', icon: 'ST' },
];

export default function NavigationRail() {
  return (
    <nav className="nav-rail app-nav">
      <div className="nav-section-label">Navigation</div>
      {NAV_ITEMS.map(item => (
        <NavLink key={item.to} to={item.to} end={item.to==='/'}
          className={({isActive}) => 'nav-item' + (isActive ? ' nav-item--active' : '')}>
          <span style={{fontFamily:'var(--font-mono)',fontSize:'10px',fontWeight:600,color:'inherit',opacity:0.7,width:16,textAlign:'center',flexShrink:0}}>{item.icon}</span>
          <span className="nav-item__label">{item.label}</span>
        </NavLink>
      ))}
      <div className="nav-divider" style={{marginTop:'auto'}} />
      <div style={{padding:'8px 16px',fontSize:'10px',color:'var(--text-disabled)',fontFamily:'var(--font-mono)'}}>
        v1.0.0<br/>NTRO SIH26143
      </div>
    </nav>
  );
}
