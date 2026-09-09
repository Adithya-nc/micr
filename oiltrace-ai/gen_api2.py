import sys, os
from pathlib import Path

def w(path, lines):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text('\n'.join(lines), encoding='utf-8')
    print(f'  wrote {path}')

health_lines = [
    "from fastapi import APIRouter",
    "from datetime import datetime, timezone",
    "from app.database.engine import get_connection",
    "",
    "router = APIRouter(prefix='/api', tags=['health'])",
    "",
    "def check_db():",
    "    try:",
    "        conn = get_connection()",
    "        conn.execute('SELECT 1')",
    "        conn.close()",
    "        return 'online'",
    "    except Exception:",
    "        return 'unavailable'",
    "",
    "@router.get('/health')",
    "def health_check():",
    "    return {",
    "        'status': 'online',",
    "        'timestamp': datetime.now(timezone.utc).isoformat(),",
    "        'version': '1.0.0',",
    "        'services': {",
    "            'backend': 'online',",
    "            'database': check_db(),",
    "            'ml_model': 'precomputed_demo',",
    "            'environment_data': 'synthetic_available',",
    "            'ais_dataset': 'synthetic_available',",
    "            'report_engine': 'online',",
    "            'map_engine': 'online',",
    "        }",
    "    }",
]
w('backend/app/api/health.py', health_lines)

dash_lines = [
    "from fastapi import APIRouter",
    "from app.database.engine import get_connection, row_to_dict",
    "",
    "router = APIRouter(prefix='/api/dashboard', tags=['dashboard'])",
    "",
    "@router.get('/stats')",
    "def get_stats():",
    "    conn = get_connection()",
    "    try:",
    "        spills = conn.execute('SELECT * FROM oil_spills').fetchall()",
    "        vc = conn.execute('SELECT COUNT(*) as c FROM vessels').fetchone()",
    "        high = [s for s in spills if dict(s).get('severity') in ('high','critical')]",
    "        return {",
    "            'active_incidents': len(spills),",
    "            'analyzed_scenes': len(spills),",
    "            'analyzed_vessels': dict(vc)['c'] if vc else 0,",
    "            'high_priority_cases': len(high),",
    "            'incidents': [row_to_dict(s) for s in spills],",
    "        }",
    "    finally:",
    "        conn.close()",
]
w('backend/app/api/dashboard.py', dash_lines)

print('health + dashboard done')
