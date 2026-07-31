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
      padding: '6px 16px 4px',
      background: 'rgba(248, 248, 240, 0.35)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    }}>
      <div className="timeline-scroll" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '8px 0',
      }}>
        {/* 标签 */}
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#9f927d',
          letterSpacing: '0.08em',
          marginRight: 16,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          旅行足迹
        </span>

        {/* 旅行胶囊 */}
        {sorted.map((trip, index) => {
          const color = TRIP_COLOR_HEX[trip.color];
          const isSelected = trip.id === selectedTripId;

          return (
            <div
              key={trip.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {/* 连接线 */}
              {index > 0 && (
                <div style={{
                  width: 24,
                  height: 2,
                  background: `repeating-linear-gradient(to right, #c4b89e 0, #c4b89e 3px, transparent 3px, transparent 8px)`,
                  marginRight: 0,
                }} />
              )}

              {/* 胶囊卡片 */}
              <div
                onClick={() => onSelectTrip(trip.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px 6px 12px',
                  borderRadius: 24,
                  cursor: 'pointer',
                  background: isSelected
                    ? 'rgba(247, 243, 223, 0.85)'
                    : 'rgba(247, 243, 223, 0.5)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  boxShadow: isSelected
                    ? `0 3px 12px rgba(114,93,66,0.15), 0 0 0 2px ${color}80`
                    : '0 1px 4px rgba(114,93,66,0.06)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.25s ease',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {/* 彩色圆点 */}
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: color,
                  flexShrink: 0,
                  boxShadow: `0 1px 3px ${color}60`,
                }} />

                {/* 旅行名称 + 日期 */}
                <div>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#794f27',
                  }}>
                    {trip.name}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#9f927d',
                    marginLeft: 6,
                  }}>
                    {trip.date}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
