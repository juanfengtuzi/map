import { useState, useEffect, useRef } from 'react';
import type { Trip } from '../types';
import type { ProvinceData } from '../types';
import { CHINA_PROVINCES_URL } from '../constants';
import { computeVisitedProvinces } from '../utils/geo';

function mapsEqual(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}

export function useProvinces(trips: Trip[]) {
  const [provinceData, setProvinceData] = useState<ProvinceData | null>(null);
  const [visitedMap, setVisitedMap] = useState<Map<string, string>>(new Map());
  const [visitedCount, setVisitedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(34);
  const attemptsRef = useRef(0);

  // 拉取省界 GeoJSON，带一次重试（避免瞬时网络失败静默禁用整个功能）
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const res = await fetch(CHINA_PROVINCES_URL);
        if (!res.ok) throw new Error('province fetch failed');
        const d: ProvinceData = await res.json();
        if (!cancelled) setProvinceData(d);
      } catch (e) {
        attemptsRef.current += 1;
        if (attemptsRef.current < 2 && !cancelled) {
          retryTimer = setTimeout(load, 1500);
        } else {
          console.error('加载省界数据失败:', e);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    if (!provinceData) return;
    const r = computeVisitedProvinces(provinceData, trips);
    setVisitedCount(r.visitedCount);
    setTotalCount(r.totalCount);
    // 内容未变化时复用旧 Map 引用，避免 ProvinceLayer 反复重建
    setVisitedMap(prev => (mapsEqual(prev, r.visitedMap) ? prev : r.visitedMap));
  }, [provinceData, trips]);

  return { provinceData, visitedMap, visitedCount, totalCount };
}
