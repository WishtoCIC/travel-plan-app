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

function ShareHandler() {
  const { addTrip, setActiveTrip } = useTravelStore();
  useEffect(() => {
    const shared = getTripFromUrlHash();
    if (shared) {
      const id = addTrip({ ...shared });
      setActiveTrip(id);
      // Clean up URL hash after import
      window.history.replaceState(null, '', window.location.pathname);
      alert(`"${shared.title}" 여행 계획을 불러왔어요! ✅`);
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ShareHandler />
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
    </BrowserRouter>
  );
}
