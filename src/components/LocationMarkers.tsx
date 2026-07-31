import { useEffect, useRef, useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { Trip, Location } from '../types';
import { TRIP_COLOR_HEX } from '../constants';

interface Props {
  locations: Location[];
  trips: Trip[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location) => void;
}

function createPin(color: string) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="13" r="5" fill="#fff"/>
  </svg>`;
  return L.divIcon({ html: s, className: 'custom-marker', iconSize: [28, 36], iconAnchor: [14, 36], tooltipAnchor: [14, -20] });
}

export default function LocationMarkers({ locations, trips, selectedLocation, onSelectLocation }: Props) {
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  // 预计算 locationId → color map
  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of trips) for (const l of t.locations) m.set(l.id, TRIP_COLOR_HEX[t.color]);
    return m;
  }, [trips]);

  useEffect(() => {
    if (selectedLocation) markerRefs.current.get(selectedLocation.id)?.openTooltip();
  }, [selectedLocation]);

  return (
    <>
      {locations.map(loc => {
        const color = colorMap.get(loc.id) || '#19c8b9';
        return (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={createPin(color)}
            ref={r => { if (r) markerRefs.current.set(loc.id, r); else markerRefs.current.delete(loc.id); }}
            eventHandlers={{ click: () => onSelectLocation(loc) }}
          >
            <Tooltip direction="top" offset={[0, -36]} opacity={0.96}>
              <div style={{ width: 180, padding: '4px 0', fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 4px ${color}60` }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#794f27' }}>{loc.city}</span>
                  <span style={{ fontSize: 11, color: '#9f927d', marginLeft: 'auto' }}>{loc.date}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#725d42', lineHeight: 1.5 }}>{loc.description}</p>
                {loc.photo && (
                  <div style={{ marginTop: 6, width: '100%', height: 80, borderRadius: 8, background: `url(${loc.photo}) center/cover no-repeat`, backgroundColor: '#f0e8d8' }} />
                )}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
