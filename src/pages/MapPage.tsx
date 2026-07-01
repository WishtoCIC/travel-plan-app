import { useState } from 'react';
import { Navigation, ExternalLink, Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { generateId } from '../utils/helpers';
import type { QuickSearchLink, TravelLocation } from '../types/travel';

const LOCATION_TYPES: TravelLocation['type'][] = ['hotel', 'airport', 'attraction', 'restaurant', 'port', 'other'];

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

const DEFAULT_QUICK_LINKS: QuickSearchLink[] = [
  { id: 'quick1', label: '🗺️ 구글 지도', url: 'https://www.google.com/maps/search/?api=1&query={query}' },
  { id: 'quick2', label: '🎫 Klook', url: 'https://www.klook.com/ko/search/?q={query}' },
  { id: 'quick3', label: '⭐ 트립어드바이저', url: 'https://www.tripadvisor.co.kr/Search?q={query}' },
];

export function MapPage() {
  const { trips, activeTrip, updateTrip } = useTravelStore();
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];
  const [selected, setSelected] = useState<TravelLocation | null>(null);
  const [search, setSearch] = useState('');
  const [editingLocation, setEditingLocation] = useState<TravelLocation | null>(null);
  const [editingQuickLink, setEditingQuickLink] = useState<QuickSearchLink | null>(null);

  if (!trip) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
      <div className="text-5xl mb-3">🗺️</div>
      <p className="text-sm">여행을 먼저 선택해주세요</p>
    </div>
  );

  const filtered = trip.locations.filter(
    (l) => !search || l.name.includes(search) || (l.address ?? '').includes(search)
  );
  const quickLinks = trip.quickLinks ?? DEFAULT_QUICK_LINKS;

  function openGoogleMaps(loc: TravelLocation) {
    const q = loc.lat && loc.lng ? `${loc.lat},${loc.lng}` : encodeURIComponent(loc.address ?? loc.name);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  }

  function searchGoogleMaps() {
    const q = encodeURIComponent((search || trip.destination));
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  }

  function addLocation() {
    setEditingLocation({ id: generateId(), name: '', type: 'other' });
  }

  function saveLocation(location: TravelLocation) {
    const normalizedLocation = {
      ...location,
      name: location.name.trim(),
      address: location.address?.trim() || undefined,
      notes: location.notes?.trim() || undefined,
    };
    const exists = trip.locations.some((loc) => loc.id === normalizedLocation.id);
    const locations = exists
      ? trip.locations.map((loc) => loc.id === normalizedLocation.id ? normalizedLocation : loc)
      : [...trip.locations, normalizedLocation];

    updateTrip(trip.id, { locations });
    setSelected(normalizedLocation);
    setEditingLocation(null);
  }

  function deleteLocation(id: string) {
    updateTrip(trip.id, { locations: trip.locations.filter((loc) => loc.id !== id) });
    if (selected?.id === id) setSelected(null);
  }

  function buildQuickLinkUrl(link: QuickSearchLink) {
    const query = encodeURIComponent(search || trip.destination);
    return link.url.includes('{query}') ? link.url.replaceAll('{query}', query) : link.url;
  }

  function addQuickLink() {
    setEditingQuickLink({ id: generateId(), label: '', url: '' });
  }

  function saveQuickLink(link: QuickSearchLink) {
    const normalizedLink = {
      ...link,
      label: link.label.trim(),
      url: link.url.trim(),
    };
    if (!normalizedLink.label || !normalizedLink.url) return;

    const currentQuickLinks = trip.quickLinks ?? DEFAULT_QUICK_LINKS;
    const exists = currentQuickLinks.some((item) => item.id === normalizedLink.id);
    const quickLinks = exists
      ? currentQuickLinks.map((item) => item.id === normalizedLink.id ? normalizedLink : item)
      : [...currentQuickLinks, normalizedLink];

    updateTrip(trip.id, { quickLinks });
    setEditingQuickLink(null);
  }

  function deleteQuickLink(id: string) {
    const currentQuickLinks = trip.quickLinks ?? DEFAULT_QUICK_LINKS;
    updateTrip(trip.id, { quickLinks: currentQuickLinks.filter((link) => link.id !== id) });
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="app-header-title">지도 & 장소</h1>
            <p className="app-header-subtitle">{trip.title} · {trip.locations.length}곳</p>
          </div>
          <button onClick={addLocation} className="primary-button px-3 py-2">
            <Plus size={15} /> 장소 추가
          </button>
        </div>
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
            <button
              onClick={(e) => { e.stopPropagation(); setEditingLocation(loc); }}
              className="flex-shrink-0 rounded-xl bg-white p-2 text-slate-300 active:text-sky-500"
              title={`${loc.name} 수정`}
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteLocation(loc.id); }}
              className="flex-shrink-0 rounded-xl bg-white p-2 text-slate-300 active:text-red-500"
              title={`${loc.name} 삭제`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-10 text-center">
            <div className="mb-2 text-4xl">📍</div>
            <p className="text-sm text-slate-400">검색 결과가 없어요. 새 장소를 추가해보세요.</p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="px-5 pb-6">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="section-label">빠른 검색</p>
          <button onClick={addQuickLink} className="secondary-button px-3 py-1.5 text-xs">
            <Plus size={13} /> 추가
          </button>
        </div>
        <div className="space-y-2">
          {quickLinks.map((link) => (
            <div
              key={link.id}
              className="surface-card flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <a
                href={buildQuickLinkUrl(link)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center justify-between gap-3 active:text-sky-600"
              >
                <span className="truncate">{link.label}</span>
                <ExternalLink size={14} className="flex-shrink-0 text-slate-400" />
              </a>
              <button
                onClick={() => setEditingQuickLink(link)}
                className="flex-shrink-0 rounded-xl bg-white p-2 text-slate-300 active:text-sky-500"
                title={`${link.label} 수정`}
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => deleteQuickLink(link.id)}
                className="flex-shrink-0 rounded-xl bg-white p-2 text-slate-300 active:text-red-500"
                title={`${link.label} 삭제`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {quickLinks.length === 0 && (
            <div className="py-5 text-center text-sm text-slate-400">빠른 검색 링크가 없어요.</div>
          )}
        </div>
      </div>

      {editingLocation && (
        <LocationModal
          location={editingLocation}
          onSave={saveLocation}
          onClose={() => setEditingLocation(null)}
        />
      )}

      {editingQuickLink && (
        <QuickLinkModal
          link={editingQuickLink}
          onSave={saveQuickLink}
          onClose={() => setEditingQuickLink(null)}
        />
      )}
    </div>
  );
}

function LocationModal({ location, onSave, onClose }: {
  location: TravelLocation;
  onSave: (location: TravelLocation) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    ...location,
    latText: location.lat?.toString() ?? '',
    lngText: location.lng?.toString() ?? '',
  });
  const isNew = !location.name;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const lat = form.latText.trim() ? Number(form.latText) : undefined;
    const lng = form.lngText.trim() ? Number(form.lngText) : undefined;
    if (!form.name.trim()) return;
    if ((lat !== undefined && Number.isNaN(lat)) || (lng !== undefined && Number.isNaN(lng))) return;

    onSave({
      id: form.id,
      name: form.name,
      address: form.address,
      lat,
      lng,
      type: form.type,
      notes: form.notes,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-sheet shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-950">장소 {isNew ? '추가' : '수정'}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="장소명">
            <input
              className="field-input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="예: BE Grand Resort Bohol"
              autoFocus
            />
          </Field>

          <Field label="종류">
            <div className="grid grid-cols-3 gap-2">
              {LOCATION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('type', type)}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors ${
                    form.type === type
                      ? TYPE_COLOR[type]
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {TYPE_EMOJI[type]} {TYPE_LABEL[type]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="주소">
            <input
              className="field-input"
              value={form.address ?? ''}
              onChange={(e) => set('address', e.target.value)}
              placeholder="주소 또는 구글맵 검색어"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="위도">
              <input
                className="field-input"
                inputMode="decimal"
                value={form.latText}
                onChange={(e) => set('latText', e.target.value)}
                placeholder="9.548933"
              />
            </Field>
            <Field label="경도">
              <input
                className="field-input"
                inputMode="decimal"
                value={form.lngText}
                onChange={(e) => set('lngText', e.target.value)}
                placeholder="123.764619"
              />
            </Field>
          </div>

          <Field label="메모">
            <textarea
              className="field-input"
              rows={2}
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="체크인, 이동 팁 등"
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="secondary-button flex-1">취소</button>
            <button onClick={handleSave} className="primary-button flex-1">저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLinkModal({ link, onSave, onClose }: {
  link: QuickSearchLink;
  onSave: (link: QuickSearchLink) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(link);
  const isNew = !link.label;

  function set<K extends keyof QuickSearchLink>(key: K, value: QuickSearchLink[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.label.trim() || !form.url.trim()) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-sheet shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-950">빠른 검색 {isNew ? '추가' : '수정'}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="이름">
            <input
              className="field-input"
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
              placeholder="예: 🗺️ 구글 지도"
              autoFocus
            />
          </Field>

          <Field label="URL">
            <input
              className="field-input"
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder="https://www.google.com/maps/search/?api=1&query={query}"
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="secondary-button flex-1">취소</button>
            <button onClick={handleSave} className="primary-button flex-1">저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-bold text-slate-500">{label}</label>{children}</div>;
}
