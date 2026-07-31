import { useState, useCallback, useMemo } from 'react';
import { Cursor, Title, Footer, Button, Loading, Notification, Divider, Tag } from 'animal-island-ui';
import MapView from './components/MapView';
import Timeline from './components/Timeline';
import DetailDrawer from './components/DetailDrawer';
import AuthModal from './components/AuthModal';
import LocationForm from './components/LocationForm';
import { useAuth } from './hooks/useAuth';
import { useTravelsData } from './hooks/useTravelsData';
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

  const stats = useMemo(() => {
    const citySet = new Set<string>();
    trips.forEach(t => t.locations.forEach(l => citySet.add(l.city)));
    return { cities: citySet.size, trips: trips.length };
  }, [trips]);

  const handleSelectTrip = useCallback((tripId: string) => {
    setSelectedTripId(tripId);
  }, []);

  const handleEdit = useCallback((loc: Location) => {
    setEditingLocation(loc);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (loc: Location) => {
    try {
      await deleteLocation(loc.id);
      setSelectedLocation(null);
      Notification.success({ message: '已删除', description: `${loc.city} 已从旅行地图中移除` });
    } catch (e) {
      Notification.error({ message: '删除失败', description: e instanceof Error ? e.message : '未知错误' });
    }
  }, [deleteLocation, setSelectedLocation]);

  const handleAddNew = useCallback(() => {
    setEditingLocation(null);
    setShowForm(true);
  }, []);

  const handleFormSubmit = useCallback(async (
    tripId: string,
    location: Omit<Location, 'id'>,
  ) => {
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, location);
        Notification.success({ message: '已更新', description: `${location.city} 信息已更新` });
      } else {
        await addLocation(tripId, location);
        Notification.success({ message: '已添加', description: `${location.city} 已加入旅行地图` });
      }
    } catch (e) {
      Notification.error({ message: '保存失败', description: e instanceof Error ? e.message : '未知错误' });
    }
  }, [editingLocation, addLocation, updateLocation]);

  const handleAddTrip = useCallback(async (trip: { name: string; date: string; color: TripColor }): Promise<string> => {
    const id = uuidv4();
    await addTrip({ ...trip, id, locations: [] });
    Notification.success({ message: '已创建', description: `${trip.name} 已创建` });
    return id;
  }, [addTrip]);

  if (loading) {
    return <Loading active />;
  }

  return (
    <Cursor>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* 顶部横幅 — 居中、留白、标题即主角 */}
        <div style={{
          textAlign: 'center',
          padding: '14px 0 6px',
          zIndex: 1001,
          background: 'rgba(248, 248, 240, 0.2)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}>
          <Title size="large" color="app-pink">园子 & 兔子的旅行地图</Title>
          <p style={{
            color: '#9f927d',
            fontSize: 13,
            fontWeight: 500,
            marginTop: 6,
            letterSpacing: '0.06em',
          }}>
            一起走过
            {stats.trips > 0 ? (
              <span>
                <strong style={{ color: '#794f27', fontWeight: 800 }}> {stats.cities} </strong>座城市
                <span style={{ margin: '0 6px', color: '#c4b89e' }}>·</span>
                <strong style={{ color: '#794f27', fontWeight: 800 }}> {stats.trips} </strong>趟旅行
              </span>
            ) : (
              ' 的地方'
            )}
          </p>
        </div>

        <Divider type="wave-yellow" />

        {/* 主体地图 */}
        <div className="map-frame" style={{ flex: 1, position: 'relative' }}>

          {error && (
            <div style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1002,
              background: 'rgba(247, 243, 223, 0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: '8px 20px',
              borderRadius: 18,
              color: '#e05a5a',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
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

          {/* 管理面板 — 右上角浮动 */}
          <div style={{ position: 'absolute', top: 12, right: 16, zIndex: 1002 }}>
            {isAuthed ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Tag size="small" color="app-teal" variant="solid">管理员</Tag>
                <Button type="primary" size="small" onClick={handleAddNew}>新增地点</Button>
                <Button type="text" size="small" onClick={clearToken}>退出</Button>
              </div>
            ) : (
              <Button type="dashed" size="small" onClick={() => setShowAuthModal(true)}>管理</Button>
            )}
          </div>
        </div>

        {/* 时间轴 + Footer 组合 */}
        <div style={{ position: 'relative' }}>
          <Timeline
            trips={trips}
            onSelectTrip={handleSelectTrip}
            selectedTripId={selectedTripId}
          />
          <Footer type="sea" />
        </div>
      </div>

      <DetailDrawer
        location={selectedLocation}
        open={selectedLocation !== null}
        onClose={() => setSelectedLocation(null)}
        isAuthed={isAuthed}
        onEdit={handleEdit}
        onDelete={handleDelete}
        trips={trips}
      />

      <AuthModal
        open={showAuthModal}
        onSetToken={setToken}
        onClose={() => setShowAuthModal(false)}
      />

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
