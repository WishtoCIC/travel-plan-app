export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}(${['일','월','화','수','목','금','토'][d.getDay()]})`;
}

export function getDaysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / 86400000);
}

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  flight: '항공',
  hotel: '숙소',
  food: '식비',
  transport: '교통',
  activity: '액티비티',
  shopping: '쇼핑',
  other: '기타',
  before: '출발 전',
  pack: '짐 싸기',
  during: '현지',
  after: '귀국 후',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  KRW: '₩',
  PHP: '₱',
  USD: '$',
  JPY: '¥',
  THB: '฿',
  VND: '₫',
};
