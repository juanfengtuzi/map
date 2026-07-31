# 旅行地图网站 实现计划

> **给执行者:** 请使用 superpowers:subagent-driven-development 或 superpowers:executing-plans 来按任务逐个实现。步骤使用 checkbox (`- [ ]`) 语法跟踪进度。

**目标:** 构建一个使用 animal-island-ui 风格的中国旅行地图单页应用，支持按旅行分组展示、彩色路线连线、底部时间轴、以及 GitHub API 驱动的后台管理，部署到 GitHub Pages。

**架构:** React + TypeScript + Vite 单页应用。Leaflet 渲染高德瓦片地图，animal-island-ui 提供全部 UI 组件。数据通过 GitHub Raw URL 读取、通过 GitHub Contents API 写入。管理认证使用存储在 localStorage 的 GitHub Personal Access Token。

**技术栈:** React 18, TypeScript, Vite, animal-island-ui, Leaflet + react-leaflet, GitHub Contents API, GitHub Pages

## 全局约束

- animal-island-ui >= 0.9.5，React >= 17.0.0
- 必须在入口文件 `import 'animal-island-ui/style'`
- 所有组件 props 必须来自 AI_USAGE.md 中列出的合法值，禁止自行发明 prop
- 地图仅限中国范围，使用高德瓦片
- 数据文件路径: `data/travels.json`
- 部署 base 路径: `/map/`

---

## 文件结构

```
map/
├── index.html                          # HTML 入口，引入 Google Fonts
├── package.json                        # 依赖和脚本
├── tsconfig.json                       # TypeScript 配置
├── tsconfig.node.json                  # Vite Node 端 TS 配置
├── vite.config.ts                      # Vite 构建配置 (base: /map/)
├── data/
│   └── travels.json                    # 示例旅行数据
├── src/
│   ├── main.tsx                        # 应用入口，导入 animal-island-ui/style
│   ├── App.tsx                         # 根组件，组合所有模块
│   ├── types.ts                        # 所有 TypeScript 类型定义
│   ├── constants.ts                    # 颜色映射、地图默认值、API URL 模板
│   ├── hooks/
│   │   ├── useTravelsData.ts           # 数据加载与状态管理
│   │   ├── useAuth.ts                  # Token 认证状态
│   │   └── useGitHubApi.ts            # GitHub API 封装（读/写/删）
│   ├── components/
│   │   ├── MapView.tsx                 # 地图容器（react-leaflet）
│   │   ├── TripPolylines.tsx           # 旅行彩色虚线连线
│   │   ├── LocationMarkers.tsx         # 地点标记点（自定义图标）
│   │   ├── Timeline.tsx                # 底部时间轴容器
│   │   ├── DetailDrawer.tsx            # 右侧地点详情抽屉
│   │   ├── AuthModal.tsx               # GitHub Token 输入弹窗
│   │   └── LocationForm.tsx            # 新增/编辑地点的表单
│   └── index.css                       # 全局样式覆盖
└── .github/
    └── workflows/
        └── deploy.yml                  # GitHub Actions 自动部署
```

---

### Task 1: 项目脚手架与基础配置

**创建:** `package.json`, `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/main.tsx`, `src/index.css`

**接口:**
- 产出: Vite + React + TypeScript 项目骨架，可 `npm run dev` 启动空页面

- [ ] **Step 1: 初始化 package.json**

```bash
cd D:\PycharmProjects\map
```

创建 `package.json`:

```json
{
  "name": "travel-map",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: 安装依赖**

```bash
npm install react@18 react-dom@18 animal-island-ui leaflet react-leaflet uuid
npm install -D typescript @types/react @types/react-dom @types/uuid @types/leaflet vite @vitejs/plugin-react
```

- [ ] **Step 3: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>园子&兔子的旅行地图</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/map/',
});
```

- [ ] **Step 6: 创建 src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'animal-island-ui/style';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: 创建 src/index.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  overflow: hidden;
  font-family: Nunito, 'Noto Sans SC', -apple-system, 'PingFang SC', sans-serif;
  background-color: #f8f8f0;
}
```

- [ ] **Step 8: 验证项目能启动**

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`，确认白屏无报错。

