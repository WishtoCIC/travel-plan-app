import type { Trip } from '../types/travel';

/** 여행 데이터를 JSON 파일로 다운로드 */
export function exportTripAsFile(trip: Trip) {
  const json = JSON.stringify(trip, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trip.title.replace(/\s+/g, '_')}_여행계획.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** JSON 파일을 읽어 Trip 객체로 반환 */
export function importTripFromFile(): Promise<Trip> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return reject(new Error('파일을 선택하지 않았습니다'));
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const trip = JSON.parse(ev.target?.result as string) as Trip;
          resolve(trip);
        } catch {
          reject(new Error('올바른 여행 파일이 아닙니다'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

/** 여행 데이터를 URL-safe base64 공유 코드로 인코딩 */
export function encodeTripToShareCode(trip: Trip): string {
  const json = JSON.stringify(trip);
  return btoa(encodeURIComponent(json));
}

/** 공유 코드를 Trip 객체로 디코딩 */
export function decodeShareCode(code: string): Trip {
  return JSON.parse(decodeURIComponent(atob(code)));
}

/** URL 해시에서 공유 코드를 읽어 Trip 반환, 없으면 null */
export function getTripFromUrlHash(): Trip | null {
  try {
    const hash = window.location.hash.replace('#share=', '');
    if (!hash || !window.location.hash.startsWith('#share=')) return null;
    return decodeShareCode(hash);
  } catch {
    return null;
  }
}

/** 네이티브 공유 또는 클립보드 복사 */
export async function shareText(title: string, text: string, url?: string): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return 'shared';
  }
  await navigator.clipboard.writeText(url ?? text);
  return 'copied';
}
