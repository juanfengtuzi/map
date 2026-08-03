import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Trip, Location, ProvinceData } from '../types';
import { DEFAULT_CENTER, DEFAULT_ZOOM, GAODE_TILE_URL } from '../constants';
import TripPolylines from './TripPolylines';
import LocationMarkers from './LocationMarkers';
import ProvinceLayer from './ProvinceLayer';

interface MapViewProps {
  trips: Trip[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location) => void;
  flyToTripId: string | null;
  provinces: ProvinceData | null;
  visitedMap: Map<string, string>;
}

function FitBounds({ trips }: { trips: Trip[] }) {
  const map = useMap();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return; // 仅首次加载自动适配
    const allLocs = trips.flatMap(t => t.locations);
    if (allLocs.length === 0) return;
    const bounds = L.latLngBounds(allLocs.map(l => [l.lat, l.lng]));
    if (bounds.isValid()) {
      hasRun.current = true;
      map.fitBounds(bounds, { padding: [50, 50], animate: false }); // 不要动画，避免和 flyTo 冲突
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
    map.stop();
    map.flyTo([centerLat, centerLng], Math.max(map.getZoom(), 8), { duration: 1.2 });
  }, [flyToTripId, trips, map]);

  return null;
}

export default function MapView({ trips, selectedLocation, onSelectLocation, flyToTripId, provinces, visitedMap }: MapViewProps) {
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
      {provinces && <ProvinceLayer data={provinces} visitedMap={visitedMap} />}
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
