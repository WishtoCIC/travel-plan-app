import { useState } from 'react';
import { Plus, Trash2, ExternalLink, X, ArrowLeftRight, Edit2, ArrowRight } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { formatKRW, formatCurrency, generateId, CATEGORY_LABELS, CURRENCY_SYMBOLS } from '../utils/helpers';
import type { Expense, BookingLink, Currency } from '../types/travel';

const CATEGORIES = ['flight', 'hotel', 'food', 'transport', 'activity', 'shopping', 'other'] as const;
const CURRENCIES: Currency[] = ['KRW', 'PHP', 'USD', 'JPY', 'THB', 'VND'];

const CAT_EMOJI: Record<string, string> = {
  flight: '✈️', hotel: '🏨', food: '🍽️', transport: '🚗', activity: '🎯', shopping: '🛍️', other: '📌',
};
const CAT_COLOR: Record<string, string> = {
  flight: 'bg-blue-100 text-blue-700',
  hotel: 'bg-purple-100 text-purple-700',
  food: 'bg-orange-100 text-orange-700',
  transport: 'bg-cyan-100 text-cyan-700',
  activity: 'bg-green-100 text-green-700',
  shopping: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-600',
};

const PAYER_OPTIONS = ['곰이', '옹이', '생활비', '기타'] as const;

const PAYER_COLOR: Record<string, string> = {
  곰이:   'bg-blue-100 text-blue-700',
  옹이:   'bg-rose-100 text-rose-700',
  생활비: 'bg-emerald-100 text-emerald-700',
  기타:   'bg-gray-100 text-gray-500',
};

type Tab = 'expenses' | 'bookings' | 'currency' | 'settlement';

