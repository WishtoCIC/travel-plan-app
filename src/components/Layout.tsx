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
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-lg mx-auto relative">
      {/* Pull-to-refresh indicator */}
      {showIndicator && (
        <div
          className="fixed top-0 inset-x-0 max-w-lg mx-auto flex items-center justify-center z-30 pointer-events-none transition-all"
          style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + ${Math.min(pullPx, PULL_THRESHOLD)}px)` }}
        >
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
            refreshing ? 'bg-blue-600 text-white' : progress >= 1 ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border border-blue-100'
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

      {/* Bottom Navigation — z-40 so modals (z-50) render above it */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 max-w-lg mx-auto safe-bottom">
        <div className="flex items-stretch h-16">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400 active:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-blue-50' : ''}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
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
