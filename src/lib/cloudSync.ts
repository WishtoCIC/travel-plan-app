import { supabase, isSupabaseReady } from './supabase';
import type { Trip } from '../types/travel';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function generateShareCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/** 여행 데이터를 클라우드에 저장 (없으면 생성, 있으면 덮어쓰기) */
export async function pushTrip(trip: Trip): Promise<void> {
  if (!isSupabaseReady || !supabase || !trip.shareCode) return;
  await supabase.from('trips').upsert({
    code: trip.shareCode,
    data: trip,
    updated_at: new Date().toISOString(),
  });
}

/** 클라우드에서 여행 데이터를 가져옴 */
export async function fetchTrip(code: string): Promise<Trip | null> {
  if (!isSupabaseReady || !supabase) return null;
  const { data, error } = await supabase
    .from('trips')
    .select('data')
    .eq('code', code.toUpperCase())
    .single();
  if (error || !data) return null;
  return data.data as Trip;
}

/** 실시간 변경 구독. 반환값(채널)을 저장했다가 언마운트 시 unsubscribe 호출 */
export function subscribeTrip(
  code: string,
  onUpdate: (trip: Trip) => void
): RealtimeChannel | null {
  if (!isSupabaseReady || !supabase) return null;
  return supabase
    .channel(`trip-${code}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'trips',
        filter: `code=eq.${code.toUpperCase()}`,
      },
      (payload) => {
        const trip = (payload.new as { data: Trip }).data;
        if (trip) onUpdate(trip);
      }
    )
    .subscribe();
}
