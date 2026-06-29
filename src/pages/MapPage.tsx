import { useState } from 'react';
import { Navigation, ExternalLink, Search } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import type { TravelLocation } from '../types/travel';

const TYPE_EMOJI: Record<string, string> = {
  hotel: '🏨', airport: '✈️', attraction: '🏛️', restaurant: '🍽️', port: '⛴️', other: '📍',
};
const TYPE_LABEL: Record<string, string> = {
  hotel: '숙소', airport: '공항', attraction: '관광지', restaurant: '맛집', port: '항구', other: '기타',
};
const TYPE_COLOR: Record<string, string> = {
  hotel: 'bg-purple-100 text-purple-700',
  airport: 'bg-blue-100 text-blue-700',
  attraction: 'bg-green-100 text-green-700',
  restaurant: 'bg-orange-100 text-orange-700',
  port: 'bg-cyan-100 text-cyan-700',
  other: 'bg-gray-100 text-gray-600',
};

const QUICK_LINKS = [
  { label: '🗺️ 구글 지도', base: 'https://www.google.com/maps/search/?api=1&query=' },
  { label: '🎫 Klook', base: 'https://www.klook.com/ko/search/?q=' },
  { label: '⭐ 트립어드바이저', base: 'https://www.tripadvisor.co.kr/Search?q=' },
];

export function MapPage() {
  const { trips, activeTrip } = useTravelStore();
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];
  const [selected, setSelected] = useState<TravelLocation | null>(null);
  const [search, setSearch] = useState('');

  if (!trip) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
      <div className="text-5xl mb-3">🗺️</div>
      <p className="text-sm">여행을 먼저 선택해주세요</p>
    </div>
  );

  const filtered = trip.locations.filter(
    (l) => !search || l.name.includes(search) || (l.address ?? '').includes(search)
  );

  function openGoogleMaps(loc: TravelLocation) {
    const q = loc.lat && loc.lng ? `${loc.lat},${loc.lng}` : encodeURIComponent(loc.address ?? loc.name);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  }

  function searchGoogleMaps() {
    const q = encodeURIComponent((search || trip.destination));
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  }

  const mapSrc = selected?.lat && selected?.lng
    ? `https://maps.google.com/maps?q=${selected.lat},${selected.lng}&z=14&output=embed`
    : trip.locations[0]?.lat && trip.locations[0]?.lng
    ? `https://maps.google.com/maps?q=${trip.locations[0].lat},${trip.locations[0].lng}&z=9&output=embed`
    : null;

  return (
    <div className="app-screen">
      {/* Header */}
      <div className="app-header">
        <h1 className="app-header-title">지도 & 장소</h1>
        <p className="app-header-subtitle">{trip.title} · {trip.locations.length}곳</p>
      </div>

      {/* Search bar */}
      <div className="px-5 py-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              className="field-input w-full pl-9"
              placeholder="장소 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchGoogleMaps()}
            />
          </div>
          <button onClick={searchGoogleMaps}
            className="primary-button px-3 py-2.5">
            <ExternalLink size={15} /> 구글맵
          </button>
        </div>
      </div>

      {/* Embedded map */}
      {mapSrc && (
        <div className="mb-3 px-5">
          <div className="h-52 overflow-hidden rounded-xl border border-slate-200 shadow-sm shadow-slate-200/70">
            <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="지도" />
          </div>
          {selected && (
            <div className="surface-card mt-2 flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-950">{TYPE_EMOJI[selected.type]} {selected.name}</p>
                {selected.address && <p className="max-w-56 truncate text-xs text-slate-400">{selected.address}</p>}
              </div>
              <button onClick={() => openGoogleMaps(selected)}
                className="ml-2 flex flex-shrink-0 items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">
                <Navigation size={12} /> 길찾기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Location list */}
      <div className="mb-4 space-y-2 px-5">
        {filtered.map((loc) => (
          <div
            key={loc.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(selected?.id === loc.id ? null : loc)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelected(selected?.id === loc.id ? null : loc);
              }
            }}
            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${selected?.id === loc.id ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'}`}
          >
            <span className="text-2xl flex-shrink-0">{TYPE_EMOJI[loc.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-950">{loc.name}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${TYPE_COLOR[loc.type]}`}>{TYPE_LABEL[loc.type]}</span>
              </div>
              {loc.address && <p className="mt-0.5 truncate text-xs text-slate-400">{loc.address}</p>}
              {loc.notes && <p className="mt-0.5 text-xs text-slate-500">{loc.notes}</p>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); openGoogleMaps(loc); }}
              className="flex-shrink-0 rounded-xl bg-white p-2 text-sky-500 active:text-sky-700"
              title={`${loc.name} 길찾기`}
            >
              <Navigation size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="px-5 pb-6">
        <p className="section-label mb-2">빠른 검색</p>
        <div className="space-y-2">
          {QUICK_LINKS.map(({ label, base }) => (
            <a
              key={label}
              href={`${base}${encodeURIComponent(trip.destination)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="surface-card flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 active:bg-slate-50"
            >
              {label}
              <ExternalLink size={14} className="text-slate-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
