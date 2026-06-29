import { useState } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Clock, MapPin, ChevronDown, ChevronUp, X, Sun } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { formatDate, generateId } from '../utils/helpers';
import type { DayItinerary, ItineraryItem } from '../types/travel';

const STATUS_STYLE = {
  planned: 'bg-gray-100 text-gray-500',
  booked: 'bg-green-100 text-green-700',
  done: 'bg-blue-100 text-blue-600',
};
const STATUS_LABEL = { planned: '계획', booked: '예약완료', done: '완료' };

export function ItineraryPage() {
  const { trips, activeTrip, updateTrip } = useTravelStore();
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];
  const [openDays, setOpenDays] = useState<Set<string>>(new Set([trip?.itinerary[0]?.id ?? '']));
  const [editingItem, setEditingItem] = useState<{ dayId: string; item: ItineraryItem } | null>(null);

  if (!trip) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
      <div className="text-5xl mb-3">📅</div>
      <p className="text-sm">여행을 먼저 선택해주세요</p>
    </div>
  );

  function toggleDay(id: string) {
    setOpenDays((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function saveItem(dayId: string, item: ItineraryItem) {
    const itinerary = trip.itinerary.map((d) =>
      d.id !== dayId ? d : {
        ...d,
        items: d.items.some((i) => i.id === item.id)
          ? d.items.map((i) => i.id === item.id ? item : i)
          : [...d.items, item],
      }
    );
    updateTrip(trip.id, { itinerary });
    setEditingItem(null);
  }

  function deleteItem(dayId: string, itemId: string) {
    updateTrip(trip.id, {
      itinerary: trip.itinerary.map((d) =>
        d.id !== dayId ? d : { ...d, items: d.items.filter((i) => i.id !== itemId) }
      ),
    });
  }

  function addDay() {
    const lastDate = trip.itinerary.at(-1)?.date;
    const next = new Date(lastDate ?? trip.startDate);
    if (lastDate) next.setDate(next.getDate() + 1);
    const newDay: DayItinerary = { id: generateId(), date: next.toISOString().split('T')[0], region: '', items: [] };
    updateTrip(trip.id, { itinerary: [...trip.itinerary, newDay] });
    setOpenDays((prev) => new Set([...prev, newDay.id]));
  }

  function deleteDay(dayId: string) {
    updateTrip(trip.id, {
      itinerary: trip.itinerary.filter((d) => d.id !== dayId),
    });
  }

  function cycleStatus(dayId: string, item: ItineraryItem) {
    const order: ItineraryItem['status'][] = ['planned', 'booked', 'done'];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    saveItem(dayId, { ...item, status: next });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">여행 일정</h1>
            <p className="text-xs text-gray-400">{trip.title} · {trip.itinerary.length}일</p>
          </div>
          <button
            onClick={addDay}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-full text-sm font-medium"
          >
            <Plus size={15} /> 날짜 추가
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {trip.itinerary.map((day, idx) => {
          const isOpen = openDays.has(day.id);
          const bookedCount = day.items.filter((i) => i.status === 'booked').length;
          return (
            <div key={day.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Day header */}
              <div className="flex items-center">
                <button
                  onClick={() => toggleDay(day.id)}
                  className="flex-1 flex items-center gap-3 px-4 py-3.5 text-left min-w-0"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900">{formatDate(day.date)}</span>
                      {day.region && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">{day.region}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {day.items.length}개 일정 {bookedCount > 0 && `· 예약완료 ${bookedCount}개`}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={18} className="text-gray-300 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-300 flex-shrink-0" />}
                </button>
                <button
                  onClick={() => deleteDay(day.id)}
                  className="p-3 mr-2 text-gray-300 hover:text-red-500 active:bg-red-50 rounded-xl flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Items */}
              {isOpen && (
                <div className="border-t border-gray-50 px-4 py-2 space-y-1">
                  {day.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <button
                        onClick={() => cycleStatus(day.id, item)}
                        className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 mt-0.5 ${STATUS_STYLE[item.status]}`}
                      >
                        {STATUS_LABEL[item.status]}
                      </button>
                      <div className="flex-1 min-w-0">
                        {item.time && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                            {item.time === '종일'
                              ? <><Sun size={11} />종일</>
                              : <><Clock size={11} />{item.time}</>}
                          </div>
                        )}
                        <p className="text-sm text-gray-800 font-medium">{item.activity}</p>
                        {item.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <MapPin size={11} />{item.location}
                          </div>
                        )}
                        {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                        {item.bookingLink && (
                          <a href={item.bookingLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 font-medium mt-1">
                            예약링크 <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditingItem({ dayId: day.id, item })}
                          className="p-2 text-gray-300 hover:text-blue-500 rounded-xl active:bg-blue-50">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteItem(day.id, item.id)}
                          className="p-2 text-gray-300 hover:text-red-500 rounded-xl active:bg-red-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setEditingItem({ dayId: day.id, item: { id: generateId(), activity: '', status: 'planned' } })}
                    className="w-full flex items-center gap-2 py-2.5 text-blue-500 text-sm"
                  >
                    <Plus size={15} /> 일정 추가
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingItem && (
        <ItemModal
          dayId={editingItem.dayId}
          item={editingItem.item}
          onSave={saveItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function ItemModal({ dayId, item, onSave, onClose }: {
  dayId: string;
  item: ItineraryItem;
  onSave: (dayId: string, item: ItineraryItem) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ItineraryItem>({ ...item });
  const [isAllDay, setIsAllDay] = useState(item.time === '종일');
  const [hour, setHour] = useState(() => {
    if (!item.time || item.time === '종일') return '';
    return item.time.split(':')[0] ?? '';
  });
  const [minute, setMinute] = useState(() => {
    if (!item.time || item.time === '종일') return '00';
    return item.time.split(':')[1] ?? '00';
  });
  const set = (k: keyof ItineraryItem, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isNew = !item.activity;

  function toggleAllDay() {
    const next = !isAllDay;
    setIsAllDay(next);
    set('time', next ? '종일' : hour ? `${hour}:${minute}` : '');
  }

  function handleHourChange(h: string) {
    setHour(h);
    set('time', h ? `${h}:${minute}` : '');
  }

  function handleMinuteChange(m: string) {
    setMinute(m);
    if (hour) set('time', `${hour}:${m}`);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-5 pb-sheet space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-gray-900">일정 {isNew ? '추가' : '수정'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 rounded-full"><X size={20} /></button>
        </div>
        <Field label="활동 *">
          <input className={inputCls} value={form.activity} onChange={(e) => set('activity', e.target.value)} placeholder="예: 초콜릿힐 투어" autoFocus />
        </Field>
        <Field label="시간">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={toggleAllDay}
              className={`flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium border flex-shrink-0 transition-colors ${
                isAllDay ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}
            >
              <Sun size={14} /> 종일
            </button>
            {!isAllDay && (
              <>
                <select
                  className={inputCls}
                  value={hour}
                  onChange={(e) => handleHourChange(e.target.value)}
                >
                  <option value="">시</option>
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((h) => (
                    <option key={h} value={h}>{h}시</option>
                  ))}
                </select>
                <select
                  className={inputCls}
                  value={minute}
                  onChange={(e) => handleMinuteChange(e.target.value)}
                  disabled={!hour}
                >
                  <option value="00">00분</option>
                  <option value="30">30분</option>
                </select>
              </>
            )}
          </div>
        </Field>
        <Field label="상태">
          <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value as ItineraryItem['status'])}>
            <option value="planned">계획</option>
            <option value="booked">예약완료</option>
            <option value="done">완료</option>
          </select>
        </Field>
        <Field label="장소">
          <input className={inputCls} value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="장소명" />
        </Field>
        <Field label="예약 링크">
          <input className={inputCls} type="url" value={form.bookingLink ?? ''} onChange={(e) => set('bookingLink', e.target.value)} placeholder="https://" />
        </Field>
        <Field label="메모">
          <textarea className={inputCls} rows={2} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} placeholder="추가 메모" />
        </Field>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm text-gray-600 font-medium">취소</button>
          <button
            onClick={() => { if (form.activity.trim()) onSave(dayId, form); }}
            className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-sm font-semibold"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>{children}</div>;
}
