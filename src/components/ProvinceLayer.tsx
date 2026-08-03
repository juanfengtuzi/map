import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ProvinceData } from '../types';

interface ProvinceLayerProps {
  data: ProvinceData;
  visitedMap: Map<string, string>;
}

export default function ProvinceLayer({ data, visitedMap }: ProvinceLayerProps) {
  const map = useMap();

  useEffect(() => {
    const pane = map.createPane('provinces');
    if (pane) pane.style.zIndex = '250';

    const layer = L.geoJSON(data as any, {
      pane: 'provinces',
      style: (feature: any) => {
        const color = visitedMap.get(String(feature?.properties?.adcode));
        if (color) {
          return { color, weight: 1.6, fillColor: color, fillOpacity: 0.35, opacity: 0.85 };
        }
        return { color: '#c4b89e', weight: 0.8, fillColor: '#c4b89e', fillOpacity: 0.05, opacity: 0.55 };
      },
    });

    layer.addTo(map);
    return () => { map.removeLayer(layer); };
  }, [data, visitedMap, map]);

  return null;
}
