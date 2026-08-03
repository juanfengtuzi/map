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

// 把自由文本日期规范化为可比较的数字（YYYY*10000 + MM*100 + DD），
// 避免 "2026-4" 与 "2026-10" 的字典序比较错误。
function dateKey(date: string): number {
  const m = date.match(/(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/);
  if (!m) return 0;
  const y = +m[1], mo = +m[2], d = m[3] ? +m[3] : 1;
  return y * 10000 + mo * 100 + d;
}

export function computeVisitedProvinces(data: ProvinceData, trips: Trip[]): {
  visitedMap: Map<string, string>; // adcode -> hex color (latest trip wins)
  visitedCount: number;
  totalCount: number;
} {
  const visitedMap = new Map<string, string>();
  const latestKey = new Map<string, number>();
  for (const trip of trips) {
    const tripKey = dateKey(trip.date);
    for (const loc of trip.locations) {
      const p = findProvince(data, loc.lng, loc.lat);
      if (!p) continue;
      const adcode = String(p.properties.adcode!);
      const prevKey = latestKey.get(adcode);
      if (prevKey === undefined || tripKey > prevKey) {
        latestKey.set(adcode, tripKey);
        // 颜色无效时不写 map，避免计数与渲染不一致
        const color = TRIP_COLOR_HEX[trip.color];
        if (color) visitedMap.set(adcode, color);
      }
    }
  }
  const totalCount = data.features.filter(f => f.properties.adcode && f.properties.adcode !== '100000_JD').length;
  return { visitedMap, visitedCount: visitedMap.size, totalCount };
}
