import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, DollarSign, CheckSquare, Plane, ChevronRight, ExternalLink, Settings, RefreshCw } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { formatKRW, getDaysBetween, formatDate } from '../utils/helpers';
import heroImage from '../assets/hero.png';

export function Dashboard() {
  const { trips, activeTrip, setActiveTrip, addTrip, joinByCode, syncStatus } = useTravelStore();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];

  const today = new Date();
  const startDate = trip ? new Date(trip.startDate) : null;
  const daysUntil = startDate ? Math.ceil((startDate.getTime() - today.getTime()) / 86400000) : null;

  const totalKRW = trip?.expenses.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const checkedCount = trip?.checklist.filter((c) => c.done).length ?? 0;
  const totalChecklist = trip?.checklist.length ?? 0;
  const pendingBookings = trip?.bookings.filter((b) => b.status === 'pending') ?? [];

  async function handleRefresh() {
    if (!trip?.shareCode || refreshing) return;
    setRefreshing(true);
    await joinByCode(trip.shareCode);
    setRefreshing(false);
  }

  function handleNewTrip() {
    const id = addTrip({
      title: '새 여행',
      destination: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      travelers: [],
      baseCurrency: 'KRW',
      itinerary: [],
      expenses: [],
      checklist: [],
      bookings: [],
      locations: [],
    });
    setActiveTrip(id);
    navigate('/settings');
  }

  return (
    <div className="app-screen">
      {/* Header */}
      <div className="app-header flex items-center justify-between">
        <div>
          <h1 className="app-header-title">TravelPlan</h1>
          <p className="app-header-subtitle">내 여행 계획</p>
        </div>
        <div className="flex gap-2">
          {trip?.cloudEnabled && (
            <button
              onClick={handleRefresh}
              className="icon-button"
              title="최신 데이터 가져오기"
            >
              <RefreshCw size={17} className={refreshing || syncStatus === 'syncing' ? 'animate-spin text-sky-500' : ''} />
            </button>
          )}
          <button
            onClick={handleNewTrip}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm shadow-slate-300 transition active:scale-95"
            title="새 여행 추가"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="icon-button"
            title="설정"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="page-pad space-y-4">

        {/* Trip selector chips */}
        {trips.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTrip(t.id)}
                className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${
                  t.id === activeTrip
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {t.coverEmoji} {t.title}
              </button>
            ))}
          </div>
        )}

        {trip ? (
          <>
            {/* Hero card */}
            <div className="relative overflow-hidden rounded-xl bg-slate-950 p-5 text-white shadow-lg shadow-slate-300/70">
              <div
                className="pointer-events-none absolute -bottom-9 -right-5 h-44 w-44 bg-contain bg-center bg-no-repeat opacity-55"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
              <div className="relative flex items-start justify-between">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="mb-3 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-bold text-sky-100">
                    {trip.coverEmoji ?? '✈️'} {getDaysBetween(trip.startDate, trip.endDate) + 1}일 여정
                  </div>
                  <h2 className="text-2xl font-black leading-tight tracking-normal">{trip.title}</h2>
                  <p className="mt-2 text-sm font-medium text-slate-200">{trip.destination}</p>
                  <p className="mt-1 text-xs font-medium text-slate-300">
                    {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                    &nbsp;({getDaysBetween(trip.startDate, trip.endDate)}박 {getDaysBetween(trip.startDate, trip.endDate) + 1}일)
                  </p>
                </div>
                {daysUntil !== null && daysUntil > 0 && (
                  <div className="ml-3 flex-shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur">
                    <div className="text-4xl font-black leading-none">{daysUntil}</div>
                    <div className="mt-1 text-xs font-bold text-slate-300">일 후 출발</div>
                  </div>
                )}
                {daysUntil !== null && daysUntil <= 0 && daysUntil >= -getDaysBetween(trip.startDate, trip.endDate) && (
                  <div className="ml-3 flex-shrink-0 rounded-xl bg-white/15 px-3 py-2 text-center">
                    <div className="text-sm font-bold">여행 중!</div>
                    <div className="text-xs text-slate-300">즐거운 여행</div>
                  </div>
                )}
              </div>

              <div className="relative mt-5 flex flex-wrap items-center gap-1.5">
                {trip.travelers.map((t, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs font-bold text-white">{t}</span>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Calendar size={18} className="text-blue-500" />}
                label="여행 일정"
                value={`${trip.itinerary.length}일`}
                sub={`활동 ${trip.itinerary.reduce((s, d) => s + d.items.length, 0)}개`}
                color="blue"
                onClick={() => navigate('/itinerary')}
              />
              <StatCard
                icon={<DollarSign size={18} className="text-emerald-500" />}
                label="총 지출"
                value={formatKRW(totalKRW)}
                sub={trip.budget ? `예산 ${formatKRW(trip.budget)}` : '예산 미설정'}
                color="emerald"
                onClick={() => navigate('/budget')}
              />
              <StatCard
                icon={<CheckSquare size={18} className="text-orange-500" />}
                label="체크리스트"
                value={`${checkedCount}/${totalChecklist}`}
                sub={`${totalChecklist - checkedCount}개 남음`}
                color="orange"
                onClick={() => navigate('/checklist')}
              />
              <StatCard
                icon={<Plane size={18} className="text-purple-500" />}
                label="예약 대기"
                value={`${pendingBookings.length}건`}
                sub="확정 필요"
                color="purple"
                onClick={() => navigate('/budget')}
              />
            </div>

            {/* Pending bookings alert */}
            {pendingBookings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-amber-700">예약 필요</span>
                </div>
                <div className="space-y-2">
                  {pendingBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-900">{b.label}</span>
                      {b.url && (
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700"
                        >
                          예약 <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary preview */}
            <div className="surface-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-800">일정 미리보기</h3>
                <button onClick={() => navigate('/itinerary')} className="flex items-center gap-0.5 text-xs font-bold text-sky-600">
                  전체 <ChevronRight size={13} />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {trip.itinerary.slice(0, 4).map((day, idx) => (
                  <button key={day.id} className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-slate-50" onClick={() => navigate('/itinerary')}>
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-black text-sky-600">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">{formatDate(day.date)}</span>
                        <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-xs font-bold text-sky-600">{day.region}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-slate-700">{day.items.map((i) => i.activity).join(' · ')}</p>
                    </div>
                    <ChevronRight size={15} className="flex-shrink-0 text-slate-300" />
                  </button>
                ))}
                {trip.itinerary.length > 4 && (
                  <div className="px-4 py-3 text-center text-xs font-medium text-slate-400">
                    +{trip.itinerary.length - 4}일 더 있음
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="font-bold text-slate-600">아직 여행이 없어요</p>
            <p className="mt-1 text-sm text-slate-400">+ 버튼을 눌러 새 여행을 추가하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, color, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: 'blue' | 'emerald' | 'orange' | 'purple';
  onClick?: () => void;
}) {
  const bg = { blue: 'bg-sky-50', emerald: 'bg-emerald-50', orange: 'bg-orange-50', purple: 'bg-violet-50' }[color];
  return (
    <button
      onClick={onClick}
      className="surface-card w-full p-4 text-left transition active:scale-[0.98]"
    >
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
      <div className="mb-0.5 text-xs font-bold text-slate-400">{label}</div>
      <div className="text-lg font-black text-slate-950">{value}</div>
      <div className="mt-0.5 text-xs font-medium text-slate-400">{sub}</div>
    </button>
  );
}
