import { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Trip, Location } from '../types';
import { TRIP_COLOR_HEX } from '../constants';

interface LocationMarkersProps {
  locations: Location[];
  trips: Trip[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location) => void;
}

function createMarkerIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="13" r="5" fill="#fff"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

export default function LocationMarkers({ locations, trips, selectedLocation, onSelectLocation }: LocationMarkersProps) {
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (selectedLocation) {
      const marker = markerRefs.current.get(selectedLocation.id);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedLocation]);

  function getTripColor(locationId: string): string {
    for (const trip of trips) {
      if (trip.locations.some(l => l.id === locationId)) {
        return TRIP_COLOR_HEX[trip.color];
      }
    }
    return '#19c8b9';
  }

  return (
    <>
      {locations.map(loc => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={createMarkerIcon(getTripColor(loc.id))}
          ref={(ref) => {
            if (ref) markerRefs.current.set(loc.id, ref);
            else markerRefs.current.delete(loc.id);
          }}
          eventHandlers={{
            click: () => onSelectLocation(loc),
          }}
        >
          <Popup>
            <strong>{loc.city}</strong>
            <br />
            {loc.description}
          </Popup>
        </Marker>
      ))}
    </>
  );
}
