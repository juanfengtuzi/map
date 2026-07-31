import { Drawer, Card, Tag, Button, Divider } from 'animal-island-ui';
import type { Location, Trip } from '../types';
import { TRIP_COLOR_HEX } from '../constants';

const TAG_COLORS = [
  'app-pink', 'app-teal', 'app-blue', 'app-orange',
  'app-green', 'purple', 'warm-peach-pink', 'app-yellow',
] as const;

interface DetailDrawerProps {
  location: Location | null;
  open: boolean;
  onClose: () => void;
  isAuthed: boolean;
  onEdit: (loc: Location) => void;
  onDelete: (loc: Location) => void;
  trips: Trip[];
}

export default function DetailDrawer({ location, open, onClose, isAuthed, onEdit, onDelete, trips }: DetailDrawerProps) {
  if (!location) return null;

  const trip = trips.find(t => t.locations.some(l => l.id === location.id));
  const tripColor = trip ? TRIP_COLOR_HEX[trip.color] : '#19c8b9';

  return (
    <Drawer
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{location.city}</span>
          {trip && (
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: tripColor,
              background: `${tripColor}18`,
              padding: '2px 10px',
              borderRadius: 12,
            }}>
              {trip.name}
            </span>
          )}
        </div>
      }
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
        {/* 日期 */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: '#9f927d', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>
            日期
          </span>
          <p style={{
            color: '#794f27',
            fontWeight: 700,
            fontSize: 16,
            marginTop: 2,
          }}>
            {location.date}
          </p>
        </div>

        <Divider type="line-brown" />

        {/* 描述 */}
        <div style={{ margin: '16px 0' }}>
          <span style={{ color: '#9f927d', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>
            我们在这里
          </span>
          <p style={{
            color: '#725d42',
            marginTop: 6,
            lineHeight: 1.7,
            fontSize: 14,
          }}>
            {location.description}
          </p>
        </div>

        {/* 标签 */}
        {location.tags.length > 0 && (
          <>
            <Divider type="line-brown" />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '16px 0' }}>
              {location.tags.map((tag, i) => (
                <Tag
                  key={tag}
                  size="small"
                  color={TAG_COLORS[i % TAG_COLORS.length]}
                  variant="solid"
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </>
        )}

        {/* 照片 */}
        {location.photo && (
          <div style={{ marginTop: 8 }}>
            <Card color="app-pink" pattern="app-pink">
              <img
                src={location.photo}
                alt={location.city}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  display: 'block',
                }}
              />
            </Card>
          </div>
        )}
      </Card>
    </Drawer>
  );
}
