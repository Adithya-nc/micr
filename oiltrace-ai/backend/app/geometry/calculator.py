import math
from typing import Dict, List, Tuple, Any


EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = EARTH_RADIUS_KM
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2)**2
    return 2 * r * math.asin(math.sqrt(a))


def polygon_area_km2(coords: List[List[float]]) -> float:
    pts = coords[:-1] if len(coords) > 3 and coords[0] == coords[-1] else coords
    n = len(pts)
    if n < 3:
        return 0.0
    ref_lat = math.radians(sum(p[1] for p in pts) / n)
    kx = math.cos(ref_lat) * EARTH_RADIUS_KM * (math.pi / 180.0)
    ky = EARTH_RADIUS_KM * (math.pi / 180.0)

    total = 0.0
    for i in range(n):
        j = (i + 1) % n
        xi = pts[i][0] * kx
        yi = pts[i][1] * ky
        xj = pts[j][0] * kx
        yj = pts[j][1] * ky
        total += xi * yj - xj * yi
    return round(abs(total) / 2.0, 4)


def polygon_perimeter_km(coords: List[List[float]]) -> float:
    n = len(coords)
    total = 0.0
    for i in range(n - 1):
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[i + 1]
        total += haversine_km(lat1, lon1, lat2, lon2)
    return total


def polygon_centroid(coords: List[List[float]]) -> Tuple[float, float]:
    pts = coords[:-1] if len(coords) > 3 and coords[0] == coords[-1] else coords
    lons = [c[0] for c in pts]
    lats = [c[1] for c in pts]
    return sum(lats) / len(lats), sum(lons) / len(lons)


def polygon_bounding_box(coords: List[List[float]]) -> Dict[str, float]:
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return {"min_lat": min(lats), "max_lat": max(lats), "min_lon": min(lons), "max_lon": max(lons)}


def polygon_compactness(area_km2: float, perimeter_km: float) -> float:
    if perimeter_km == 0:
        return 0.0
    return (4 * math.pi * area_km2) / (perimeter_km ** 2)


def characterize_polygon(geojson_polygon: Dict[str, Any]) -> Dict[str, Any]:
    coords = geojson_polygon["coordinates"][0]
    area = polygon_area_km2(coords)
    perim = polygon_perimeter_km(coords)
    centroid_lat, centroid_lon = polygon_centroid(coords)
    bb = polygon_bounding_box(coords)
    compactness = polygon_compactness(area, perim)
    length = haversine_km(bb["min_lat"], bb["min_lon"], bb["min_lat"], bb["max_lon"])
    width = haversine_km(bb["min_lat"], bb["min_lon"], bb["max_lat"], bb["min_lon"])
    if length < width:
        length, width = width, length
    dlat = bb["max_lat"] - bb["min_lat"]
    dlon = bb["max_lon"] - bb["min_lon"]
    orientation = math.degrees(math.atan2(dlon, dlat)) % 180
    return {
        "centroid_lat": round(centroid_lat, 6),
        "centroid_lon": round(centroid_lon, 6),
        "area_km2": round(area, 4),
        "perimeter_km": round(perim, 4),
        "length_km": round(length, 4),
        "width_km": round(width, 4),
        "orientation_deg": round(orientation, 2),
        "compactness": round(compactness, 6),
        "bounding_box": bb,
    }
