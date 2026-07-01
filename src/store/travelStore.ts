import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trip, ExchangeRate, Currency } from '../types/travel';
import { sampleTrip } from './sampleData';
import { pushTrip, fetchTrip, generateShareCode } from '../lib/cloudSync';
import { isSupabaseReady } from '../lib/supabase';

const BE_GRAND_RESORT_LOCATION = {
  name: 'BE Grand Resort Bohol',
  address: 'BE Grand Drive, Brgy. Danao, Panglao Island, Bohol, 6340, Philippines',
  lat: 9.548933968595241,
  lng: 123.76461902802014,
} as const;

const DEFAULT_QUICK_LINKS = [
  { id: 'quick1', label: '🗺️ 구글 지도', url: 'https://www.google.com/maps/search/?api=1&query={query}' },
  { id: 'quick2', label: '🎫 Klook', url: 'https://www.klook.com/ko/search/?q={query}' },
  { id: 'quick3', label: '⭐ 트립어드바이저', url: 'https://www.tripadvisor.co.kr/Search?q={query}' },
] as const;

function normalizeTripLocations(trip: Trip): Trip {
  return {
    ...trip,
    locations: trip.locations.map((location) => {
      const isBeGrandResort =
        location.id === 'loc3' ||
        location.name.toLowerCase().includes('be grand resort');

      return isBeGrandResort
        ? { ...location, ...BE_GRAND_RESORT_LOCATION }
        : location;
    }),
    quickLinks: trip.quickLinks ?? [...DEFAULT_QUICK_LINKS],
  };
}

interface TravelStore {
  trips: Trip[];
  activeTrip: string | null;
  exchangeRates: ExchangeRate[];
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  setActiveTrip: (id: string | null) => void;
  getTrip: (id: string) => Trip | undefined;
  /** 현재 여행의 일정·비용·체크리스트·예약 데이터를 원본 샘플로 복원.
   *  tripId가 없으면 샘플 여행을 새로 추가. */
  restoreFromSample: (tripId?: string) => Promise<void>;

  /** 클라우드 동기화 활성화: 공유 코드 생성 후 Supabase에 업로드 */
  enableCloudSync: (tripId: string) => Promise<string | null>;
  /** 변경사항을 클라우드에 저장 (cloud-enabled 여행만) */
  syncToCloud: (tripId: string) => Promise<void>;
  /** 공유 코드로 클라우드에서 여행 불러오기 */
  joinByCode: (code: string) => Promise<'ok' | 'not_found' | 'no_supabase'>;
  /** 외부에서 받은 실시간 업데이트를 로컬에 반영 */
  applyRemoteUpdate: (trip: Trip) => void;

  setExchangeRate: (from: Currency, to: Currency, rate: number) => void;
  convertAmount: (amount: number, from: Currency, to: Currency) => number;
}

