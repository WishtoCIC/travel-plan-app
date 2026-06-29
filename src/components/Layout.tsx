import { useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, DollarSign, CheckSquare, Map, RefreshCw } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';

const navItems = [
  { to: '/', label: '홈', icon: Home, end: true },
  { to: '/itinerary', label: '일정', icon: List },
  { to: '/budget', label: '예산', icon: DollarSign },
  { to: '/checklist', label: '체크', icon: CheckSquare },
  { to: '/map', label: '지도', icon: Map },
];

const PULL_THRESHOLD = 72;

export function Layout() {
  const { trips, activeTrip, joinByCode } = useTravelStore();
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];

  const mainRef = useRef<HTMLElement>(null);
  const startYRef = useRef(0);
  const [pullPx, setPullPx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function onTouchStart(e: React.TouchEvent) {
    if ((mainRef.current?.scrollTop ?? 1) === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!startYRef.current) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0 && (mainRef.current?.scrollTop ?? 1) === 0) {
      setPullPx(Math.min(delta * 0.5, PULL_THRESHOLD));
    } else {
      startYRef.current = 0;
      setPullPx(0);
    }
  }

  async function onTouchEnd() {
    const triggered = pullPx >= PULL_THRESHOLD;
    startYRef.current = 0;
    setPullPx(0);

    if (triggered && trip?.shareCode && !refreshing) {
      setRefreshing(true);
      await joinByCode(trip.shareCode);
      setRefreshing(false);
    }
  }

  const progress = Math.min(pullPx / PULL_THRESHOLD, 1);
  const showIndicator = pullPx > 8 || refreshing;

  return (
    <div className="app-shell">
      {/* Pull-to-refresh indicator */}
      {showIndicator && (
        <div
          className="fixed top-0 inset-x-0 max-w-lg mx-auto flex items-center justify-center z-30 pointer-events-none transition-all"
          style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + ${Math.min(pullPx, PULL_THRESHOLD)}px)` }}
        >
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${
            refreshing ? 'bg-slate-950 text-white' : progress >= 1 ? 'bg-sky-500 text-white' : 'border border-sky-100 bg-white text-sky-600'
          }`}>
            <RefreshCw
              size={13}
              className={refreshing ? 'animate-spin' : ''}
              style={{ transform: `rotate(${progress * 360}deg)` }}
            />
            {refreshing ? '최신 데이터 가져오는 중…' : progress >= 1 ? '놓아서 새로고침' : '당겨서 새로고침'}
          </div>
        </div>
      )}

      {/* Content area */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto pb-safe"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Outlet />
      </main>

      <div className="comparison-badge" aria-label="UX 리뉴얼 Preview 배포본">
        UX 리뉴얼 Preview
      </div>

      {/* Bottom Navigation — z-40 so modals (z-50) render above it */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t border-slate-200/80 bg-white/90 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl safe-bottom">
        <div className="flex h-16 items-stretch px-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? 'text-slate-950' : 'text-slate-400 active:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`rounded-xl p-1.5 transition-colors ${isActive ? 'bg-sky-50 text-sky-600' : ''}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
