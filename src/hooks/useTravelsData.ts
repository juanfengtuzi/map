import { useState, useEffect, useCallback, useRef } from 'react';
import type { TravelsData, Trip, Location } from '../types';
import { useGitHubApi } from './useGitHubApi';
import { v4 as uuidv4 } from 'uuid';
import sampleData from '../../data/travels.json';

export function useTravelsData(token: string | null) {
  const { fetchData, saveData, uploadPhoto } = useGitHubApi(token);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [dirty, setDirty] = useState(false);       // 有未同步的本地修改
  const [syncing, setSyncing] = useState(false);    // 正在同步到 GitHub
  const tripsRef = useRef<Trip[]>([]);

  // Keep ref in sync
  useEffect(() => { tripsRef.current = trips; }, [trips]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: TravelsData = await fetchData();
      setTrips(data.trips);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载数据失败');
      if (tripsRef.current.length === 0) {
        setTrips((sampleData as TravelsData).trips);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => { refresh(); }, []); // eslint-disable-line

  // ===== 本地修改（不触发 API） =====
  const updateLocalTrips = useCallback((newTrips: Trip[]) => {
    tripsRef.current = newTrips;
    setTrips(newTrips);
    setDirty(true);
  }, []);

  // ===== 一次性同步到 GitHub =====
  const syncToGitHub = useCallback(async () => {
    if (!dirty) return;
    setSyncing(true);
    try {
      await saveData({ trips: tripsRef.current });
      setDirty(false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : '同步失败');
    } finally {
      setSyncing(false);
    }
  }, [dirty, saveData]);

  // ===== CRUD（仅本地） =====
  const addLocation = useCallback(async (tripId: string, loc: Omit<Location, 'id'>) => {
    const current = tripsRef.current;
    const newTrips = current.map(trip => {
      if (trip.id !== tripId) return trip;
      return { ...trip, locations: [...trip.locations, { ...loc, id: uuidv4() }] };
    });
    updateLocalTrips(newTrips);
  }, [updateLocalTrips]);

  const updateLocation = useCallback(async (locationId: string, updates: Partial<Location>, newTripId?: string) => {
    const current = tripsRef.current;
    let oldTrip: Trip | undefined;
    let oldLocation: Location | undefined;
    for (const t of current) {
      const loc = t.locations.find(l => l.id === locationId);
      if (loc) { oldTrip = t; oldLocation = loc; break; }
    }
    if (!oldTrip || !oldLocation) return;

    const updatedLocation: Location = { ...oldLocation, ...updates };
    const effectiveNewTripId = newTripId || oldTrip.id;

    let newTrips: Trip[];
    if (effectiveNewTripId !== oldTrip.id) {
      newTrips = current
        .map(trip => {
          if (trip.id === oldTrip!.id) return { ...trip, locations: trip.locations.filter(l => l.id !== locationId) };
          if (trip.id === effectiveNewTripId) return { ...trip, locations: [...trip.locations, updatedLocation] };
          return trip;
        })
        .filter(trip => trip.locations.length > 0);
    } else {
      newTrips = current.map(trip => ({
        ...trip,
        locations: trip.locations.map(loc => loc.id === locationId ? updatedLocation : loc),
      }));
    }
    updateLocalTrips(newTrips);
  }, [updateLocalTrips]);

  const deleteLocation = useCallback(async (locationId: string) => {
    const current = tripsRef.current;
    const newTrips = current
      .map(trip => ({ ...trip, locations: trip.locations.filter(loc => loc.id !== locationId) }))
      .filter(trip => trip.locations.length > 0);
    updateLocalTrips(newTrips);
  }, [updateLocalTrips]);

  const addTripWithLocation = useCallback(async (
    trip: { name: string; date: string; color: Trip['color'] },
    location: Omit<Location, 'id'>
  ) => {
    const current = tripsRef.current;
    const newTrip: Trip = {
      id: uuidv4(), name: trip.name, date: trip.date, color: trip.color,
      locations: [{ ...location, id: uuidv4() }],
    };
    updateLocalTrips([...current, newTrip]);
  }, [updateLocalTrips]);

  return {
    trips, loading, error, dirty, syncing,
    selectedLocation, setSelectedLocation,
    addLocation, updateLocation, deleteLocation, addTripWithLocation, uploadPhoto,
    syncToGitHub, refresh,
  };
}
