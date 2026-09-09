from fastapi import APIRouter
from app.database.engine import get_connection, row_to_dict

router = APIRouter(prefix='/api/dashboard', tags=['dashboard'])

@router.get('/stats')
def get_stats():
    conn = get_connection()
    try:
        spills = conn.execute('SELECT * FROM oil_spills').fetchall()
        vc = conn.execute('SELECT COUNT(*) as c FROM vessels').fetchone()
        high = [s for s in spills if dict(s).get('severity') in ('high','critical')]
        return {
            'active_incidents': len(spills),
            'analyzed_scenes': len(spills),
            'analyzed_vessels': dict(vc)['c'] if vc else 0,
            'high_priority_cases': len(high),
            'incidents': [row_to_dict(s) for s in spills],
        }
    finally:
        conn.close()