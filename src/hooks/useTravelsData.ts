import { useState, useEffect, useCallback } from 'react';
import type { TravelsData, Trip, Location } from '../types';
import { useGitHubApi } from './useGitHubApi';
import { v4 as uuidv4 } from 'uuid';
import sampleData from '../../data/travels.json';

export function useTravelsData(token: string | null) {
  const { fetchData } = useGitHubApi(token);
  const { fetchData: publicFetch, saveData } = useGitHubApi(token);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: TravelsData = token ? await fetchData() : await publicFetch();
      setTrips(data.trips);
    } catch {
      // 远程获取失败时使用本地示例数据
      setTrips((sampleData as TravelsData).trips);
    } finally {
      setLoading(false);
    }
  }, [token, fetchData, publicFetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistTrips = useCallback(async (newTrips: Trip[]) => {
    setTrips(newTrips);
    await saveData({ trips: newTrips });
  }, [saveData]);

  const addLocation = useCallback(async (tripId: string, loc: Omit<Location, 'id'>) => {
    const newTrips = trips.map(trip => {
      if (trip.id !== tripId) return trip;
      return {
        ...trip,
        locations: [...trip.locations, { ...loc, id: uuidv4() }],
      };
    });
    await persistTrips(newTrips);
  }, [trips, persistTrips]);

  const updateLocation = useCallback(async (locationId: string, updates: Partial<Location>) => {
    const newTrips = trips.map(trip => ({
      ...trip,
      locations: trip.locations.map(loc =>
        loc.id === locationId ? { ...loc, ...updates } : loc
      ),
    }));
    await persistTrips(newTrips);
  }, [trips, persistTrips]);

  const deleteLocation = useCallback(async (locationId: string) => {
    const newTrips = trips
      .map(trip => ({
        ...trip,
        locations: trip.locations.filter(loc => loc.id !== locationId),
      }))
      .filter(trip => trip.locations.length > 0);
    await persistTrips(newTrips);
  }, [trips, persistTrips]);

  const addTrip = useCallback(async (trip: Trip) => {
    const newTrips = [...trips, trip];
    await persistTrips(newTrips);
  }, [trips, persistTrips]);

  return {
    trips, loading, error,
    selectedLocation, setSelectedLocation,
    addLocation, updateLocation, deleteLocation, addTrip, refresh,
  };
}
