import type { Trip } from '../types';
import type { ProvinceData, ProvinceFeature } from '../types';
import { TRIP_COLOR_HEX } from '../constants';

function ringContains(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function geometryContains(geom: ProvinceFeature['geometry'], lng: number, lat: number): boolean {
  // GeoJSON Polygon.coordinates = array of rings; MultiPolygon.coordinates = array of polygons.
  const polys: number[][][][] = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  return polys.some(poly => {
    const inExterior = ringContains(lng, lat, poly[0]);
    const inHole = poly.slice(1).some(hole => ringContains(lng, lat, hole));
    return inExterior && !inHole;
  });
}

export function findProvince(data: ProvinceData, lng: number, lat: number): ProvinceFeature | null {
  for (const f of data.features) {
    const adcode = f.properties.adcode;
    if (!adcode || adcode === '100000_JD') continue;
    if (geometryContains(f.geometry, lng, lat)) return f;
  }
  return null;
}

export function computeVisitedProvinces(data: ProvinceData, trips: Trip[]): {
  visitedMap: Map<string, string>; // adcode -> hex color (latest trip wins)
  visitedCount: number;
  totalCount: number;
} {
  const visitedMap = new Map<string, string>();
  const latestDate = new Map<string, string>();
  for (const trip of trips) {
    for (const loc of trip.locations) {
      const p = findProvince(data, loc.lng, loc.lat);
      if (!p) continue;
      const adcode = String(p.properties.adcode!);
      const prev = latestDate.get(adcode);
      if (!prev || trip.date > prev) {
        latestDate.set(adcode, trip.date);
        visitedMap.set(adcode, TRIP_COLOR_HEX[trip.color]);
      }
    }
  }
  const totalCount = data.features.filter(f => f.properties.adcode && f.properties.adcode !== '100000_JD').length;
  return { visitedMap, visitedCount: visitedMap.size, totalCount };
}
