import { useState } from 'react';
import { Edit2, X } from 'lucide-react';
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
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

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
  function saveItem(item: ChecklistItem) {
    updateTrip(trip.id, {
      checklist: trip.checklist.map((c) => c.id === item.id ? item : c),
    });
    setActiveTab(item.category);
    setEditingItem(null);
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
          <CheckItem key={item.id} item={item} onToggle={toggle} onEdit={setEditingItem} onDelete={remove} />
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
          <CheckItem key={item.id} item={item} onToggle={toggle} onEdit={setEditingItem} onDelete={remove} />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">{CAT_EMOJI[activeTab]}</div>
            <p className="text-sm text-slate-400">항목이 없어요. 위에서 추가해보세요!</p>
          </div>
        )}
      </div>

      {editingItem && (
        <ChecklistModal
          item={editingItem}
          onSave={saveItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function CheckItem({ item, onToggle, onEdit, onDelete }: {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onEdit: (item: ChecklistItem) => void;
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
      <button onClick={() => onEdit(item)} className="flex-shrink-0 rounded-xl p-2 text-slate-300 active:text-sky-500">
        <Edit2 size={14} />
      </button>
      <button onClick={() => onDelete(item.id)} className="flex-shrink-0 rounded-xl p-2 text-slate-300 active:text-red-400">
        <X size={14} />
      </button>
    </div>
  );
}

function ChecklistModal({ item, onSave, onClose }: {
  item: ChecklistItem;
  onSave: (item: ChecklistItem) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ChecklistItem>({ ...item });

  function set<K extends keyof ChecklistItem>(key: K, value: ChecklistItem[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50">
      <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-sheet shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-950">체크 항목 수정</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="항목">
            <input
              className="field-input"
              value={form.text}
              onChange={(e) => set('text', e.target.value)}
              placeholder="예: 여권 챙기기"
              autoFocus
            />
          </Field>

          <Field label="분류">
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => set('category', category)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                    form.category === category
                      ? CAT_COLOR[category]
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {CAT_EMOJI[category]} {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="상태">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set('priority', form.priority === 'high' ? 'normal' : 'high')}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                  form.priority === 'high'
                    ? 'border-red-300 bg-red-50 text-red-500'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                ★ 중요
              </button>
              <button
                type="button"
                onClick={() => set('done', !form.done)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                  form.done
                    ? 'border-sky-300 bg-sky-50 text-sky-600'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                완료
              </button>
            </div>
          </Field>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="secondary-button flex-1">취소</button>
            <button
              onClick={() => { if (form.text.trim()) onSave({ ...form, text: form.text.trim() }); }}
              className="primary-button flex-1"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-bold text-slate-500">{label}</label>{children}</div>;
}
