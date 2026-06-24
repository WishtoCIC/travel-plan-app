import { useState } from 'react';
import { Save, Download, Upload, Share2, Trash2, ChevronRight, Info } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { exportTripAsFile, importTripFromFile, shareText, encodeTripToShareCode } from '../utils/share';
import type { Currency } from '../types/travel';

const CURRENCIES: Currency[] = ['KRW', 'PHP', 'USD', 'JPY', 'THB', 'VND'];

export function SettingsPage() {
  const { trips, activeTrip, updateTrip, deleteTrip, setActiveTrip, addTrip } = useTravelStore();
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];
  const [saved, setSaved] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [showShareInfo, setShowShareInfo] = useState(false);

  const [form, setForm] = useState({
    title: trip?.title ?? '',
    destination: trip?.destination ?? '',
    description: trip?.description ?? '',
    startDate: trip?.startDate ?? '',
    endDate: trip?.endDate ?? '',
    baseCurrency: (trip?.baseCurrency ?? 'KRW') as Currency,
    budget: trip?.budget ?? ('' as number | string),
    travelers: trip?.travelers.join(', ') ?? '',
    coverEmoji: trip?.coverEmoji ?? '✈️',
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  function save() {
    if (!trip) return;
    updateTrip(trip.id, {
      title: form.title,
      destination: form.destination,
      description: form.description,
      startDate: form.startDate,
      endDate: form.endDate,
      baseCurrency: form.baseCurrency,
      budget: form.budget ? Number(form.budget) : undefined,
      travelers: form.travelers.split(',').map((s) => s.trim()).filter(Boolean),
      coverEmoji: form.coverEmoji,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExport() {
    if (!trip) return;
    exportTripAsFile(trip);
    setShareMsg('📥 파일이 다운로드됐어요. 카카오톡으로 파일 공유 가능!');
    setTimeout(() => setShareMsg(''), 4000);
  }

  async function handleImport() {
    try {
      const imported = await importTripFromFile();
      const id = addTrip({ ...imported, id: undefined as unknown as string } as Parameters<typeof addTrip>[0]);
      setActiveTrip(id);
      setShareMsg('✅ 여행 데이터를 불러왔어요!');
      setTimeout(() => setShareMsg(''), 3000);
    } catch (e) {
      setShareMsg('❌ 파일을 읽을 수 없어요. 올바른 여행 파일인지 확인해주세요.');
      setTimeout(() => setShareMsg(''), 3000);
    }
  }

  async function handleShareCode() {
    if (!trip) return;
    try {
      const code = encodeTripToShareCode(trip);
      const shareUrl = `${window.location.origin}${window.location.pathname}#share=${code}`;
      const result = await shareText(trip.title, `${trip.title} 여행 계획을 공유합니다`, shareUrl);
      setShareMsg(result === 'shared' ? '✅ 공유했어요!' : '📋 링크가 복사됐어요! (붙여넣기로 공유)');
    } catch {
      setShareMsg('❌ 공유에 실패했어요. 파일 내보내기를 이용해보세요.');
    }
    setTimeout(() => setShareMsg(''), 4000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">설정</h1>
        <p className="text-xs text-gray-400">여행 정보 및 공유</p>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Trip selector */}
        {trips.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-500">여행 선택</p>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {trips.map((t) => (
                <button key={t.id} onClick={() => {
                  setActiveTrip(t.id);
                  setForm({ title: t.title, destination: t.destination, description: t.description ?? '', startDate: t.startDate, endDate: t.endDate, baseCurrency: t.baseCurrency, budget: t.budget ?? '', travelers: t.travelers.join(', '), coverEmoji: t.coverEmoji ?? '✈️' });
                }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${t.id === activeTrip ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {t.coverEmoji} {t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Share / Export section */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">공유 & 백업</p>
            <button onClick={() => setShowShareInfo(!showShareInfo)} className="text-gray-400">
              <Info size={15} />
            </button>
          </div>

          {showShareInfo && (
            <div className="mx-4 my-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-800 space-y-1.5">
              <p className="font-semibold">📌 데이터 공유 방식 안내</p>
              <p>• <strong>이 앱은 데이터를 내 폰에만 저장</strong>해요 (로컬 저장소)</p>
              <p>• 링크만 공유하면 상대방은 빈 화면을 봅니다</p>
              <p>• <strong>파일 내보내기</strong> → 카카오톡/이메일로 JSON 파일 공유</p>
              <p>• <strong>링크 공유</strong> → 여행 데이터가 링크에 포함됨 (작은 여행에 적합)</p>
              <p>• 받은 사람은 <strong>파일 가져오기</strong>로 데이터 불러오기</p>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            <SettingRow icon={<Download size={18} className="text-blue-500" />} label="파일로 내보내기" sub="JSON 파일 저장 후 카카오톡 등으로 공유" onClick={handleExport} />
            <SettingRow icon={<Upload size={18} className="text-green-500" />} label="파일 가져오기" sub="공유받은 JSON 파일로 여행 불러오기" onClick={handleImport} />
            <SettingRow icon={<Share2 size={18} className="text-purple-500" />} label="링크로 공유" sub="데이터가 담긴 링크 생성 (소규모 여행 권장)" onClick={handleShareCode} />
          </div>

          {shareMsg && (
            <div className="mx-4 mb-3 mt-1 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 text-center font-medium">
              {shareMsg}
            </div>
          )}
        </div>

        {/* Trip form */}
        {trip && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-500">여행 정보 수정</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <Field label="이모지">
                  <input className={inputCls + ' text-center text-xl'} value={form.coverEmoji} onChange={(e) => set('coverEmoji', e.target.value)} maxLength={2} />
                </Field>
                <div className="col-span-3">
                  <Field label="여행 이름">
                    <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="보홀·세부 가족여행" />
                  </Field>
                </div>
              </div>
              <Field label="목적지">
                <input className={inputCls} value={form.destination} onChange={(e) => set('destination', e.target.value)} placeholder="필리핀 보홀·세부" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="출발일"><input type="date" className={inputCls} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
                <Field label="귀국일"><input type="date" className={inputCls} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} /></Field>
              </div>
              <Field label="여행자 (쉼표 구분)">
                <input className={inputCls} value={form.travelers} onChange={(e) => set('travelers', e.target.value)} placeholder="곰이, 옹이, 수호" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="기본 통화">
                  <select className={inputCls} value={form.baseCurrency} onChange={(e) => set('baseCurrency', e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="예산 (원화)">
                  <input type="number" inputMode="numeric" className={inputCls} value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="4000000" />
                </Field>
              </div>
              <button onClick={save}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                <Save size={16} />
                {saved ? '저장 완료 ✓' : '저장'}
              </button>
            </div>
          </div>
        )}

        {/* Add new trip */}
        <button
          onClick={() => {
            const id = addTrip({ title: '새 여행', destination: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], travelers: [], baseCurrency: 'KRW', itinerary: [], expenses: [], checklist: [], bookings: [], locations: [] });
            setActiveTrip(id);
            setForm({ title: '새 여행', destination: '', description: '', startDate: '', endDate: '', baseCurrency: 'KRW', budget: '', travelers: '', coverEmoji: '✈️' });
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-gray-600 rounded-2xl text-sm font-medium"
        >
          + 새 여행 추가
        </button>

        {/* Danger zone */}
        {trip && (
          <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-red-50">
              <p className="text-xs font-semibold text-red-400">위험 구역</p>
            </div>
            <button
              onClick={() => {
                if (confirm(`"${trip.title}" 여행을 삭제하시겠어요? 모든 데이터가 사라집니다.`)) {
                  deleteTrip(trip.id);
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 text-sm"
            >
              <Trash2 size={16} />
              이 여행 삭제
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-2">
          TravelPlan · 데이터는 이 기기에만 저장됩니다
        </p>
      </div>
    </div>
  );
}

function SettingRow({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50">
      <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
    </button>
  );
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>{children}</div>;
}
