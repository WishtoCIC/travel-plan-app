import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, DollarSign, CheckSquare, Plane, ChevronRight, ExternalLink, Settings } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { formatKRW, getDaysBetween, formatDate } from '../utils/helpers';

export function Dashboard() {
  const { trips, activeTrip, setActiveTrip, addTrip } = useTravelStore();
  const navigate = useNavigate();
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];

  const today = new Date();
  const startDate = trip ? new Date(trip.startDate) : null;
  const daysUntil = startDate ? Math.ceil((startDate.getTime() - today.getTime()) / 86400000) : null;

  const totalKRW = trip?.expenses.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const checkedCount = trip?.checklist.filter((c) => c.done).length ?? 0;
  const totalChecklist = trip?.checklist.length ?? 0;
  const pendingBookings = trip?.bookings.filter((b) => b.status === 'pending') ?? [];

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 flex items-center justify-between border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">TravelPlan ✈️</h1>
          <p className="text-xs text-gray-400 mt-0.5">내 여행 계획</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNewTrip}
            className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Trip selector chips */}
        {trips.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTrip(t.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  t.id === activeTrip
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200'
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
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-4xl mb-2">{trip.coverEmoji ?? '✈️'}</div>
                  <h2 className="text-lg font-bold leading-tight">{trip.title}</h2>
                  <p className="text-blue-100 text-sm mt-1">{trip.destination}</p>
                  <p className="text-blue-100 text-xs mt-1">
                    {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                    &nbsp;({getDaysBetween(trip.startDate, trip.endDate)}박 {getDaysBetween(trip.startDate, trip.endDate) + 1}일)
                  </p>
                </div>
                {daysUntil !== null && daysUntil > 0 && (
                  <div className="text-right ml-3 flex-shrink-0">
                    <div className="text-4xl font-black leading-none">{daysUntil}</div>
                    <div className="text-blue-100 text-xs mt-1">일 후 출발</div>
                  </div>
                )}
                {daysUntil !== null && daysUntil <= 0 && daysUntil >= -getDaysBetween(trip.startDate, trip.endDate) && (
                  <div className="bg-white/20 rounded-xl px-3 py-2 text-center ml-3 flex-shrink-0">
                    <div className="text-sm font-bold">여행 중!</div>
                    <div className="text-xs text-blue-100">즐거운 여행 ✨</div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-1 flex-wrap">
                {trip.travelers.map((t, i) => (
                  <span key={i} className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{t}</span>
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
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-500 font-bold text-sm">⚠️ 예약 필요</span>
                </div>
                <div className="space-y-2">
                  {pendingBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <span className="text-sm text-amber-800">{b.label}</span>
                      {b.url && (
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-white px-2.5 py-1 rounded-full border border-blue-200"
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
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">일정 미리보기</h3>
                <button onClick={() => navigate('/itinerary')} className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
                  전체 <ChevronRight size={13} />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {trip.itinerary.slice(0, 4).map((day, idx) => (
                  <div key={day.id} className="flex items-center gap-3 px-4 py-3" onClick={() => navigate('/itinerary')}>
                    <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{formatDate(day.date)}</span>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">{day.region}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5 truncate">{day.items.map((i) => i.activity).join(' · ')}</p>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                  </div>
                ))}
                {trip.itinerary.length > 4 && (
                  <div className="px-4 py-3 text-center text-xs text-gray-400">
                    +{trip.itinerary.length - 4}일 더 있음
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-gray-500 font-medium">아직 여행이 없어요</p>
            <p className="text-gray-400 text-sm mt-1">+ 버튼을 눌러 새 여행을 추가하세요</p>
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
  const bg = { blue: 'bg-blue-50', emerald: 'bg-emerald-50', orange: 'bg-orange-50', purple: 'bg-purple-50' }[color];
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-4 text-left active:scale-95 transition-transform w-full"
    >
      <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-2`}>{icon}</div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-base font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </button>
  );
}
