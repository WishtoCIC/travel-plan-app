import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trip, ExchangeRate, Currency } from '../types/travel';
import { sampleTrip } from './sampleData';

interface TravelStore {
  trips: Trip[];
  activeTrip: string | null;
  exchangeRates: ExchangeRate[];
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  setActiveTrip: (id: string | null) => void;
  getTrip: (id: string) => Trip | undefined;
  setExchangeRate: (from: Currency, to: Currency, rate: number) => void;
  convertAmount: (amount: number, from: Currency, to: Currency) => number;
}

export const useTravelStore = create<TravelStore>()(
  persist(
    (set, get) => ({
      trips: [sampleTrip],
      activeTrip: sampleTrip.id,
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
      },

      deleteTrip: (id) => {
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          activeTrip: s.activeTrip === id ? null : s.activeTrip,
        }));
      },

      setActiveTrip: (id) => set({ activeTrip: id }),

      getTrip: (id) => get().trips.find((t) => t.id === id),

      setExchangeRate: (from, to, rate) => {
        set((s) => {
          const existing = s.exchangeRates.filter(
            (r) => !(r.from === from && r.to === to)
          );
          return {
            exchangeRates: [
              ...existing,
              { from, to, rate, updatedAt: new Date().toISOString() },
            ],
          };
        });
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
    { name: 'travel-app-store' }
  )
);
