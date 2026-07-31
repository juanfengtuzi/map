import { useState, useCallback, useMemo } from 'react';
import { Footer, Button, Loading, Notification } from 'animal-island-ui';
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
  const { trips, loading, error, selectedLocation, setSelectedLocation, addLocation, updateLocation, deleteLocation, addTripWithLocation, uploadPhoto } = useTravelsData(token);

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

  const handleFormSubmit = useCallback(async (tripId: string, location: Omit<Location, 'id'>) => {
    try {
      if (editingLocation) { await updateLocation(editingLocation.id, location); Notification.success({ message: '已更新', description: `${location.city} 已更新` }); }
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

      {/* ====== 浮动标题栏 P0-1: ≤56px, 半透明毛玻璃 ====== */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(248, 248, 240, 0.35)', backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(196, 184, 158, 0.2)',
        padding: '0 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#794f27', letterSpacing: '0.02em' }}>
            园子 & 兔子的旅行地图
          </span>
          <span style={{ fontSize: 11, color: '#9f927d', fontWeight: 500 }}>
            一起走过{stats.trips > 0 ? ` ${stats.cities} 座城市 · ${stats.trips} 趟旅行` : '的地方'}
          </span>
        </div>
      </div>

      {/* ====== P1-1: 管理 FAB ====== */}
      <div style={{ position: 'fixed', top: 62, right: 16, zIndex: 901 }}>
        {isAuthed ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button type="primary" size="middle" onClick={handleAddNew} style={{ minWidth: 44, minHeight: 44 }}>+ 新增地点</Button>
            <Button type="text" size="small" onClick={clearToken}>退出</Button>
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
          position: 'fixed', top: 62, left: '50%', transform: 'translateX(-50%)', zIndex: 950,
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
