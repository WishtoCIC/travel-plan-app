import { useRef, useState } from 'react';
import { Camera, ExternalLink, Film, FolderOpen, Image, LoaderCircle, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { deleteTravelMedia, isMediaStorageReady, uploadTravelMedia } from '../lib/mediaStorage';
import type { TravelMedia } from '../types/travel';

const MAX_FILE_BYTES = 50 * 1024 * 1024;

function fileSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}

export function AlbumPage() {
  const { trips, activeTrip, updateTrip } = useTravelStore();
  const trip = trips.find((item) => item.id === activeTrip) ?? trips[0];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<TravelMedia | null>(null);
  const media = trip?.media ?? [];

  async function addFiles(files: FileList | null) {
    if (!trip || !files?.length || uploading) return;
    const accepted = Array.from(files).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
    const tooLarge = accepted.find((file) => file.size > MAX_FILE_BYTES);
    if (tooLarge) {
      setMessage(`${tooLarge.name}: Supabase 무료 플랜에서는 파일당 최대 50MB까지 업로드할 수 있어요.`);
      return;
    }
    if (!isMediaStorageReady()) {
      setMessage('Supabase Storage 설정 후 업로드할 수 있어요. 하단 설정 안내를 확인해주세요.');
      return;
    }

    setUploading(true);
    setMessage(`${accepted.length}개 파일을 업로드하는 중…`);
    const uploaded: TravelMedia[] = [];
    try {
      for (const file of accepted) {
        const result = await uploadTravelMedia(trip.id, file);
        uploaded.push({
          id: crypto.randomUUID(), name: file.name,
          type: file.type.startsWith('video/') ? 'video' : 'photo',
          mimeType: file.type, size: file.size, ...result,
          createdAt: new Date().toISOString(),
        });
        setMessage(`${uploaded.length}/${accepted.length} 업로드 완료`);
      }
      updateTrip(trip.id, { media: [...media, ...uploaded] });
      setMessage(`${uploaded.length}개 파일을 여행앨범에 추가했어요.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '업로드에 실패했어요.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove(item: TravelMedia) {
    if (!trip || !confirm(`“${item.name}” 파일을 삭제할까요?`)) return;
    try {
      await deleteTravelMedia(item.storagePath);
      updateTrip(trip.id, { media: media.filter((entry) => entry.id !== item.id) });
      setSelected(null);
      setMessage('파일을 삭제했어요.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '삭제에 실패했어요.');
    }
  }

  if (!trip) return <div className="app-screen flex items-center justify-center text-sm text-slate-400">여행을 먼저 선택해주세요.</div>;

  return (
    <div className="app-screen">
      <header className="app-header flex items-center justify-between gap-3">
        <div><h1 className="app-header-title">여행앨범</h1><p className="app-header-subtitle">{trip.title} · {media.length}개</p></div>
        <button className="primary-button px-3 py-2" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} 추가
        </button>
        <input ref={inputRef} className="hidden" type="file" accept="image/*,video/*" multiple onChange={(event) => addFiles(event.target.files)} />
      </header>

      <main className="page-pad space-y-4">
        <section className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 p-4 text-white shadow-lg shadow-blue-200/70">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/15 p-2.5"><FolderOpen size={22} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">Google Drive 원본 앨범</p>
              <p className="mt-1 text-xs leading-relaxed text-blue-100">대용량 사진과 영상은 공유 폴더에서 보관하고 함께 볼 수 있어요.</p>
              {trip.driveFolderUrl ? (
                <a href={trip.driveFolderUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-700">
                  Drive 폴더 열기 <ExternalLink size={13} />
                </a>
              ) : (
                <a href="/settings" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-700">설정에서 폴더 연결</a>
              )}
            </div>
          </div>
        </section>

        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/60 px-5 py-7 text-center active:bg-sky-50">
          <UploadCloud size={30} className="text-sky-500" />
          <span className="mt-2 text-sm font-black text-slate-900">사진과 영상을 선택하세요</span>
          <span className="mt-1 text-xs text-slate-500">대표 사진·짧은 영상 · 파일당 최대 50MB</span>
        </button>

        {message && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600">{message}</div>}

        {media.length === 0 ? (
          <div className="py-14 text-center"><Camera size={40} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">아직 여행 추억이 없어요</p><p className="mt-1 text-xs text-slate-400">촬영한 사진과 영상을 한곳에 모아보세요.</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[...media].reverse().map((item) => (
              <button key={item.id} onClick={() => setSelected(item)} className="surface-card overflow-hidden text-left">
                <div className="relative aspect-square bg-slate-100">
                  {item.type === 'photo' ? <img src={item.publicUrl} alt={item.caption ?? item.name} className="h-full w-full object-cover" loading="lazy" /> : <video src={item.publicUrl} className="h-full w-full object-cover" preload="metadata" />}
                  <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/75 p-1.5 text-white">{item.type === 'video' ? <Film size={13} /> : <Image size={13} />}</span>
                </div>
                <div className="p-2.5"><p className="truncate text-xs font-bold text-slate-800">{item.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{fileSize(item.size)}</p></div>
              </button>
            ))}
          </div>
        )}
      </main>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" onClick={() => setSelected(null)}>
        <button className="absolute right-4 top-10 rounded-full bg-white/10 p-2 text-white" onClick={() => setSelected(null)}><X size={20} /></button>
        <div className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
          {selected.type === 'photo' ? <img src={selected.publicUrl} alt={selected.name} className="max-h-[70vh] w-full rounded-xl object-contain" /> : <video src={selected.publicUrl} className="max-h-[70vh] w-full rounded-xl" controls autoPlay />}
          <div className="mt-3 flex items-center justify-between text-white"><div className="min-w-0"><p className="truncate text-sm font-bold">{selected.name}</p><p className="text-xs text-slate-300">{fileSize(selected.size)}</p></div><button onClick={() => remove(selected)} className="ml-3 rounded-xl bg-red-500/90 p-3"><Trash2 size={18} /></button></div>
        </div>
      </div>}
    </div>
  );
}
