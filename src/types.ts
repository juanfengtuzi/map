export interface Location {
  id: string;
  city: string;
  lat: number;
  lng: number;
  date: string;
  description: string;
  tags: string[];
  photo: string;
}

export type TripColor =
  | 'app-pink'
  | 'purple'
  | 'app-blue'
  | 'app-yellow'
  | 'app-orange'
  | 'app-teal'
  | 'app-green'
  | 'app-red'
  | 'lime-green'
  | 'yellow-green'
  | 'brown'
  | 'warm-peach-pink';

export interface Trip {
  id: string;
  name: string;
  date: string;
  color: TripColor;
  locations: Location[];
}

export interface TravelsData {
  trips: Trip[];
}

export type ProvinceGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

export interface ProvinceFeature {
  type: 'Feature';
  properties: { adcode?: string; name?: string; center?: [number, number] };
  geometry: ProvinceGeometry;
}
export interface ProvinceData {
  type: 'FeatureCollection';
  features: ProvinceFeature[];
}
