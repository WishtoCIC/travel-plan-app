import { useState } from 'react';
import { Save, Download, Upload, Trash2, ChevronRight, Info, Cloud, CloudOff, Link, RotateCcw } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { exportTripAsFile, importTripFromFile, shareText } from '../utils/share';
import { isSupabaseReady } from '../lib/supabase';
import type { Currency } from '../types/travel';

const CURRENCIES: Currency[] = ['KRW', 'PHP', 'USD', 'JPY', 'THB', 'VND'];

export function SettingsPage() {
  const { trips, activeTrip, updateTrip, deleteTrip, setActiveTrip, addTrip, enableCloudSync, joinByCode, syncStatus, restoreFromSample } = useTravelStore();
  const trip = trips.find((t) => t.id === activeTrip) ?? trips[0];
  const [saved, setSaved] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [showShareInfo, setShowShareInfo] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningMsg, setJoiningMsg] = useState('');

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

    let updatedItinerary = trip.itinerary;
    if (form.startDate && trip.startDate && form.startDate !== trip.startDate) {
      const oldStart = new Date(trip.startDate);
      const newStart = new Date(form.startDate);
      const diffDays = Math.round((newStart.getTime() - oldStart.getTime()) / 86400000);
      updatedItinerary = trip.itinerary.map((day) => {
        const d = new Date(day.date);
        d.setDate(d.getDate() + diffDays);
        return { ...day, date: d.toISOString().split('T')[0] };
      });
    }

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
      itinerary: updatedItinerary,
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
    } catch {
      setShareMsg('❌ 파일을 읽을 수 없어요. 올바른 여행 파일인지 확인해주세요.');
      setTimeout(() => setShareMsg(''), 3000);
    }
  }

  async function handleEnableCloud() {
    if (!trip) return;
    const code = await enableCloudSync(trip.id);
    if (code) {
      setShareMsg(`✅ 동기화 활성화! 공유 코드: ${code}`);
    } else {
      setShareMsg('❌ Supabase 설정이 필요해요. 아래 안내를 참고하세요.');
    }
    setTimeout(() => setShareMsg(''), 5000);
  }

  async function handleCopyShareLink() {
    if (!trip?.shareCode) return;
    const url = `${window.location.origin}/?code=${trip.shareCode}`;
    const result = await shareText(trip.title, `${trip.title} 여행 계획 공유`, url);
    setShareMsg(result === 'shared' ? '✅ 공유됐어요!' : '📋 링크 복사 완료! 카카오톡에 붙여넣기하세요.');
    setTimeout(() => setShareMsg(''), 4000);
  }

  async function handleJoinCode() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    const result = await joinByCode(code);
    if (result === 'ok') setJoiningMsg('✅ 여행을 불러왔어요!');
    else if (result === 'not_found') setJoiningMsg('❌ 코드를 찾을 수 없어요.');
    else setJoiningMsg('❌ Supabase 설정이 필요해요.');
    setTimeout(() => setJoiningMsg(''), 4000);
  }


  return (
    <div className="app-screen">
      {/* Header */}
      <div className="app-header">
        <h1 className="app-header-title">설정</h1>
        <p className="app-header-subtitle">여행 정보 및 공유</p>
      </div>

      <div className="page-pad space-y-4">

        {/* Trip selector */}
        {trips.length > 0 && (
          <div className="surface-card overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="section-label">여행 선택</p>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {trips.map((t) => (
                <button key={t.id} onClick={() => {
                  setActiveTrip(t.id);
                  setForm({ title: t.title, destination: t.destination, description: t.description ?? '', startDate: t.startDate, endDate: t.endDate, baseCurrency: t.baseCurrency, budget: t.budget ?? '', travelers: t.travelers.join(', '), coverEmoji: t.coverEmoji ?? '✈️' });
                }}
                  className={`rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${t.id === activeTrip ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
                  {t.coverEmoji} {t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 실시간 클라우드 동기화 ── */}
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              {trip?.cloudEnabled
                ? <Cloud size={15} className="text-sky-500" />
                : <CloudOff size={15} className="text-slate-400" />}
              <p className="section-label">실시간 공유 동기화</p>
            </div>
            <SyncBadge status={syncStatus} />
          </div>

          {/* 이미 활성화된 경우 */}
          {trip?.cloudEnabled && trip.shareCode ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3">
                <div>
                  <p className="mb-0.5 text-xs font-bold text-sky-500">공유 코드</p>
                  <p className="text-2xl font-black tracking-widest text-sky-700">{trip.shareCode}</p>
                </div>
                <button onClick={handleCopyShareLink}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white">
                  <Link size={14} /> 링크 공유
                </button>
              </div>
              <p className="text-center text-xs text-slate-400">
                가족이 이 코드 또는 링크로 접속하면 실시간으로 공유됩니다
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {!isSupabaseReady && (
                <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800 space-y-1">
                  <p className="font-bold">Supabase 설정이 필요해요</p>
                  <p>아래 "Supabase 설정 방법"을 따라 환경변수를 추가하면 활성화됩니다.</p>
                </div>
              )}
              <button onClick={handleEnableCloud}
                disabled={!isSupabaseReady}
                className="primary-button w-full disabled:opacity-40">
                <Cloud size={16} /> 실시간 공유 활성화
              </button>
            </div>
          )}

          {/* 코드로 참가 */}
          <div className="space-y-2 border-t border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-500">공유받은 코드로 참가</p>
            <div className="flex gap-2">
              <input
                className="field-input flex-1 uppercase tracking-widest font-black"
                placeholder="BOHOL2"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
              <button onClick={handleJoinCode}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">
                참가
              </button>
            </div>
            {joiningMsg && <p className="text-center text-xs font-medium text-slate-600">{joiningMsg}</p>}
          </div>

          {shareMsg && (
            <div className="mx-4 mb-3 rounded-xl bg-sky-50 p-3 text-center text-sm font-bold text-sky-800">
              {shareMsg}
            </div>
          )}
        </div>

        {/* ── 파일 백업/공유 ── */}
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="section-label">파일 백업 & 수동 공유</p>
            <button onClick={() => setShowShareInfo(!showShareInfo)} className="text-slate-400">
              <Info size={15} />
            </button>
          </div>
          {showShareInfo && (
            <div className="mx-4 my-3 space-y-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p>• <strong>파일 내보내기</strong>: JSON 저장 → 카카오톡으로 파일 공유</p>
              <p>• <strong>파일 가져오기</strong>: 공유받은 JSON 파일로 불러오기</p>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            <SettingRow icon={<Download size={18} className="text-sky-500" />} label="파일로 내보내기" sub="JSON 파일 저장 후 카카오톡 등으로 공유" onClick={handleExport} />
            <SettingRow icon={<Upload size={18} className="text-emerald-500" />} label="파일 가져오기" sub="공유받은 JSON 파일로 여행 불러오기" onClick={handleImport} />
          </div>
        </div>

        {/* Trip form */}
        {trip && (
          <div className="surface-card overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="section-label">여행 정보 수정</p>
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
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-colors ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-white'}`}>
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
          className="secondary-button w-full py-3.5"
        >
          + 새 여행 추가
        </button>

        {/* Danger zone */}
        <div className="overflow-hidden rounded-xl border border-red-100 bg-white">
          <div className="border-b border-red-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-red-400">위험 구역</p>
          </div>
          <button
            onClick={async () => {
              if (confirm('일정·비용·체크리스트·예약 데이터를 원본 보홀·세부 샘플로 복원하시겠어요?\n\n현재 데이터는 사라집니다.')) {
                await restoreFromSample(trip?.id);
                alert('✅ 원본 샘플 데이터로 복원됐어요!');
              }
            }}
            className="flex w-full items-center gap-3 border-b border-red-50 px-4 py-3.5 text-sm font-semibold text-orange-500"
          >
            <RotateCcw size={16} />
            원본 샘플 데이터로 복원
          </button>
          {trip && (
            <button
              onClick={() => {
                if (confirm(`"${trip.title}" 여행을 삭제하시겠어요? 모든 데이터가 사라집니다.`)) {
                  deleteTrip(trip.id);
                }
              }}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-semibold text-red-500"
            >
              <Trash2 size={16} />
              이 여행 삭제
            </button>
          )}
        </div>

        <p className="pb-2 text-center text-xs text-slate-400">
          TravelPlan · 데이터는 이 기기에만 저장됩니다
        </p>
      </div>
    </div>
  );
}

function SettingRow({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <ChevronRight size={16} className="flex-shrink-0 text-slate-300" />
    </button>
  );
}

const inputCls = 'field-input';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-bold text-slate-500">{label}</label>{children}</div>;
}

function SyncBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    idle:    { label: '대기',    cls: 'bg-slate-100 text-slate-400' },
    syncing: { label: '동기화 중', cls: 'bg-sky-100 text-sky-600' },
    synced:  { label: '동기화 완료', cls: 'bg-emerald-100 text-emerald-600' },
    error:   { label: '오류',    cls: 'bg-red-100 text-red-500' },
    offline: { label: '오프라인', cls: 'bg-slate-100 text-slate-400' },
  };
  const { label, cls } = map[status] ?? map.idle;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{label}</span>;
}
