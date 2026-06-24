import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, DollarSign, CheckSquare, Map } from 'lucide-react';

const navItems = [
  { to: '/', label: '홈', icon: Home, end: true },
  { to: '/itinerary', label: '일정', icon: List },
  { to: '/budget', label: '예산', icon: DollarSign },
  { to: '/checklist', label: '체크', icon: CheckSquare },
  { to: '/map', label: '지도', icon: Map },
];

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-lg mx-auto relative">
      {/* Content area with bottom nav padding */}
      <main className="flex-1 overflow-y-auto pb-safe">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-lg mx-auto safe-bottom">
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
