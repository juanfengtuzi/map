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
  const tripsRef = useRef<Trip[]>([]);

  // Keep ref in sync
  useEffect(() => { tripsRef.current = trips; }, [trips]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: TravelsData = await fetchData();
      setTrips(data.trips);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载数据失败');
      if (tripsRef.current.length === 0) {
        setTrips((sampleData as TravelsData).trips);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  // 仅在首次加载时拉取数据，token 变化不重新拉取
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persistTrips = useCallback(async (newTrips: Trip[]) => {
    const prev = tripsRef.current;
    tripsRef.current = newTrips;
    setTrips(newTrips);
    try {
      await saveData({ trips: newTrips });
      // 保存成功后稍等片刻重新拉取，确保和 GitHub 同步
      setTimeout(() => {
        fetchData().then(data => {
          tripsRef.current = data.trips;
          setTrips(data.trips);
        }).catch((e) => {
          console.error('保存后同步拉取失败:', e);
        });
      }, 2000);
    } catch (e) {
      tripsRef.current = prev;
      setTrips(prev);
      throw new Error(e instanceof Error ? e.message : '保存失败，已还原');
    }
  }, [saveData, fetchData]);

  const addLocation = useCallback(async (tripId: string, loc: Omit<Location, 'id'>) => {
    const current = tripsRef.current;
    const newTrips = current.map(trip => {
      if (trip.id !== tripId) return trip;
      return { ...trip, locations: [...trip.locations, { ...loc, id: uuidv4() }] };
    });
    await persistTrips(newTrips);
  }, [persistTrips]);

  const updateLocation = useCallback(async (locationId: string, updates: Partial<Location>, newTripId?: string) => {
    const current = tripsRef.current;

    // Resolve location + current trip
    let oldTrip: Trip | undefined;
    let oldLocation: Location | undefined;
    for (const t of current) {
      const loc = t.locations.find(l => l.id === locationId);
      if (loc) { oldTrip = t; oldLocation = loc; break; }
    }
    if (!oldTrip || !oldLocation) {
      // Location not found (possibly stale ref after rapid operations); refuse silently
      return;
    }

    const updatedLocation: Location = { ...oldLocation, ...updates };
    const effectiveNewTripId = newTripId || oldTrip.id;

    if (effectiveNewTripId !== oldTrip.id) {
      // Moving location to a different trip
      const newTrips = current
        .map(trip => {
          if (trip.id === oldTrip!.id) {
            return { ...trip, locations: trip.locations.filter(l => l.id !== locationId) };
          }
          if (trip.id === effectiveNewTripId) {
            return { ...trip, locations: [...trip.locations, updatedLocation] };
          }
          return trip;
        })
        .filter(trip => trip.locations.length > 0);
      await persistTrips(newTrips);
    } else {
      const newTrips = current.map(trip => ({
        ...trip,
        locations: trip.locations.map(loc =>
          loc.id === locationId ? updatedLocation : loc
        ),
      }));
      await persistTrips(newTrips);
    }
  }, [persistTrips]);

  const deleteLocation = useCallback(async (locationId: string) => {
    const current = tripsRef.current;
    const newTrips = current
      .map(trip => ({
        ...trip,
        locations: trip.locations.filter(loc => loc.id !== locationId),
      }))
      .filter(trip => trip.locations.length > 0);
    await persistTrips(newTrips);
  }, [persistTrips]);

  const addTrip = useCallback(async (trip: Trip) => {
    const current = tripsRef.current;
    const newTrips = [...current, trip];
    await persistTrips(newTrips);
  }, [persistTrips]);

  // 原子操作：新建旅行 + 添加第一个地点
  const addTripWithLocation = useCallback(async (
    trip: { name: string; date: string; color: Trip['color'] },
    location: Omit<Location, 'id'>
  ) => {
    const current = tripsRef.current;
    const newTrip: Trip = {
      id: uuidv4(),
      name: trip.name,
      date: trip.date,
      color: trip.color,
      locations: [{ ...location, id: uuidv4() }],
    };
    const newTrips = [...current, newTrip];
    await persistTrips(newTrips);
  }, [persistTrips]);

  return {
    trips, loading, error,
    selectedLocation, setSelectedLocation,
    addLocation, updateLocation, deleteLocation, addTrip, addTripWithLocation, uploadPhoto, refresh,
  };
}
