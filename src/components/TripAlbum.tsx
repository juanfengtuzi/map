import { useState, useCallback, useEffect } from 'react';
import { Button, Card, Divider, Progress, Tag, Title } from 'animal-island-ui';
import type { Trip } from '../types';

interface TripAlbumProps {
  trip: Trip;
  onClose: () => void;
}

const TAG_COLORS = [
  'app-pink', 'app-teal', 'app-blue', 'app-orange',
  'app-green', 'purple', 'warm-peach-pink', 'app-yellow',
] as const;

// 全屏"旅行故事相册"：把一趟旅行的地点串成可翻页的日记
export default function TripAlbum({ trip, onClose }: TripAlbumProps) {
  const locs = trip.locations;
  const [index, setIndex] = useState(0);

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex(i => Math.min(locs.length - 1, i + 1)), [locs.length]);

  // 键盘翻页 / 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, onClose]);

  if (locs.length === 0) return null;

  const loc = locs[Math.min(index, locs.length - 1)];
  const color = trip.color;
  const progress = Math.round(((index + 1) / locs.length) * 100);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(61, 52, 40, 0.55)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      padding: 20,
      animation: 'animal-album-fade 0.2s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        display: 'flex', flexDirection: 'column',
        maxHeight: '82vh',
        background: 'rgb(247, 243, 223)',
        borderRadius: 24,
        boxShadow: '0 12px 40px rgba(61, 52, 40, 0.3)',
        padding: '20px 20px 16px',
        position: 'relative',
        animation: 'animal-album-in 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* 关闭 */}
        <Button type="text" size="small" onClick={onClose}
          style={{ position: 'absolute', top: 8, right: 10, fontSize: 18, color: '#9f927d' }}>
          ✕
        </Button>

        {/* 头部：旅行名 + 进度 */}
        <div style={{ textAlign: 'center', paddingRight: 40 }}>
          <Title size="middle" color={color}>{trip.name}</Title>
          <div style={{ marginTop: 2, fontSize: 12, color: '#9f927d', fontWeight: 600 }}>
            {trip.date} · 第 {index + 1}/{locs.length} 站
          </div>
        </div>

        <Divider type="line-brown" />

        {/* 内容区（可滚动） */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#794f27' }}>{loc.city}</div>
          <div style={{ fontSize: 13, color: '#9f927d', marginTop: 2 }}>{loc.date}</div>

          {loc.photo && (
            <Card color={color} pattern={color} style={{ marginTop: 12, padding: 8 }}>
              <img
                src={loc.photo}
                alt={loc.city}
                style={{ width: '100%', borderRadius: 14, display: 'block', maxHeight: 320, objectFit: 'cover' }}
              />
            </Card>
          )}

          <p style={{ color: '#725d42', lineHeight: 1.7, margin: '14px 0', fontSize: 14 }}>
            {loc.description}
          </p>

          {loc.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {loc.tags.map((tag, i) => (
                <Tag key={tag} size="small" color={TAG_COLORS[i % TAG_COLORS.length]} variant="solid">{tag}</Tag>
              ))}
            </div>
          )}
        </div>

        <Divider type="line-brown" />

        {/* 底部导航 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
          <Button type="default" size="small" onClick={prev} disabled={index === 0}>上一站</Button>
          <div style={{ flex: 1 }}>
            <Progress percent={progress} size="small" showInfo={false} />
          </div>
          <Button type="primary" size="small" onClick={next} disabled={index === locs.length - 1}>下一站</Button>
        </div>
      </div>
    </div>
  );
}
