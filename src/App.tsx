import { useState, useCallback } from 'react';
import { Cursor, Title, Footer, Button, Loading, Notification } from 'animal-island-ui';
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
    return id;
  }, [addTrip]);

  if (loading) {
    return <Loading active />;
  }

  return (
    <Cursor>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* 顶部横幅 */}
        <div style={{
          textAlign: 'center',
          padding: '12px 0 8px',
          position: 'relative',
          zIndex: 1001,
        }}>
          <Title size="large" color="app-yellow">园子&兔子的旅行地图</Title>
        </div>

        {/* 主体地图 */}
        <div style={{ flex: 1, position: 'relative' }}>
          {error && (
            <div style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1002,
              background: '#fff',
              padding: '8px 24px',
              borderRadius: 999,
              color: '#e05a5a',
              fontSize: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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

          {/* 时间轴 */}
          <Timeline
            trips={trips}
            onSelectTrip={handleSelectTrip}
            selectedTripId={selectedTripId}
          />

          {/* 管理按钮 */}
          <div style={{ position: 'absolute', bottom: 12, left: 16, zIndex: 1002 }}>
            {isAuthed ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="primary" size="small" onClick={handleAddNew}>
                  新增地点
                </Button>
                <Button type="text" size="small" onClick={clearToken}>
                  退出管理
                </Button>
              </div>
            ) : (
              <Button type="dashed" size="small" onClick={() => setShowAuthModal(true)}>
                管理
              </Button>
            )}
          </div>
        </div>

        <Footer type="sea" />
      </div>

      {/* 详情抽屉 */}
      <DetailDrawer
        location={selectedLocation}
        open={selectedLocation !== null}
        onClose={() => setSelectedLocation(null)}
        isAuthed={isAuthed}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 认证弹窗 */}
      <AuthModal
        open={showAuthModal}
        onSetToken={setToken}
        onClose={() => setShowAuthModal(false)}
      />

      {/* 地点编辑表单 */}
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
