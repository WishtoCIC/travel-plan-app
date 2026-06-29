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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
    <div className="app-screen">
      {/* Header */}
      <div className="app-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="app-header-title">여행 일정</h1>
            <p className="app-header-subtitle">{trip.title} · {trip.itinerary.length}일</p>
          </div>
          <button
            onClick={addDay}
            className="primary-button px-3 py-2"
          >
            <Plus size={15} /> 날짜 추가
          </button>
        </div>
      </div>

      <div className="page-pad space-y-3">
        {trip.itinerary.map((day, idx) => {
          const isOpen = openDays.has(day.id);
          const bookedCount = day.items.filter((i) => i.status === 'booked').length;
          return (
            <div key={day.id} className="surface-card overflow-hidden">
              {/* Day header */}
              <div className="flex items-center">
                <button
                  onClick={() => toggleDay(day.id)}
                  className="flex-1 flex items-center gap-3 px-4 py-3.5 text-left min-w-0 transition active:bg-slate-50"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-950">{formatDate(day.date)}</span>
                      {day.region && (
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-600">{day.region}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {day.items.length}개 일정 {bookedCount > 0 && `· 예약완료 ${bookedCount}개`}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={18} className="flex-shrink-0 text-slate-300" /> : <ChevronDown size={18} className="flex-shrink-0 text-slate-300" />}
                </button>
                <button
                  onClick={() => deleteDay(day.id)}
                  className="mr-2 flex-shrink-0 rounded-xl p-3 text-slate-300 active:bg-red-50 active:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Items */}
              {isOpen && (
                <div className="space-y-1 border-t border-slate-100 px-4 py-2">
                  {day.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 border-b border-slate-100 py-2.5 last:border-0">
                      <button
                        onClick={() => cycleStatus(day.id, item)}
                        className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 mt-0.5 ${STATUS_STYLE[item.status]}`}
                      >
                        {STATUS_LABEL[item.status]}
                      </button>
                      <div className="flex-1 min-w-0">
                        {item.time && (
                          <div className="mb-0.5 flex items-center gap-1 text-xs font-medium text-slate-400">
                            {item.time === '종일'
                              ? <><Sun size={11} />종일</>
                              : <><Clock size={11} />{item.time}</>}
                          </div>
                        )}
                        <p className="text-sm font-semibold text-slate-800">{item.activity}</p>
                        {item.location && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-400">
                            <MapPin size={11} />{item.location}
                          </div>
                        )}
                        {item.notes && <p className="mt-0.5 text-xs text-slate-400">{item.notes}</p>}
                        {item.bookingLink && (
                          <a href={item.bookingLink} target="_blank" rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-sky-600">
                            예약링크 <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditingItem({ dayId: day.id, item })}
                          className="rounded-xl p-2 text-slate-300 active:bg-sky-50 active:text-sky-500">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteItem(day.id, item.id)}
                          className="rounded-xl p-2 text-slate-300 active:bg-red-50 active:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setEditingItem({ dayId: day.id, item: { id: generateId(), activity: '', status: 'planned' } })}
                    className="flex w-full items-center gap-2 py-2.5 text-sm font-bold text-sky-600"
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
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50">
      <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-sheet shadow-2xl space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-black text-slate-950">일정 {isNew ? '추가' : '수정'}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400"><X size={20} /></button>
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
                isAllDay ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-500'
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
          <button onClick={onClose} className="secondary-button flex-1">취소</button>
          <button
            onClick={() => { if (form.activity.trim()) onSave(dayId, form); }}
            className="primary-button flex-1"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'field-input';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-bold text-slate-500">{label}</label>{children}</div>;
}
