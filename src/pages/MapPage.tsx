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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">지도 & 장소</h1>
        <p className="text-xs text-gray-400">{trip.title} · {trip.locations.length}곳</p>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="장소 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchGoogleMaps()}
            />
          </div>
          <button onClick={searchGoogleMaps}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-medium">
            <ExternalLink size={15} /> 구글맵
          </button>
        </div>
      </div>

      {/* Embedded map */}
      {mapSrc && (
        <div className="px-4 mb-3">
          <div className="h-48 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="지도" />
          </div>
          {selected && (
            <div className="mt-2 flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">{TYPE_EMOJI[selected.type]} {selected.name}</p>
                {selected.address && <p className="text-xs text-gray-400 truncate max-w-56">{selected.address}</p>}
              </div>
              <button onClick={() => openGoogleMaps(selected)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-medium flex-shrink-0 ml-2">
                <Navigation size={12} /> 길찾기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Location list */}
      <div className="px-4 space-y-2 mb-4">
        {filtered.map((loc) => (
          <button
            key={loc.id}
            onClick={() => setSelected(selected?.id === loc.id ? null : loc)}
            className={`w-full flex items-start gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${selected?.id === loc.id ? 'border-blue-400 bg-blue-50' : 'bg-white border-gray-100'}`}
          >
            <span className="text-2xl flex-shrink-0">{TYPE_EMOJI[loc.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900">{loc.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_COLOR[loc.type]}`}>{TYPE_LABEL[loc.type]}</span>
              </div>
              {loc.address && <p className="text-xs text-gray-400 mt-0.5 truncate">{loc.address}</p>}
              {loc.notes && <p className="text-xs text-gray-500 mt-0.5">{loc.notes}</p>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); openGoogleMaps(loc); }}
              className="flex-shrink-0 p-2 text-blue-400 active:text-blue-600 bg-blue-50 rounded-xl"
            >
              <Navigation size={15} />
            </button>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="px-4 pb-6">
        <p className="text-xs font-semibold text-gray-400 mb-2">빠른 검색</p>
        <div className="space-y-2">
          {QUICK_LINKS.map(({ label, base }) => (
            <a
              key={label}
              href={`${base}${encodeURIComponent(trip.destination)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-gray-100 text-sm text-gray-700 active:bg-gray-50"
            >
              {label}
              <ExternalLink size={14} className="text-gray-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
