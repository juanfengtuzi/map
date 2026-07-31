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
    } catch {
      setTrips((sampleData as TravelsData).trips);
    } finally {
      setLoading(false);
    }
  }, [token, fetchData]);

  useEffect(() => { refresh(); }, [refresh]);

  const persistTrips = useCallback(async (newTrips: Trip[]) => {
    await saveData({ trips: newTrips });   // save first
    setTrips(newTrips);                     // update state only on success
  }, [saveData]);

  const addLocation = useCallback(async (tripId: string, loc: Omit<Location, 'id'>) => {
    const current = tripsRef.current;
    const newTrips = current.map(trip => {
      if (trip.id !== tripId) return trip;
      return { ...trip, locations: [...trip.locations, { ...loc, id: uuidv4() }] };
    });
    await persistTrips(newTrips);
  }, [persistTrips]);

  const updateLocation = useCallback(async (locationId: string, updates: Partial<Location>) => {
    const current = tripsRef.current;
    const newTrips = current.map(trip => ({
      ...trip,
      locations: trip.locations.map(loc =>
        loc.id === locationId ? { ...loc, ...updates } : loc
      ),
    }));
    await persistTrips(newTrips);
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
