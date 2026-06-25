import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ItineraryPage } from './pages/ItineraryPage';
import { BudgetPage } from './pages/BudgetPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { MapPage } from './pages/MapPage';
import { SettingsPage } from './pages/SettingsPage';
import { useTravelStore } from './store/travelStore';
import { getTripFromUrlHash } from './utils/share';
import { useRealtimeSync } from './lib/useRealtimeSync';

function AppCore() {
  const { addTrip, setActiveTrip, joinByCode } = useTravelStore();
  useRealtimeSync();

  useEffect(() => {
    // ?code=XXXXX 로 접속하면 클라우드에서 여행 자동 로드
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      joinByCode(code).then((result) => {
        if (result === 'ok') {
          window.history.replaceState(null, '', window.location.pathname);
        } else if (result === 'not_found') {
          alert(`"${code}" 코드를 찾을 수 없어요. 코드를 확인해주세요.`);
        }
      });
      return;
    }

    // #share= 해시 방식 (구 방식) 호환
    const shared = getTripFromUrlHash();
    if (shared) {
      const id = addTrip({ ...shared });
      setActiveTrip(id);
      window.history.replaceState(null, '', window.location.pathname);
      alert(`"${shared.title}" 여행 계획을 불러왔어요! ✅`);
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="itinerary" element={<ItineraryPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="checklist" element={<ChecklistPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppCore />
    </BrowserRouter>
  );
}