---

### Task 2: 类型定义与常量

**创建:** `src/types.ts`, `src/constants.ts`

**接口:**
- 产出: `Location`, `Trip`, `TravelsData`, `TripColor` 类型；颜色 hex 映射表、默认地图中心、高德瓦片 URL 模板

- [ ] **Step 1: 创建 src/types.ts**

```typescript
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
```

- [ ] **Step 2: 创建 src/constants.ts**

```typescript
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
```

- [ ] **Step 3: 创建示例数据 data/travels.json**

```json
{
  "trips": [
    {
      "id": "trip-001",
      "name": "杭州之旅",
      "date": "2025-03",
      "color": "app-pink",
      "locations": [
        {
          "id": "loc-001",
          "city": "杭州",
          "lat": 30.2741,
          "lng": 120.1551,
          "date": "2025-03-15",
          "description": "一起在西湖边看日落",
          "tags": ["自然风光"],
          "photo": ""
        }
      ]
    }
  ]
}
```

- [ ] **Step 4: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 3: 认证 Hook

**创建:** `src/hooks/useAuth.ts`

**接口:**
- 产出: `useAuth()` hook — `{ token, isAuthed, setToken, clearToken, showAuthModal, setShowAuthModal }`

- [ ] **Step 1: 创建 src/hooks/useAuth.ts**

```typescript
import { useState, useCallback } from 'react';

const TOKEN_KEY = 'github_pat';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(getStoredToken);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAuthed = token !== null && token.length > 0;

  const setToken = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setTokenState(newToken);
    setShowAuthModal(false);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
  }, []);

  return { token, isAuthed, setToken, clearToken, showAuthModal, setShowAuthModal };
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 4: GitHub API Hook

**创建:** `src/hooks/useGitHubApi.ts`

**接口:**
- 消费: `useAuth()` 的 `token`
- 产出: `useGitHubApi(token)` — `{ fetchData, saveData }`

- [ ] **Step 1: 创建 src/hooks/useGitHubApi.ts**

```typescript
import { useCallback } from 'react';
import type { TravelsData } from '../types';
import { GITHUB_RAW_URL, GITHUB_API_URL, DATA_FILE_PATH } from '../constants';

export function useGitHubApi(token: string | null) {

  const fetchData = useCallback(async (): Promise<TravelsData> => {
    const response = await fetch(GITHUB_RAW_URL, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`获取数据失败: ${response.status}`);
    }
    return response.json();
  }, []);

  const saveData = useCallback(async (data: TravelsData): Promise<void> => {
    if (!token) {
      throw new Error('未设置 GitHub Token');
    }

    // 先获取当前文件的 sha
    const getResponse = await fetch(GITHUB_API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!getResponse.ok) {
      throw new Error(`获取文件信息失败: ${getResponse.status}`);
    }
    const fileInfo = await getResponse.json();
    const sha: string = fileInfo.sha;

    // PUT 更新文件
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const putResponse = await fetch(GITHUB_API_URL, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '更新旅行数据',
        content,
        sha,
        branch: 'main',
      }),
    });

    if (!putResponse.ok) {
      const err = await putResponse.json();
      throw new Error(`保存失败: ${err.message}`);
    }
  }, [token]);

  return { fetchData, saveData };
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 5: 数据管理 Hook

**创建:** `src/hooks/useTravelsData.ts`

**接口:**
- 消费: `useGitHubApi` 的 `fetchData` / `saveData`
- 产出: `useTravelsData()` — `{ trips, loading, error, selectedLocation, setSelectedLocation, addLocation, updateLocation, deleteLocation, addTrip, refresh }`

- [ ] **Step 1: 创建 src/hooks/useTravelsData.ts**

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { TravelsData, Trip, Location } from '../types';
import { useGitHubApi } from './useGitHubApi';
import { v4 as uuidv4 } from 'uuid';

