import { useState, useEffect } from 'react';
import type { Trip } from '../types';
import type { ProvinceData } from '../types';
import { CHINA_PROVINCES_URL } from '../constants';
import { computeVisitedProvinces } from '../utils/geo';

export function useProvinces(trips: Trip[]) {
  const [provinceData, setProvinceData] = useState<ProvinceData | null>(null);
  const [visitedMap, setVisitedMap] = useState<Map<string, string>>(new Map());
  const [visitedCount, setVisitedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(34);

  useEffect(() => {
    let cancelled = false;
    fetch(CHINA_PROVINCES_URL)
      .then(r => { if (!r.ok) throw new Error('province fetch failed'); return r.json(); })
      .then((d: ProvinceData) => { if (!cancelled) setProvinceData(d); })
      .catch(e => console.error('加载省界数据失败:', e));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!provinceData) return;
    const r = computeVisitedProvinces(provinceData, trips);
    setVisitedMap(r.visitedMap);
    setVisitedCount(r.visitedCount);
    setTotalCount(r.totalCount);
  }, [provinceData, trips]);

  return { provinceData, visitedMap, visitedCount, totalCount };
}
