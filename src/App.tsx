import { useState, useCallback, useMemo } from 'react';
import { Footer, Button, Loading, Notification, Title } from 'animal-island-ui';
import MapView from './components/MapView';
import Timeline from './components/Timeline';
import DetailDrawer from './components/DetailDrawer';
import AuthModal from './components/AuthModal';
import LocationForm from './components/LocationForm';
import { useAuth } from './hooks/useAuth';
import { useTravelsData } from './hooks/useTravelsData';
import type { Location, TripColor } from './types';

export default function App() {
  const { token, isAuthed, setToken, clearToken, showAuthModal, setShowAuthModal } = useAuth();
  const { trips, loading, error, dirty, syncing, selectedLocation, setSelectedLocation, addLocation, updateLocation, deleteLocation, addTripWithLocation, uploadPhoto, syncToGitHub } = useTravelsData(token);

  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const citySet = new Set<string>();
    trips.forEach(t => t.locations.forEach(l => citySet.add(l.city)));
    return { cities: citySet.size, trips: trips.length };
  }, [trips]);

  const handleSelectTrip = useCallback((tripId: string) => { setSelectedTripId(tripId); }, []);
  const handleEdit = useCallback((loc: Location) => { setSelectedLocation(null); setEditingLocation(loc); setShowForm(true); }, []);

  const handleDelete = useCallback(async (loc: Location) => {
    try { await deleteLocation(loc.id); setSelectedLocation(null); Notification.success({ message: '已删除', description: `${loc.city} 已移除` }); }
    catch (e) { Notification.error({ message: '删除失败', description: e instanceof Error ? e.message : '未知错误' }); }
  }, [deleteLocation, setSelectedLocation]);

  const handleAddNew = useCallback(() => { setEditingLocation(null); setShowForm(true); }, []);

  const handleLogout = useCallback(async () => {
    try {
      const didSave = await syncToGitHub();
      if (didSave) Notification.success({ message: '已同步', description: '所有修改已保存到 GitHub' });
    } catch (e) {
      Notification.error({ message: '同步失败', description: e instanceof Error ? e.message : '请重试' });
      return;
    }
    clearToken();
  }, [syncToGitHub, clearToken]);

  const handleFormSubmit = useCallback(async (tripId: string, location: Omit<Location, 'id'>) => {
    try {
      if (editingLocation) { await updateLocation(editingLocation.id, location, tripId); Notification.success({ message: '已更新', description: `${location.city} 已更新` }); }
      else { await addLocation(tripId, location); Notification.success({ message: '已添加', description: `${location.city} 已加入` }); }
    } catch (e) { Notification.error({ message: '保存失败', description: e instanceof Error ? e.message : '未知错误' }); }
  }, [editingLocation, addLocation, updateLocation]);

  const handleSubmitWithNewTrip = useCallback(async (trip: { name: string; date: string; color: TripColor }, location: Omit<Location, 'id'>) => {
    try { await addTripWithLocation(trip, location); Notification.success({ message: '已添加', description: `${trip.name} - ${location.city}` }); }
    catch (e) { Notification.error({ message: '保存失败', description: e instanceof Error ? e.message : '未知错误' }); }
  }, [addTripWithLocation]);

  if (loading) return <Loading active />;

  return (
    <>
      {/* ====== 全屏地图 ====== */}
      <div style={{ position: 'fixed', inset: 0 }}>
        <MapView trips={trips} selectedLocation={selectedLocation} onSelectLocation={setSelectedLocation} flyToTripId={selectedTripId} />
      </div>

      {/* ====== 浮动标题栏 ====== */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'rgba(248, 248, 240, 0.3)', backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(196, 184, 158, 0.2)',
        padding: '10px 16px 8px',
      }}>
        <Title size="middle" color="app-pink">园子 & 兔子的旅行地图</Title>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 500, color: '#9f927d',
          letterSpacing: '0.05em', marginTop: 2,
        }}>
          一起走过{stats.trips > 0 ? ` ${stats.cities} 座城市 · ${stats.trips} 趟旅行` : '的地方'}
        </p>
      </div>

      {/* ====== 管理 FAB ====== */}
      <div style={{ position: 'fixed', top: 14, right: 16, zIndex: 901 }}>
        {isAuthed ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button type="primary" size="middle" onClick={handleAddNew} style={{ minWidth: 44, minHeight: 44 }}>+ 新增地点</Button>
            <Button type="text" size="small" onClick={handleLogout} loading={syncing} disabled={syncing}>
              {syncing ? '同步中...' : dirty ? '保存并退出' : '退出'}
            </Button>
          </div>
        ) : (
          <Button type="dashed" size="middle" onClick={() => setShowAuthModal(true)} style={{ minWidth: 44, minHeight: 44 }}>管理</Button>
        )}
      </div>

      {/* ====== 底部时间轴 + Footer P0-3 ====== */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900 }}>
        <Timeline trips={trips} onSelectTrip={handleSelectTrip} selectedTripId={selectedTripId} />
        <div style={{ height: 40, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
          <Footer type="sea" />
        </div>
      </div>

      {/* ====== 错误浮层 ====== */}
      {error && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 950,
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)', padding: '6px 16px',
          borderRadius: 18, color: '#e05a5a', fontSize: 13, fontWeight: 600,
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}>{error}</div>
      )}

      {/* ====== Drawers/Modals ====== */}
      <DetailDrawer location={selectedLocation} open={selectedLocation !== null} onClose={() => setSelectedLocation(null)} isAuthed={isAuthed} onEdit={handleEdit} onDelete={handleDelete} trips={trips} />
      <AuthModal open={showAuthModal} token={token} onSetToken={setToken} onClearToken={clearToken} onClose={() => setShowAuthModal(false)} />
      <LocationForm open={showForm} trips={trips} editingLocation={editingLocation} onSubmit={handleFormSubmit} onSubmitWithNewTrip={handleSubmitWithNewTrip} onUploadPhoto={uploadPhoto} onClose={() => { setShowForm(false); setEditingLocation(null); }} />
    </>
  );
}