export function useTravelsData(token: string | null) {
  const { fetchData } = useGitHubApi(token);
  const { fetchData: publicFetch, saveData } = useGitHubApi(token);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: TravelsData = token ? await fetchData() : await publicFetch();
      setTrips(data.trips);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
      // 如果 API 获取失败，尝试直接 fetch（公开模式）
      if (!token) {
        try {
          const data: TravelsData = await publicFetch();
          setTrips(data.trips);
        } catch {
          // 保持 error 状态
        }
      }
    } finally {
      setLoading(false);
    }
  }, [token, fetchData, publicFetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistTrips = useCallback(async (newTrips: Trip[]) => {
    setTrips(newTrips);
    await saveData({ trips: newTrips });
  }, [saveData]);

  const addLocation = useCallback(async (tripId: string, loc: Omit<Location, 'id'>) => {
    const newTrips = trips.map(trip => {
      if (trip.id !== tripId) return trip;
      return {
        ...trip,
        locations: [...trip.locations, { ...loc, id: uuidv4() }],
      };
    });
    await persistTrips(newTrips);
  }, [trips, persistTrips]);

  const updateLocation = useCallback(async (locationId: string, updates: Partial<Location>) => {
    const newTrips = trips.map(trip => ({
      ...trip,
      locations: trip.locations.map(loc =>
        loc.id === locationId ? { ...loc, ...updates } : loc
      ),
    }));
    await persistTrips(newTrips);
  }, [trips, persistTrips]);

  const deleteLocation = useCallback(async (locationId: string) => {
    const newTrips = trips.map(trip => ({
      ...trip,
      locations: trip.locations.filter(loc => loc.id !== locationId),
    }));
    await persistTrips(newTrips);
  }, [trips, persistTrips]);

  const addTrip = useCallback(async (trip: Omit<Trip, 'id'>) => {
    const newTrips = [...trips, { ...trip, id: uuidv4() }];
    await persistTrips(newTrips);
  }, [trips, persistTrips]);

  return {
    trips, loading, error,
    selectedLocation, setSelectedLocation,
    addLocation, updateLocation, deleteLocation, addTrip, refresh,
  };
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 6: 地图视图 — 地图容器与高德瓦片

**创建:** `src/components/MapView.tsx`

**接口:**
- 消费: `trips`, `selectedLocation`, `setSelectedLocation`
- 产出: Leaflet 地图容器，高德中文瓦片，`fitBounds` 自动缩放

- [ ] **Step 1: 创建 src/components/MapView.tsx**

```typescript
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
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 7: 地图视图 — 彩色虚线连线

**创建:** `src/components/TripPolylines.tsx`

**接口:**
- 消费: `trips`
- 产出: 每趟旅行地点间的彩色虚线 polyline

- [ ] **Step 1: 创建 src/components/TripPolylines.tsx**

```typescript
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
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 8: 地图视图 — 自定义地点标记

**创建:** `src/components/LocationMarkers.tsx`

**接口:**
- 消费: `locations`, `trips`, `selectedLocation`, `onSelectLocation`
- 产出: 点击标记触发详情抽屉

- [ ] **Step 1: 创建 src/components/LocationMarkers.tsx**

```typescript
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
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 9: 底部时间轴

**创建:** `src/components/Timeline.tsx`

**接口:**
- 消费: `trips`, `onSelectTrip(tripId)` — 点击圆点时触发地图飞至
- 产出: 水平滚动时间轴，虚线轨道 + 彩色圆点 + 旅行名称 + 日期

- [ ] **Step 1: 创建 src/components/Timeline.tsx**

```typescript
import type { Trip } from '../types';
import { TRIP_COLOR_HEX } from '../constants';

interface TimelineProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  selectedTripId: string | null;
}

