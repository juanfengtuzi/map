import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ProvinceData } from '../types';

interface ProvinceLayerProps {
  data: ProvinceData;
  visitedMap: Map<string, string>;
}

function provinceStyle(feature: { properties?: { adcode?: string } } | undefined, visitedMap: Map<string, string>): L.PathOptions {
  const color = visitedMap.get(String(feature?.properties?.adcode));
  if (color) {
    return { color, weight: 1.6, fillColor: color, fillOpacity: 0.35, opacity: 0.85 };
  }
  return { color: '#c4b89e', weight: 0.8, fillColor: '#c4b89e', fillOpacity: 0.05, opacity: 0.55 };
}

export default function ProvinceLayer({ data, visitedMap }: ProvinceLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  // 构建一次图层（582KB / 34 个 feature），不随编辑反复重建
  useEffect(() => {
    const pane = map.createPane('provinces');
    if (pane) pane.style.zIndex = '250';

    const layer = L.geoJSON(data as any, { pane: 'provinces' });
    layerRef.current = layer;
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [data, map]);

  // visitedMap 变化时只重设样式（轻量），不动图层结构
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.setStyle(feature => provinceStyle(feature as any, visitedMap));
  }, [visitedMap]);

  return null;
}
