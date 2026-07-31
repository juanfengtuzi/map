import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Trip, Location } from '../types';
import { DEFAULT_CENTER, DEFAULT_ZOOM, GAODE_TILE_URL } from '../constants';
import TripPolylines from './TripPolylines';
import LocationMarkers from './LocationMarkers';

interface MapViewProps {
  trips: Trip[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location) => void;
  flyToTripId: string | null;
}

function FitBounds({ trips }: { trips: Trip[] }) {
  const map = useMap();

  useEffect(() => {
    const allLocs = trips.flatMap(t => t.locations);
    if (allLocs.length === 0) return;
    const bounds = L.latLngBounds(allLocs.map(l => [l.lat, l.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trips, map]);

  return null;
}

function FlyToTrip({ trips, flyToTripId }: { trips: Trip[]; flyToTripId: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!flyToTripId) return;
    const trip = trips.find(t => t.id === flyToTripId);
    if (!trip || trip.locations.length === 0) return;
    const lats = trip.locations.map(l => l.lat);
    const lngs = trip.locations.map(l => l.lng);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    map.flyTo([centerLat, centerLng], Math.max(map.getZoom(), 8), { duration: 1.5 });
  }, [flyToTripId, trips, map]);

  return null;
}

export default function MapView({ trips, selectedLocation, onSelectLocation, flyToTripId }: MapViewProps) {
  const allLocations = useMemo(
    () => trips.flatMap(t => t.locations),
    [trips]
  );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url={GAODE_TILE_URL}
        subdomains={['1', '2', '3', '4']}
        attribution='&copy; 高德地图'
      />
      <FitBounds trips={trips} />
      <FlyToTrip trips={trips} flyToTripId={flyToTripId} />
      <TripPolylines trips={trips} />
      <LocationMarkers
        locations={allLocations}
        trips={trips}
        selectedLocation={selectedLocation}
        onSelectLocation={onSelectLocation}
      />
    </MapContainer>
  );
}