export default function Timeline({ trips, onSelectTrip, selectedTripId }: TimelineProps) {
  if (trips.length === 0) return null;

  const sorted = [...trips].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{
      position: 'absolute',
      bottom: 60,
      left: 0,
      right: 0,
      height: 80,
      overflowX: 'auto',
      overflowY: 'hidden',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 0,
      zIndex: 1000,
      background: 'rgba(248, 248, 240, 0.92)',
      borderTop: '2px solid #e8dcc8',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        minWidth: 'max-content',
        position: 'relative',
        height: 4,
        background: `repeating-linear-gradient(to right, #c4b89e 0, #c4b89e 4px, transparent 4px, transparent 12px)`,
      }}>
        {sorted.map((trip, index) => {
          const color = TRIP_COLOR_HEX[trip.color];
          const isSelected = trip.id === selectedTripId;

          return (
            <div
              key={trip.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                marginLeft: index === 0 ? 0 : 40,
                userSelect: 'none',
              }}
              onClick={() => onSelectTrip(trip.id)}
            >
              <span style={{
                fontSize: 11,
                color: '#725d42',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                marginBottom: 6,
              }}>
                {trip.name} {trip.date}
              </span>
              <div style={{
                width: isSelected ? 18 : 14,
                height: isSelected ? 18 : 14,
                borderRadius: '50%',
                backgroundColor: color,
                border: isSelected ? '3px solid #725d42' : '2px solid #fff',
                boxShadow: isSelected ? `0 0 0 3px ${color}40` : '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 10: 右侧详情抽屉

**创建:** `src/components/DetailDrawer.tsx`

**接口:**
- 消费: `location`, `isAuthed`, `onEdit`, `onDelete`
- 产出: Drawer 展示城市名、日期、描述、标签、照片、管理按钮

- [ ] **Step 1: 创建 src/components/DetailDrawer.tsx**

```typescript
import { Drawer, Card, Tag, Button } from 'animal-island-ui';
import type { Location } from '../types';

interface DetailDrawerProps {
  location: Location | null;
  open: boolean;
  onClose: () => void;
  isAuthed: boolean;
  onEdit: (loc: Location) => void;
  onDelete: (loc: Location) => void;
}

export default function DetailDrawer({ location, open, onClose, isAuthed, onEdit, onDelete }: DetailDrawerProps) {
  if (!location) return null;

  return (
    <Drawer
      open={open}
      title={location.city}
      placement="right"
      width={400}
      onClose={onClose}
      footer={isAuthed ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" onClick={() => onEdit(location)}>编辑</Button>
          <Button type="primary" danger onClick={() => onDelete(location)}>删除</Button>
        </div>
      ) : null}
    >
      <Card>
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#9f927d', fontSize: 13 }}>日期</span>
          <p style={{ color: '#725d42', fontWeight: 600, marginTop: 4 }}>{location.date}</p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#9f927d', fontSize: 13 }}>我们在这里</span>
          <p style={{ color: '#725d42', marginTop: 4, lineHeight: 1.6 }}>{location.description}</p>
        </div>

        {location.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {location.tags.map(tag => (
              <Tag key={tag} size="small" color="app-teal" variant="outlined">{tag}</Tag>
            ))}
          </div>
        )}

        {location.photo && (
          <div style={{ marginTop: 16 }}>
            <Card>
              <img
                src={location.photo}
                alt={location.city}
                style={{ width: '100%', borderRadius: 12, display: 'block' }}
              />
            </Card>
          </div>
        )}
      </Card>
    </Drawer>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 11: 认证弹窗

**创建:** `src/components/AuthModal.tsx`

**接口:**
- 消费: `open`, `onSetToken`, `onClose`
- 产出: Modal 输入 GitHub Token

- [ ] **Step 1: 创建 src/components/AuthModal.tsx**

```typescript
import { useState } from 'react';
import { Modal, Input, Button } from 'animal-island-ui';

interface AuthModalProps {
  open: boolean;
  onSetToken: (token: string) => void;
  onClose: () => void;
}

export default function AuthModal({ open, onSetToken, onClose }: AuthModalProps) {
  const [value, setValue] = useState('');

  function handleOk() {
    const trimmed = value.trim();
    if (trimmed) {
      onSetToken(trimmed);
      setValue('');
    }
  }

  function handleClose() {
    setValue('');
    onClose();
  }

  return (
    <Modal
      open={open}
      title="输入 GitHub Token"
      onClose={handleClose}
      onOk={handleOk}
      footer={
        <>
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" onClick={handleOk}>确认</Button>
        </>
      }
    >
      <p style={{ marginBottom: 12, color: '#725d42' }}>
        请输入 GitHub Personal Access Token 来管理旅行数据。
        Token 只存储在本地浏览器中。
      </p>
      <Input
        placeholder="ghp_xxxxxxxxxxxx"
        value={value}
        onChange={e => setValue((e.target as HTMLInputElement).value)}
        allowClear
        shadow
      />
    </Modal>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 12: 地点编辑表单

**创建:** `src/components/LocationForm.tsx`

**接口:**
- 消费: `trips`, `editingLocation`（编辑时传入，新增为 null 表示新增旅行），`onSubmit`, `onCancel`
- 产出: Modal 或 Drawer 中的表单，使用 animal-island-ui 的 Form + FormItem + Select + Input + Checkbox

- [ ] **Step 1: 创建 src/components/LocationForm.tsx**

```typescript
import { useCallback } from 'react';
import { Modal, Form, FormItem, Input, Select, Button, useForm } from 'animal-island-ui';
import type { Trip, Location, TripColor } from '../types';
import { TRIP_COLORS } from '../constants';

interface LocationFormValues {
  city: string;
  date: string;
  description: string;
  lat: string;
  lng: string;
  tags: string[];
  photo: string;
  tripId: string;
  tripName: string;
  tripDate: string;
  tripColor: TripColor;
}

interface LocationFormProps {
  open: boolean;
  trips: Trip[];
  editingLocation: Location | null;
  onSubmit: (tripId: string, location: Omit<Location, 'id'>, tripInfo?: { name: string; date: string; color: TripColor }) => void;
  onAddTrip: (trip: { name: string; date: string; color: TripColor }) => string;
  onClose: () => void;
}

export default function LocationForm({ open, trips, editingLocation, onSubmit, onAddTrip, onClose }: LocationFormProps) {
  const [form] = useForm<LocationFormValues>();
  const isNewTrip = !editingLocation && trips.length === 0;

  const handleFinish = useCallback((values: LocationFormValues) => {
    let targetTripId = values.tripId;

    if (values.tripId === '__new__') {
      targetTripId = onAddTrip({
        name: values.tripName,
        date: values.tripDate,
        color: values.tripColor,
      });
    }

    onSubmit(targetTripId, {
      city: values.city,
      date: values.date,
      description: values.description,
      lat: parseFloat(values.lat),
      lng: parseFloat(values.lng),
      tags: values.tags,
      photo: values.photo || '',
    });
    form.resetFields();
    onClose();
  }, [onSubmit, onAddTrip, form, onClose]);

  const tripOptions = [
    ...trips.map(t => ({ key: t.id, label: t.name })),
    { key: '__new__', label: '+ 新建旅行' },
  ];

  const tagOptions = [
    { label: '自然风光', value: '自然风光' },
    { label: '美食', value: '美食' },
    { label: '城市漫步', value: '城市漫步' },
    { label: '历史文化', value: '历史文化' },
    { label: '海边', value: '海边' },
    { label: '山野', value: '山野' },
  ];

  return (
    <Modal
      open={open}
      title={editingLocation ? `编辑 - ${editingLocation.city}` : '新增地点'}
      onClose={onClose}
      footer={null}
      typewriter={false}
    >
      <Form
        form={form}
        initialValues={{
          tripId: editingLocation ? trips.find(t => t.locations.some(l => l.id === editingLocation.id))?.id || trips[0]?.id || '__new__' : isNewTrip ? '__new__' : trips[0]?.id || '__new__',
          city: editingLocation?.city || '',
          date: editingLocation?.date || '',
          description: editingLocation?.description || '',
          lat: editingLocation?.lat?.toString() || '',
          lng: editingLocation?.lng?.toString() || '',
          tags: editingLocation?.tags || [],
          photo: editingLocation?.photo || '',
          tripName: '',
          tripDate: '',
          tripColor: 'app-pink' as TripColor,
        }}
        layout="vertical"
        onFinish={handleFinish as any}
      >
        <FormItem label="所属旅行" name="tripId" rules={[{ required: true, message: '请选择旅行' }]}>
          <Select options={tripOptions} value={form.getFieldValue('tripId') as string} onChange={v => form.setFieldValue('tripId', v)} />
        </FormItem>

        <FormItem label="城市名" name="city" rules={[{ required: true, message: '请输入城市名' }]}>
          <Input placeholder="例如：杭州" />
        </FormItem>

        <FormItem label="日期" name="date" rules={[{ required: true, message: '请输入日期' }]}>
          <Input placeholder="例如：2025-03-15" />
        </FormItem>

        <FormItem label="纬度" name="lat" rules={[{ required: true, message: '请输入纬度' }]}>
          <Input placeholder="例如：30.2741" />
        </FormItem>

        <FormItem label="经度" name="lng" rules={[{ required: true, message: '请输入经度' }]}>
          <Input placeholder="例如：120.1551" />
        </FormItem>

        <FormItem label="描述" name="description" rules={[{ required: true, message: '请输入描述' }]}>
          <Input placeholder="一起做了什么..." />
        </FormItem>

        <FormItem label="标签" name="tags">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tagOptions.map(tag => {
              const currentTags = (form.getFieldValue('tags') as string[]) || [];
              const isSelected = currentTags.includes(tag.value);
              return (
                <span
                  key={tag.value}
                  onClick={() => {
                    const next = isSelected
                      ? currentTags.filter(v => v !== tag.value)
                      : [...currentTags, tag.value];
                    form.setFieldValue('tags', next);
                  }}
                  style={{
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `2px solid ${isSelected ? '#19c8b9' : '#c4b89e'}`,
                    backgroundColor: isSelected ? '#e6f9f6' : 'transparent',
                    color: isSelected ? '#11a89b' : '#8f734f',
                    userSelect: 'none',
                  }}
                >
                  {tag.label}
                </span>
              );
            })}
          </div>
        </FormItem>

        <FormItem label="照片 URL" name="photo">
          <Input placeholder="https://..." />
        </FormItem>

        <FormItem>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </FormItem>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

---

### Task 13: 根组件 App 组装

**创建:** `src/App.tsx`

**接口:**
- 消费: 所有 hooks 和组件
- 产出: 完整应用的组合和状态管理

- [ ] **Step 1: 创建 src/App.tsx**

```typescript
import { useState, useCallback } from 'react';
import { Cursor, Title, Footer, Button, Loading, Notification } from 'animal-island-ui';
import MapView from './components/MapView';
import Timeline from './components/Timeline';
import DetailDrawer from './components/DetailDrawer';
import AuthModal from './components/AuthModal';
import LocationForm from './components/LocationForm';
import { useAuth } from './hooks/useAuth';
import { useTravelsData } from './hooks/useTravelsData';
import { TRIP_COLORS } from './constants';
import type { Location, TripColor } from './types';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const { token, isAuthed, setToken, clearToken, showAuthModal, setShowAuthModal } = useAuth();
  const {
    trips, loading, error,
    selectedLocation, setSelectedLocation,
    addLocation, updateLocation, deleteLocation, addTrip,
  } = useTravelsData(token);

  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const handleSelectTrip = useCallback((tripId: string) => {
    setSelectedTripId(tripId);
  }, []);

  const handleEdit = useCallback((loc: Location) => {
    setEditingLocation(loc);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (loc: Location) => {
    await deleteLocation(loc.id);
    setSelectedLocation(null);
    Notification.success({ message: '已删除', description: `${loc.city} 已从旅行地图中移除` });
  }, [deleteLocation, setSelectedLocation]);

  const handleAddNew = useCallback(() => {
    setEditingLocation(null);
    setShowForm(true);
  }, []);

  const handleFormSubmit = useCallback(async (
    tripId: string,
    location: Omit<Location, 'id'>,
  ) => {
    if (editingLocation) {
      await updateLocation(editingLocation.id, location);
      Notification.success({ message: '已更新', description: `${location.city} 信息已更新` });
    } else {
      await addLocation(tripId, location);
      Notification.success({ message: '已添加', description: `${location.city} 已加入旅行地图` });
    }
  }, [editingLocation, addLocation, updateLocation]);

  const handleAddTrip = useCallback((trip: { name: string; date: string; color: TripColor }): string => {
    const id = uuidv4();
    addTrip({ ...trip, locations: [] });
    return id;
  }, [addTrip]);

  if (loading) {
    return <Loading active />;
  }

  return (
    <Cursor>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* 顶部横幅 */}
        <div style={{
          textAlign: 'center',
          padding: '12px 0 8px',
          position: 'relative',
          zIndex: 1001,
        }}>
          <Title size="large" color="app-yellow">园子&兔子的旅行地图</Title>
        </div>

        {/* 主体地图 */}
        <div style={{ flex: 1, position: 'relative' }}>
          {error && (
            <div style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1002,
              background: '#fff',
              padding: '8px 24px',
              borderRadius: 999,
              color: '#e05a5a',
              fontSize: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              {error}
            </div>
          )}

          <MapView
            trips={trips}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            flyToTripId={selectedTripId}
          />

          {/* 时间轴 */}
          <Timeline
            trips={trips}
            onSelectTrip={handleSelectTrip}
            selectedTripId={selectedTripId}
          />

          {/* 管理按钮 */}
          <div style={{ position: 'absolute', bottom: 12, left: 16, zIndex: 1002 }}>
            {isAuthed ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="primary" size="small" onClick={handleAddNew}>
                  新增地点
                </Button>
                <Button type="text" size="small" onClick={clearToken}>
                  退出管理
                </Button>
              </div>
            ) : (
              <Button type="dashed" size="small" onClick={() => setShowAuthModal(true)}>
                管理
              </Button>
            )}
          </div>
        </div>

        <Footer type="sea" />
      </div>

      {/* 详情抽屉 */}
      <DetailDrawer
        location={selectedLocation}
        open={selectedLocation !== null}
        onClose={() => setSelectedLocation(null)}
        isAuthed={isAuthed}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 认证弹窗 */}
      <AuthModal
        open={showAuthModal}
        onSetToken={setToken}
        onClose={() => setShowAuthModal(false)}
      />

      {/* 地点编辑表单 */}
      <LocationForm
        open={showForm}
        trips={trips}
        editingLocation={editingLocation}
        onSubmit={handleFormSubmit}
        onAddTrip={handleAddTrip}
        onClose={() => {
          setShowForm(false);
          setEditingLocation(null);
        }}
      />
    </Cursor>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 验证开发服务器运行**

```bash
npm run dev
```

---

### Task 14: GitHub Actions 部署

**创建:** `.github/workflows/deploy.yml`

- [ ] **Step 1: 创建 .github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 提交所有代码并推送到 GitHub**

```bash
git init
git add -A
git commit -m "feat: init travel map website"
git branch -M main
git remote add origin https://github.com/{your-username}/map.git
git push -u origin main
```

---

### Task 15: 配置 GitHub 仓库 URL

**修改:** `src/constants.ts`

将 `GITHUB_RAW_URL` 和 `GITHUB_API_URL` 中的 `{owner}` 和 `{repo}` 替换为实际值。

- [ ] **Step 1: 更新常量**

```typescript
// 示例（替换为实际值）
export const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/your-username/map/main/data/travels.json';
export const GITHUB_API_URL =
  'https://api.github.com/repos/your-username/map/contents/data/travels.json';
```

- [ ] **Step 2: 重新构建推送**

```bash
npm run build
git add -A
git commit -m "chore: update repo URLs"
git push
```
