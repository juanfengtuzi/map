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
