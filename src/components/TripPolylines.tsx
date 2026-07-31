import { Polyline } from 'react-leaflet';
import type { Trip } from '../types';
import { TRIP_COLOR_HEX } from '../constants';

interface TripPolylinesProps {
  trips: Trip[];
}

export default function TripPolylines({ trips }: TripPolylinesProps) {
  return (
    <>
      {trips.map(trip => {
        if (trip.locations.length < 2) return null;
        const positions: [number, number][] = trip.locations.map(loc => [loc.lat, loc.lng]);
        return (
          <Polyline
            key={trip.id}
            positions={positions}
            pathOptions={{
              color: TRIP_COLOR_HEX[trip.color],
              dashArray: '10, 10',
              weight: 3,
              opacity: 0.8,
            }}
          />
        );
      })}
    </>
  );
}
