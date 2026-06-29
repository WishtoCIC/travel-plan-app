import { useState } from 'react';
import { X } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { generateId, CATEGORY_LABELS } from '../utils/helpers';
import type { ChecklistItem } from '../types/travel';

const CATEGORIES = ['before', 'pack', 'during', 'after'] as const;
const CAT_EMOJI: Record<string, string> = { before: '📋', pack: '🧳', during: '📍', after: '🏠' };
const CAT_COLOR: Record<string, string> = {
  before: 'text-blue-600 bg-blue-50 border-blue-200',
  pack: 'text-purple-600 bg-purple-50 border-purple-200',
  during: 'text-green-600 bg-green-50 border-green-200',
  after: 'text-gray-600 bg-gray-50 border-gray-200',
};

export function ChecklistPage() {
  const { trips, activeTrip, updateTrip } = useTravelStore();
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];
  const [activeTab, setActiveTab] = useState<ChecklistItem['category']>('before');
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'normal'>('normal');

  if (!trip) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
      <div className="text-5xl mb-3">✅</div>
      <p className="text-sm">여행을 먼저 선택해주세요</p>
    </div>
  );

  function toggle(id: string) {
    updateTrip(trip.id, {
      checklist: trip.checklist.map((c) => c.id === id ? { ...c, done: !c.done } : c),
    });
  }
  function remove(id: string) {
    updateTrip(trip.id, { checklist: trip.checklist.filter((c) => c.id !== id) });
  }
  function addItem() {
    if (!newText.trim()) return;
    updateTrip(trip.id, {
      checklist: [...trip.checklist, { id: generateId(), text: newText.trim(), done: false, category: activeTab, priority: newPriority }],
    });
    setNewText('');
    setNewPriority('normal');
  }

  const filtered = trip.checklist.filter((c) => c.category === activeTab);
  const pending = filtered.filter((c) => !c.done);
  const done = filtered.filter((c) => c.done);

  const allDone = trip.checklist.filter((c) => c.done).length;
  const allTotal = trip.checklist.length;
  const pct = allTotal > 0 ? Math.round((allDone / allTotal) * 100) : 0;

  return (
    <div className="app-screen">
      {/* Header */}
      <div className="app-header">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="app-header-title">체크리스트</h1>
            <p className="app-header-subtitle">{trip.title}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-slate-950">{pct}%</div>
            <div className="text-xs font-bold text-slate-400">{allDone}/{allTotal}</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-sky-500 transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-5 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const catItems = trip.checklist.filter((c) => c.category === cat);
            const catDone = catItems.filter((c) => c.done).length;
            return (
              <button key={cat} onClick={() => setActiveTab(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${activeTab === cat ? CAT_COLOR[cat] : 'border-slate-200 bg-white text-slate-400'}`}>
                {CAT_EMOJI[cat]} {CATEGORY_LABELS[cat]}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${catDone === catItems.length && catItems.length > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {catDone}/{catItems.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add item */}
      <div className="mb-3 flex gap-2 px-5">
        <input
          className="field-input flex-1"
          placeholder="새 항목 추가..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <button onClick={() => setNewPriority(p => p === 'high' ? 'normal' : 'high')}
          className={`rounded-xl border px-3 py-2.5 text-sm font-black transition-colors ${newPriority === 'high' ? 'border-red-300 bg-red-50 text-red-500' : 'border-slate-200 bg-white text-slate-400'}`}>
          ★
        </button>
        <button onClick={addItem} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">
          추가
        </button>
      </div>

      {/* List */}
      <div className="space-y-2 px-5 pb-6">
        {/* Pending items — high priority first */}
        {[...pending.filter((c) => c.priority === 'high'), ...pending.filter((c) => c.priority !== 'high')].map((item) => (
          <CheckItem key={item.id} item={item} onToggle={toggle} onDelete={remove} />
        ))}

        {/* Divider */}
        {done.length > 0 && (
          <div className="flex items-center gap-2 py-2">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold text-slate-400">완료 {done.length}개</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        )}

        {/* Done items */}
        {done.map((item) => (
          <CheckItem key={item.id} item={item} onToggle={toggle} onDelete={remove} />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">{CAT_EMOJI[activeTab]}</div>
            <p className="text-sm text-slate-400">항목이 없어요. 위에서 추가해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckItem({ item, onToggle, onDelete }: {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${item.done ? 'border border-slate-200 bg-slate-100' : 'surface-card'}`}>
      <button
        onClick={() => onToggle(item.id)}
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${item.done ? 'scale-95 border-sky-500 bg-sky-500' : 'border-slate-300'}`}
      >
        {item.done && <span className="text-white text-xs font-bold">✓</span>}
      </button>
      <span className={`flex-1 text-sm ${item.done ? 'text-slate-400 line-through' : item.priority === 'high' ? 'font-bold text-slate-950' : 'font-medium text-slate-700'}`}>
        {item.priority === 'high' && !item.done && <span className="text-red-500 mr-1.5">★</span>}
        {item.text}
      </span>
      <button onClick={() => onDelete(item.id)} className="flex-shrink-0 rounded-xl p-2 text-slate-300 active:text-red-400">
        <X size={14} />
      </button>
    </div>
  );
}