export const useTravelStore = create<TravelStore>()(
  persist(
    (set, get) => ({
      trips: [normalizeTripLocations(sampleTrip)],
      activeTrip: sampleTrip.id,
      syncStatus: 'idle',
      exchangeRates: [
        { from: 'KRW', to: 'PHP', rate: 0.042, updatedAt: new Date().toISOString() },
        { from: 'PHP', to: 'KRW', rate: 23.8, updatedAt: new Date().toISOString() },
        { from: 'KRW', to: 'USD', rate: 0.00073, updatedAt: new Date().toISOString() },
        { from: 'USD', to: 'KRW', rate: 1370, updatedAt: new Date().toISOString() },
        { from: 'KRW', to: 'JPY', rate: 0.108, updatedAt: new Date().toISOString() },
        { from: 'JPY', to: 'KRW', rate: 9.25, updatedAt: new Date().toISOString() },
      ],

      addTrip: (tripData) => {
        const id = `trip-${Date.now()}`;
        const now = new Date().toISOString();
        const newTrip: Trip = { ...tripData, id, createdAt: now, updatedAt: now };
        set((s) => ({ trips: [...s.trips, newTrip] }));
        return id;
      },

      updateTrip: (id, updates) => {
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
        // 변경 후 클라우드 자동 동기화
        const trip = get().trips.find((t) => t.id === id);
        if (trip?.cloudEnabled && trip?.shareCode) {
          get().syncToCloud(id);
        }
      },

      deleteTrip: (id) => {
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          activeTrip: s.activeTrip === id ? null : s.activeTrip,
        }));
      },

      setActiveTrip: (id) => set({ activeTrip: id }),
      getTrip: (id) => get().trips.find((t) => t.id === id),

      enableCloudSync: async (tripId) => {
        if (!isSupabaseReady) return null;
        const trip = get().trips.find((t) => t.id === tripId);
        if (!trip) return null;

        const code = trip.shareCode ?? generateShareCode();
        set({ syncStatus: 'syncing' });
        try {
          const updatedTrip = { ...trip, shareCode: code, cloudEnabled: true };
          await pushTrip(updatedTrip);
          set((s) => ({
            trips: s.trips.map((t) => t.id === tripId ? updatedTrip : t),
            syncStatus: 'synced',
          }));
          return code;
        } catch {
          set({ syncStatus: 'error' });
          return null;
        }
      },

      syncToCloud: async (tripId) => {
        const trip = get().trips.find((t) => t.id === tripId);
        if (!trip?.cloudEnabled || !trip?.shareCode) return;
        set({ syncStatus: 'syncing' });
        try {
          await pushTrip(trip);
          set({ syncStatus: 'synced' });
        } catch {
          set({ syncStatus: 'error' });
        }
      },

      joinByCode: async (code) => {
        if (!isSupabaseReady) return 'no_supabase';
        set({ syncStatus: 'syncing' });
        try {
          const trip = await fetchTrip(code.toUpperCase());
          if (!trip) { set({ syncStatus: 'idle' }); return 'not_found'; }
          const normalizedTrip = normalizeTripLocations(trip);
          // 이미 있으면 업데이트, 없으면 추가
          set((s) => {
            const exists = s.trips.find((t) => t.shareCode === code.toUpperCase());
            return {
              trips: exists
                ? s.trips.map((t) => t.shareCode === code.toUpperCase() ? normalizedTrip : t)
                : [...s.trips, normalizedTrip],
              activeTrip: normalizedTrip.id,
              syncStatus: 'synced',
            };
          });
          return 'ok';
        } catch {
          set({ syncStatus: 'error' });
          return 'not_found';
        }
      },

      restoreFromSample: async (tripId) => {
        if (tripId) {
          set((s) => ({
            trips: s.trips.map((t) =>
              t.id === tripId
                ? {
                    ...t,
                    itinerary: sampleTrip.itinerary,
                    expenses: sampleTrip.expenses,
                    checklist: sampleTrip.checklist,
                    bookings: sampleTrip.bookings,
                    locations: normalizeTripLocations(sampleTrip).locations,
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
          }));
          const trip = get().trips.find((t) => t.id === tripId);
          if (trip?.cloudEnabled && trip?.shareCode) {
            await get().syncToCloud(tripId);
          }
        } else {
          // 여행 자체가 없으면 샘플 여행을 새로 추가
          const now = new Date().toISOString();
          const restored: Trip = normalizeTripLocations({ ...sampleTrip, createdAt: now, updatedAt: now });
          set((s) => ({
            trips: [...s.trips.filter((t) => t.id !== sampleTrip.id), restored],
            activeTrip: restored.id,
          }));
        }
      },

      applyRemoteUpdate: (trip) => {
        const normalizedTrip = normalizeTripLocations(trip);
        set((s) => ({
          trips: s.trips.map((t) => t.id === normalizedTrip.id ? normalizedTrip : t),
          syncStatus: 'synced',
        }));
      },

      setExchangeRate: (from, to, rate) => {
        set((s) => ({
          exchangeRates: [
            ...s.exchangeRates.filter((r) => !(r.from === from && r.to === to)),
            { from, to, rate, updatedAt: new Date().toISOString() },
          ],
        }));
      },

      convertAmount: (amount, from, to) => {
        if (from === to) return amount;
        const { exchangeRates } = get();
        const direct = exchangeRates.find((r) => r.from === from && r.to === to);
        if (direct) return amount * direct.rate;
        const viaKRW = exchangeRates.find((r) => r.from === from && r.to === 'KRW');
        const krwTo = exchangeRates.find((r) => r.from === 'KRW' && r.to === to);
        if (viaKRW && krwTo) return amount * viaKRW.rate * krwTo.rate;
        return amount;
      },
    }),
    {
      name: 'travel-app-store',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<TravelStore> | undefined;
        if (!state?.trips) return persistedState;
        return {
          ...state,
          trips: state.trips.map(normalizeTripLocations),
        };
      },
    }
  )
);
