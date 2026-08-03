import { Tag } from 'animal-island-ui';
import type { Trip } from '../types';
import type { TagColor } from 'animal-island-ui';

interface TimelineProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  selectedTripId: string | null;
}

export default function Timeline({ trips, onSelectTrip, selectedTripId }: TimelineProps) {
  if (trips.length === 0) return null;
  const sorted = [...trips].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="timeline-bar" style={{ background: 'rgba(248, 248, 240, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div className="timeline-scroll" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        overflowX: 'auto', overflowY: 'hidden', padding: '4px 0',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#9f927d',
          letterSpacing: '0.08em', marginRight: 8, whiteSpace: 'nowrap', flexShrink: 0,
        }}>旅行足迹</span>

        {sorted.map((trip, index) => {
          const isSelected = trip.id === selectedTripId;
          return (
            <div key={trip.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {index > 0 && (
                <div style={{
                  width: 18, height: 2, marginRight: 0,
                  background: 'repeating-linear-gradient(to right, #c4b89e 0, #c4b89e 2px, transparent 2px, transparent 6px)',
                }} />
              )}
              <div style={{ transform: isSelected ? 'translateY(-1px)' : 'none', transition: 'transform 0.2s ease' }}>
                <Tag
                  size="medium"
                  color={trip.color as TagColor}
                  variant={isSelected ? 'solid' : 'outlined'}
                  onClick={() => onSelectTrip(trip.id)}
                >
                  {trip.name} {trip.date}
                </Tag>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
