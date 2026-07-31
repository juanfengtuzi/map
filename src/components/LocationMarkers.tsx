import type { Trip, Location } from '../types';

interface Props {
  locations: Location[];
  trips: Trip[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location) => void;
}

export default function LocationMarkers({ locations: _l, trips: _t, selectedLocation: _s, onSelectLocation: _o }: Props) {
  return null;
}
