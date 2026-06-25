import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeTrip } from './cloudSync';
import { useTravelStore } from '../store/travelStore';

/** 현재 활성 여행이 cloud-enabled이면 실시간 업데이트를 구독 */
export function useRealtimeSync() {
  const { trips, activeTrip, applyRemoteUpdate } = useTravelStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const prevCodeRef = useRef<string | null>(null);

  const trip = trips.find((t) => t.id === activeTrip);
  const code = trip?.cloudEnabled ? (trip.shareCode ?? null) : null;

  useEffect(() => {
    // 코드가 바뀌었을 때만 재구독
    if (code === prevCodeRef.current) return;

    // 이전 구독 해제
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    prevCodeRef.current = code;

    if (!code) return;

    channelRef.current = subscribeTrip(code, (updatedTrip) => {
      applyRemoteUpdate(updatedTrip);
    });

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [code]);
}
