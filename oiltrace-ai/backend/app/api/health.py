from fastapi import APIRouter
from datetime import datetime, timezone
from app.database.engine import get_connection

router = APIRouter(prefix='/api', tags=['health'])

def check_db():
    try:
        conn = get_connection()
        conn.execute('SELECT 1')
        conn.close()
        return 'online'
    except Exception:
        return 'unavailable'

@router.get('/health')
def health_check():
    return {
        'status': 'online',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'version': '1.0.0',
        'services': {
            'backend': 'online',
            'database': check_db(),
            'ml_model': 'precomputed_demo',
            'environment_data': 'synthetic_available',
            'ais_dataset': 'synthetic_available',
            'report_engine': 'online',
            'map_engine': 'online',
        }
    }