import { useState, useEffect } from 'react';
import type { Trip } from '../types';
import type { ProvinceData } from '../types';
import chinaProvinces from '../assets/china-provinces.json';
import { computeVisitedProvinces } from '../utils/geo';

function mapsEqual(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}

// 省界数据直接打包进应用（消除运行时网络依赖，任何环境都保证渲染）。
// 来源：阿里 DataV 100000_full.json（GCJ-02，35 个 feature = 34 省 + 九段线）。
export function useProvinces(trips: Trip[]) {
  const [provinceData] = useState<ProvinceData | null>(chinaProvinces as ProvinceData);
  const [visitedMap, setVisitedMap] = useState<Map<string, string>>(new Map());
  const [visitedCount, setVisitedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(34);

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
