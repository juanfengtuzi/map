import type { TripColor } from './types';

export const TRIP_COLOR_HEX: Record<TripColor, string> = {
  'app-pink': '#f8a6b2',
  'purple': '#b77dee',
  'app-blue': '#889df0',
  'app-yellow': '#f7cd67',
  'app-orange': '#e59266',
  'app-teal': '#82d5bb',
  'app-green': '#8ac68a',
  'app-red': '#fc736d',
  'lime-green': '#d1da49',
  'yellow-green': '#ecdf52',
  'brown': '#9a835a',
  'warm-peach-pink': '#e18c6f',
};

export const TRIP_COLORS: TripColor[] = [
  'app-pink', 'purple', 'app-blue', 'app-yellow',
  'app-orange', 'app-teal', 'app-green', 'app-red',
  'lime-green', 'yellow-green', 'brown', 'warm-peach-pink',
];

export const DEFAULT_CENTER: [number, number] = [35.86, 104.19];
export const DEFAULT_ZOOM = 5;

export const GAODE_TILE_URL =
  'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}';

export const DATA_FILE_PATH = 'data/travels.json';

// 需要替换为实际的 GitHub 用户名和仓库名
export const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/{owner}/{repo}/main/data/travels.json';
export const GITHUB_API_URL =
  'https://api.github.com/repos/{owner}/{repo}/contents/data/travels.json';