export function BudgetPage() {
  const { trips, activeTrip, updateTrip, exchangeRates, setExchangeRate, convertAmount } = useTravelStore();
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];
  const [tab, setTab] = useState<Tab>('expenses');
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; expense?: Expense }>({ open: false });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [fromCur, setFromCur] = useState<Currency>('KRW');
  const [toCur, setToCur] = useState<Currency>('PHP');
  const [convertInput, setConvertInput] = useState('');

  if (!trip) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
      <div className="text-5xl mb-3">💰</div>
      <p className="text-sm">여행을 먼저 선택해주세요</p>
    </div>
  );

  const toKRW = (e: Expense) => convertAmount(e.amount, e.currency, 'KRW');
  const totalKRW = trip.expenses.reduce((s, e) => s + toKRW(e), 0);
  const budgetPct = trip.budget ? Math.min((totalKRW / trip.budget) * 100, 100) : 0;
  const byCategory = CATEGORIES.map((cat) => ({
    cat,
    total: trip.expenses.filter((e) => e.category === cat).reduce((s, e) => s + toKRW(e), 0),
  })).filter((x) => x.total > 0);

  // 지출처별 합계
  const byPayer = PAYER_OPTIONS.map((p) => ({
    payer: p,
    total: trip.expenses.filter((e) => (e.paidBy ?? '기타') === p).reduce((s, e) => s + toKRW(e), 0),
  }));
  const gomiTotal = byPayer.find((p) => p.payer === '곰이')?.total ?? 0;
  const ongiTotal = byPayer.find((p) => p.payer === '옹이')?.total ?? 0;
  const sharedTotal = (byPayer.find((p) => p.payer === '생활비')?.total ?? 0) + (byPayer.find((p) => p.payer === '기타')?.total ?? 0);
  const gomiResponsible = gomiTotal + sharedTotal / 2;
  const ongiResponsible = ongiTotal + sharedTotal / 2;
  const transferAmount = Math.abs(gomiResponsible - ongiResponsible);
  const transferFrom = gomiResponsible > ongiResponsible ? '옹이' : '곰이';
  const transferTo   = gomiResponsible > ongiResponsible ? '곰이' : '옹이';

  function saveExpense(e: Omit<Expense, 'id'>, id?: string) {
    if (id) {
      updateTrip(trip.id, { expenses: trip.expenses.map((ex) => ex.id === id ? { ...ex, ...e } : ex) });
    } else {
      updateTrip(trip.id, { expenses: [...trip.expenses, { ...e, id: generateId() }] });
    }
  }
  function deleteExpense(id: string) {
    updateTrip(trip.id, { expenses: trip.expenses.filter((e) => e.id !== id) });
  }
  function addBooking(b: Omit<BookingLink, 'id'>) {
    updateTrip(trip.id, { bookings: [...trip.bookings, { ...b, id: generateId() }] });
  }
  function toggleBooking(id: string) {
    updateTrip(trip.id, {
      bookings: trip.bookings.map((b) => b.id === id ? { ...b, status: b.status === 'booked' ? 'pending' : 'booked' } : b),
    });
  }
  function deleteBooking(id: string) {
    updateTrip(trip.id, { bookings: trip.bookings.filter((b) => b.id !== id) });
  }

  const converted = convertInput ? convertAmount(parseFloat(convertInput) || 0, fromCur, toCur) : null;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'expenses', label: '지출' },
    { key: 'bookings', label: '예약' },
    { key: 'currency', label: '환율' },
    { key: 'settlement', label: '정산' },
  ];

  return (
    <div className="app-screen">
      {/* Header */}
      <div className="app-header">
        <h1 className="app-header-title">예산 관리</h1>
        <p className="app-header-subtitle">{trip.title}</p>
      </div>

      {/* Budget summary card */}
      <div className="px-5 pt-4">
        <div className="mb-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm shadow-slate-200/70">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="section-label">총 지출</p>
              <p className="mt-1 text-3xl font-black tracking-normal text-slate-950">{formatKRW(totalKRW)}</p>
            </div>
            {trip.budget && (
              <div className="text-right">
                <p className="section-label">예산</p>
                <p className="mt-1 text-base font-black text-emerald-700">{formatKRW(trip.budget)}</p>
              </div>
            )}
          </div>
          {trip.budget && (
            <>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-all ${budgetPct >= 90 ? 'bg-red-400' : 'bg-emerald-500'}`}
                  style={{ width: `${budgetPct}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                잔여 {formatKRW(Math.max(trip.budget - totalKRW, 0))} ({Math.round(100 - budgetPct)}% 남음)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Tab */}
      <div className="px-5 mb-3">
        <div className="tab-shell">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`tab-button ${tab === key ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6">

        {/* EXPENSES */}
        {tab === 'expenses' && (
          <>
            {/* Category chips */}
            {byCategory.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {byCategory.map(({ cat, total }) => (
                  <span key={cat} className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${CAT_COLOR[cat]}`}>
                    {CAT_EMOJI[cat]} {CATEGORY_LABELS[cat]} {formatKRW(total)}
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-2 mb-4">
              {trip.expenses.map((e) => (
                <div key={e.id} className="surface-card flex items-center gap-3 px-4 py-3">
                  <span className="text-xl flex-shrink-0">{CAT_EMOJI[e.category]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="truncate text-sm font-semibold text-slate-800">{e.description}</p>
                      {e.paidBy && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${PAYER_COLOR[e.paidBy] ?? 'bg-gray-100 text-gray-500'}`}>
                          {e.paidBy}
                        </span>
                      )}
                    </div>
                    {e.notes && <p className="text-xs text-slate-400">{e.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-slate-950">{formatCurrency(e.amount, e.currency)}</p>
                    {e.currency !== 'KRW' && (
                      <p className="text-xs text-slate-400">≈{formatKRW(toKRW(e))}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => setExpenseModal({ open: true, expense: e })}
                      className="p-1.5 text-gray-300 active:text-blue-400">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteExpense(e.id)}
                      className="p-1.5 text-gray-300 active:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {trip.expenses.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-400">아직 지출 내역이 없어요</div>
              )}
            </div>
            <button
              onClick={() => setExpenseModal({ open: true })}
              className="primary-button w-full py-3.5"
            >
              <Plus size={18} /> 지출 추가
            </button>
          </>
        )}

        {/* BOOKINGS */}
        {tab === 'bookings' && (
          <>
            <div className="space-y-2 mb-4">
              {trip.bookings.map((b) => (
                <div key={b.id} className="surface-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleBooking(b.id)}
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${b.status === 'booked' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}
                    >
                      {b.status === 'booked' && <span className="text-white text-[10px] font-bold">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${b.status === 'booked' ? 'text-slate-500 line-through' : 'text-slate-950'}`}>{b.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${b.status === 'booked' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {b.status === 'booked' ? '예약완료' : '대기'}
                        </span>
                        {b.date && <span className="text-xs text-gray-400">{b.date}</span>}
                        {b.amount && <span className="text-xs font-semibold text-gray-700">{formatCurrency(b.amount, b.currency ?? 'KRW')}</span>}
                      </div>
                      {b.notes && <p className="text-xs text-gray-400 mt-0.5">{b.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {b.url && (
                        <a href={b.url} target="_blank" rel="noopener noreferrer"
                          className="p-2 text-blue-400 active:text-blue-600">
                          <ExternalLink size={15} />
                        </a>
                      )}
                      <button onClick={() => deleteBooking(b.id)} className="p-2 text-gray-300 active:text-red-400">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {trip.bookings.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-400">예약 내역이 없어요</div>
              )}
            </div>
            <button
              onClick={() => setShowBookingForm(true)}
              className="primary-button w-full py-3.5"
            >
              <Plus size={18} /> 예약 추가
            </button>
          </>
        )}

        {/* CURRENCY */}
        {tab === 'currency' && (
          <div className="space-y-4">
            <div className="surface-card p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-800">환율 계산기</h3>
              <input
                type="number"
                inputMode="decimal"
                className="field-input mb-3 py-3 text-center text-xl font-black"
                placeholder="금액 입력"
                value={convertInput}
                onChange={(e) => setConvertInput(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <select className="field-input flex-1"
                  value={fromCur} onChange={(e) => setFromCur(e.target.value as Currency)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c} {CURRENCY_SYMBOLS[c]}</option>)}
                </select>
                <button onClick={() => { setFromCur(toCur); setToCur(fromCur); }}
                  className="rounded-xl bg-slate-100 p-2.5 text-slate-500">
                  <ArrowLeftRight size={18} />
                </button>
                <select className="field-input flex-1"
                  value={toCur} onChange={(e) => setToCur(e.target.value as Currency)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c} {CURRENCY_SYMBOLS[c]}</option>)}
                </select>
              </div>
              {converted !== null && (
                <div className="mt-4 rounded-xl bg-sky-50 p-4 text-center">
                  <p className="mb-1 text-xs font-bold text-sky-500">{convertInput} {fromCur} =</p>
                  <p className="text-2xl font-black text-sky-700">
                    {CURRENCY_SYMBOLS[toCur]}{converted.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-xs font-bold text-sky-500">{toCur}</p>
                </div>
              )}
            </div>
            <div className="surface-card p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-800">환율 직접 설정</h3>
              <div className="space-y-3">
                {exchangeRates.filter((r) => r.from === 'KRW').map((r) => (
                  <RateRow key={`${r.from}-${r.to}`} rate={r} onChange={(v) => setExchangeRate(r.from, r.to, v)} />
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">탭하여 직접 수정</p>
            </div>
          </div>
        )}

        {/* SETTLEMENT 정산 */}
        {tab === 'settlement' && (
          <div className="space-y-4">
            {/* 지출처별 현황 */}
            <div className="surface-card overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="section-label">지출처별 현황</p>
              </div>
              <div className="divide-y divide-slate-100">
                {byPayer.map(({ payer, total }) => (
                  <div key={payer} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PAYER_COLOR[payer]}`}>{payer}</span>
                      {(payer === '생활비' || payer === '기타') && (
                        <span className="text-[10px] text-gray-400">공동 ÷ 2</span>
                      )}
                    </div>
                    <span className="text-sm font-black text-slate-950">{formatKRW(total)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                  <span className="text-xs font-bold text-slate-600">공동 합계 (생활비+기타)</span>
                  <span className="text-sm font-black text-slate-700">{formatKRW(sharedTotal)}</span>
                </div>
              </div>
            </div>

            {/* 최종 부담 */}
            <div className="surface-card overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="section-label">최종 부담액 (개인 + 공동÷2)</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">곰이</span>
                    <span className="text-xs text-gray-400">{formatKRW(gomiTotal)} + {formatKRW(sharedTotal / 2)}</span>
                  </div>
                  <span className="text-base font-black text-slate-950">{formatKRW(gomiResponsible)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">옹이</span>
                    <span className="text-xs text-gray-400">{formatKRW(ongiTotal)} + {formatKRW(sharedTotal / 2)}</span>
                  </div>
                  <span className="text-base font-black text-slate-950">{formatKRW(ongiResponsible)}</span>
                </div>
              </div>
            </div>

            {/* 이체 정산 */}
            <div className={`rounded-xl p-5 ${transferAmount > 0 ? 'bg-slate-950' : 'bg-slate-100'}`}>
              {transferAmount > 0 ? (
                <>
                  <p className="mb-3 text-xs font-bold text-sky-200">정산 이체</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-center">
                      <p className="text-white/70 text-xs mb-1">이체자</p>
                      <p className="text-white text-lg font-black">{transferFrom}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-white text-xl font-black">{formatKRW(transferAmount)}</p>
                      <ArrowRight size={20} className="text-sky-200" />
                    </div>
                    <div className="text-center">
                      <p className="text-white/70 text-xs mb-1">수취자</p>
                      <p className="text-white text-lg font-black">{transferTo}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="py-2 text-center text-sm font-semibold text-slate-500">지출 내역을 추가하면 정산 금액이 계산됩니다</p>
              )}
            </div>

            <p className="px-4 text-center text-xs text-slate-400">
              생활비·기타는 공동 지출로 반반 부담 계산됩니다
            </p>
          </div>
        )}
      </div>

      {expenseModal.open && (
        <ExpenseModal
          existing={expenseModal.expense}
          onSave={(e, id) => { saveExpense(e, id); setExpenseModal({ open: false }); }}
          onClose={() => setExpenseModal({ open: false })}
        />
      )}
      {showBookingForm && <BookingModal onSave={(b) => { addBooking(b); setShowBookingForm(false); }} onClose={() => setShowBookingForm(false)} />}
    </div>
  );
}

function RateRow({ rate, onChange }: { rate: { from: string; to: string; rate: number }; onChange: (r: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(rate.rate));
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-600">1 {rate.from} → {rate.to}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input className="w-24 rounded-xl border border-sky-300 bg-sky-50 px-2 py-1.5 text-right text-sm"
            value={val} onChange={(e) => setVal(e.target.value)} autoFocus
            onBlur={() => { onChange(parseFloat(val) || rate.rate); setEditing(false); }}
            onKeyDown={(e) => e.key === 'Enter' && (onChange(parseFloat(val) || rate.rate), setEditing(false))}
          />
          <span className="text-xs text-slate-400">{rate.to}</span>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="rounded-xl bg-slate-50 px-3 py-1 text-sm font-bold text-slate-950">
          {rate.rate} {rate.to}
        </button>
      )}
    </div>
  );
}

function ExpenseModal({ existing, onSave, onClose }: {
  existing?: Expense;
  onSave: (e: Omit<Expense, 'id'>, id?: string) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Expense, 'id'>>(
    existing
      ? { date: existing.date, category: existing.category, description: existing.description, amount: existing.amount, currency: existing.currency, paidBy: existing.paidBy ?? '곰이', notes: existing.notes }
      : { date: new Date().toISOString().split('T')[0], category: 'other', description: '', amount: 0, currency: 'KRW', paidBy: '곰이' }
  );
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!existing;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-sheet shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-950">{isEdit ? '지출 수정' : '지출 추가'}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400"><X size={20} /></button>
        </div>

        <Field label="내용">
          <input className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="항공권, 숙소 등" autoFocus />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="금액">
            <input type="number" inputMode="decimal" className={inputCls} value={form.amount || ''} onChange={(e) => set('amount', parseFloat(e.target.value) || 0)} />
          </Field>
          <Field label="통화">
            <select className={inputCls} value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <Field label="지출처">
          <div className="flex gap-2">
            {PAYER_OPTIONS.map((p) => (
              <button key={p} onClick={() => set('paidBy', p)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors ${form.paidBy === p ? `border-transparent ${PAYER_COLOR[p]}` : 'border-slate-200 bg-white text-slate-500'}`}>
                {p}
              </button>
            ))}
          </div>
        </Field>

        <Field label="카테고리">
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => set('category', c)}
                className={`rounded-xl border py-2 text-xs font-bold transition-colors ${form.category === c ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
                {CAT_EMOJI[c]}<br />{CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="날짜">
          <input type="date" className={inputCls} value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="메모">
          <input className={inputCls} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="secondary-button flex-1">취소</button>
          <button
            onClick={() => { if (form.description && form.amount) onSave(form, existing?.id); }}
            className="primary-button flex-1"
          >
            {isEdit ? '수정 완료' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingModal({ onSave, onClose }: { onSave: (b: Omit<BookingLink, 'id'>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Omit<BookingLink, 'id'>>({ label: '', url: '', type: 'other', status: 'pending', currency: 'KRW' });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const TYPES = [['flight', '✈️ 항공'], ['hotel', '🏨 숙소'], ['ferry', '⛴️ 페리'], ['tour', '🎯 투어'], ['other', '📌 기타']] as const;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-sheet shadow-2xl space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-base font-black text-slate-950">예약 추가</h2><button onClick={onClose} className="rounded-xl p-2 text-slate-400"><X size={20} /></button></div>
        <Field label="예약명"><input className={inputCls} value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="OceanJet 페리 예약" autoFocus /></Field>
        <Field label="종류">
          <div className="flex gap-1.5 flex-wrap">
            {TYPES.map(([t, l]) => (
              <button key={t} onClick={() => set('type', t)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${form.type === t ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="예약 URL"><input type="url" className={inputCls} value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="날짜"><input type="date" className={inputCls} value={form.date ?? ''} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label="금액"><input type="number" inputMode="decimal" className={inputCls} value={form.amount ?? ''} onChange={(e) => set('amount', parseFloat(e.target.value) || undefined)} /></Field>
        </div>
        <Field label="메모"><input className={inputCls} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="secondary-button flex-1">취소</button>
          <button onClick={() => { if (form.label) onSave(form); }} className="primary-button flex-1">저장</button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'field-input';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-bold text-slate-500">{label}</label>{children}</div>;
}
