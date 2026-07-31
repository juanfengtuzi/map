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
