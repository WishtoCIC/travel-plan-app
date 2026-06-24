import type { Trip } from '../types/travel';

export const sampleTrip: Trip = {
  id: 'trip-bohol-cebu-2026',
  title: '보홀·세부 가족여행',
  description: '8세 수호와 함께하는 보홀 인 · 세부 아웃 가족여행. 보홀은 핵심 체험 중심으로 짧게, 주요 휴양과 체험은 세부에 배분.',
  destination: '필리핀 보홀·세부',
  startDate: '2026-08-04',
  endDate: '2026-08-12',
  travelers: ['곰이(부)', '옹이(모)', '수호(자, 8세)'],
  coverEmoji: '✈️',
  baseCurrency: 'KRW',
  budget: 4000000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  itinerary: [
    {
      id: 'day1',
      date: '2026-08-04',
      region: '부산 → 보홀',
      items: [
        { id: 'i1-1', time: '20:40', activity: '김해공항 출발 (제주항공)', location: '부산 김해공항(PUS)', status: 'booked', notes: '항공권 발권 완료' },
      ],
    },
    {
      id: 'day2',
      date: '2026-08-05',
      region: '보홀 팡라오',
      items: [
        { id: 'i2-1', time: '00:30', activity: '보홀 팡라오 공항 도착', location: '보홀 팡라오공항(TAG)', status: 'booked' },
        { id: 'i2-2', activity: '늦은 기상 후 리조트 수영', location: 'Be Grand Resort Bohol', status: 'planned' },
        { id: 'i2-3', activity: '알로나 비치 방문', location: '알로나 비치, 팡라오', status: 'planned' },
      ],
    },
    {
      id: 'day3',
      date: '2026-08-06',
      region: '보홀 팡라오',
      items: [
        { id: 'i3-1', activity: '초콜릿힐 · 안경원숭이 · 로복강 가족 단독투어', location: '보홀 내륙', status: 'planned', notes: '가족 단독차량 비교 필요' },
      ],
    },
    {
      id: 'day4',
      date: '2026-08-07',
      region: '보홀 → 세부',
      items: [
        { id: 'i4-1', time: '10:40', activity: 'OceanJet 페리 출발', location: '탁빌라란 항구', status: 'planned', bookingLink: 'https://s.klook.com/c/mXDjlNB0yP', notes: '출항 45분 전까지 체크인' },
        { id: 'i4-2', time: '12:40', activity: '세부 Pier 1 도착', location: '세부 Pier 1', status: 'planned' },
        { id: 'i4-3', time: '15:00', activity: '제이파크 체크인', location: 'Jpark Island Resort & Waterpark Mactan', status: 'booked' },
      ],
    },
    {
      id: 'day5',
      date: '2026-08-08',
      region: '세부 막탄',
      items: [
        { id: 'i5-1', activity: '세부 사파리 종일 체험', location: '세부 사파리', status: 'planned', notes: '왕복차량·입장권 비교 필요' },
      ],
    },
    {
      id: 'day6',
      date: '2026-08-09',
      region: '세부 막탄',
      items: [
        { id: 'i6-1', activity: '세부 오션파크 관람', location: '세부 오션파크', status: 'planned', notes: '운영일·공연시간 확인 필요' },
        { id: 'i6-2', activity: '제이파크 복귀', location: 'Jpark Island Resort', status: 'planned' },
      ],
    },
    {
      id: 'day7',
      date: '2026-08-10',
      region: '세부 막탄',
      items: [
        { id: 'i7-1', activity: '워터파크 · 유수풀 · 파도풀 · 슬라이드', location: 'Jpark Island Resort Waterpark', status: 'planned' },
      ],
    },
    {
      id: 'day8',
      date: '2026-08-11',
      region: '세부 막탄',
      items: [
        { id: 'i8-1', activity: '막탄 호핑 또는 리조트 휴식 (날씨에 따라)', location: '막탄 해변', status: 'planned', notes: '날씨 확인 후 예약' },
        { id: 'i8-2', time: '12:00', activity: '제이파크 체크아웃', location: 'Jpark Island Resort', status: 'planned', notes: '짐 보관 후 이동' },
      ],
    },
    {
      id: 'day9',
      date: '2026-08-12',
      region: '세부 → 부산',
      items: [
        { id: 'i9-1', time: '01:10', activity: '막탄공항 출발 (에어부산)', location: '세부 막탄공항(CEB)', status: 'booked', notes: '항공권 발권 완료' },
        { id: 'i9-2', time: '06:55', activity: '김해공항 도착', location: '부산 김해공항(PUS)', status: 'booked' },
      ],
    },
  ],

  expenses: [
    { id: 'e1', date: '2026-06-01', category: 'flight', description: '제주항공 PUS→TAG (3인)', amount: 850000, currency: 'KRW', paidBy: '곰이', notes: '발권 완료' },
    { id: 'e2', date: '2026-06-01', category: 'flight', description: '에어부산 CEB→PUS (3인)', amount: 680000, currency: 'KRW', paidBy: '곰이', notes: '발권 완료' },
    { id: 'e3', date: '2026-06-10', category: 'hotel', description: 'Be Grand Resort Bohol (3박)', amount: 750000, currency: 'KRW', paidBy: '곰이', notes: '예약 완료' },
    { id: 'e4', date: '2026-06-15', category: 'hotel', description: 'Jpark Island Resort (4박)', amount: 920000, currency: 'KRW', paidBy: '곰이', notes: '예약 완료' },
    { id: 'e5', date: '2026-06-22', category: 'other', description: '곰이 여권 재발급', amount: 50960, currency: 'KRW', paidBy: '곰이' },
  ],

  checklist: [
    { id: 'c1', text: '곰이 여권 만료 확인 (26년 9월) → 재발급 완료', done: true, category: 'before', priority: 'high' },
    { id: 'c2', text: '옹이 여권 만료 확인', done: false, category: 'before', priority: 'high' },
    { id: 'c3', text: '수호 여권 만료 확인', done: false, category: 'before', priority: 'high' },
    { id: 'c4', text: '8/4 부산→보홀 제주항공 발권', done: true, category: 'before' },
    { id: 'c5', text: '8/12 세부→김해 에어부산 발권', done: true, category: 'before' },
    { id: 'c6', text: '보홀 비 그랜드 리조트 3박 예약', done: true, category: 'before' },
    { id: 'c7', text: '세부 Jpark Island Resort 4박 예약', done: true, category: 'before' },
    { id: 'c8', text: '비 그랜드 리조트에 새벽 도착 · 늦은 체크인 통보', done: false, category: 'before', priority: 'high' },
    { id: 'c9', text: 'Klook OceanJet 페리 8/7 예약', done: false, category: 'before', priority: 'high' },
    { id: 'c10', text: '보홀 육상투어 가족 단독차량 비교 예약', done: false, category: 'before' },
    { id: 'c11', text: '세부 사파리 왕복차량·입장권 비교', done: false, category: 'before' },
    { id: 'c12', text: '세부 오션파크 운영일·공연시간 확인', done: false, category: 'before' },
    { id: 'c13', text: '여행자보험 가입', done: false, category: 'before' },
    { id: 'c14', text: '아동용 상비약 준비', done: false, category: 'pack' },
    { id: 'c15', text: '필리핀 페소 환전 (₱12,000~15,000)', done: false, category: 'before' },
    { id: 'c16', text: '8/11 체크아웃 후 짐 보관·공항 이동 차량 확정', done: false, category: 'before' },
    { id: 'c17', text: '8/12 부산→수원 귀가 교통편 예매', done: false, category: 'before' },
    { id: 'c18', text: '여권 3개 챙기기', done: false, category: 'pack', priority: 'high' },
    { id: 'c19', text: '수하물 무게 확인 (각 15kg 이하)', done: false, category: 'pack' },
    { id: 'c20', text: '기내수하물 크기 확인 (40×20×55cm)', done: false, category: 'pack' },
  ],

  bookings: [
    { id: 'b1', label: '제주항공 PUS→TAG', url: '', type: 'flight', status: 'booked', amount: 850000, currency: 'KRW', date: '2026-08-04' },
    { id: 'b2', label: '에어부산 CEB→PUS', url: '', type: 'flight', status: 'booked', amount: 680000, currency: 'KRW', date: '2026-08-12' },
    { id: 'b3', label: 'Be Grand Resort Bohol', url: '', type: 'hotel', status: 'booked', amount: 750000, currency: 'KRW', date: '2026-08-04', notes: '3박 (8/4~8/7)' },
    { id: 'b4', label: 'Jpark Island Resort Mactan', url: 'https://www.jparkislandresort.com/portal/', type: 'hotel', status: 'booked', amount: 920000, currency: 'KRW', date: '2026-08-07', notes: '4박 (8/7~8/11)' },
    { id: 'b5', label: 'Klook OceanJet 보홀→세부 페리', url: 'https://s.klook.com/c/mXDjlNB0yP', type: 'ferry', status: 'pending', date: '2026-08-07', notes: '10:40 출발 → 12:40 세부 도착' },
  ],

  locations: [
    { id: 'loc1', name: '부산 김해공항', address: '부산광역시 강서구 공항진입로 108', lat: 35.1795, lng: 128.9381, type: 'airport' },
    { id: 'loc2', name: '보홀 팡라오공항(TAG)', address: 'Panglao Island, Bohol, Philippines', lat: 9.5688, lng: 123.7754, type: 'airport' },
    { id: 'loc3', name: 'Be Grand Resort Bohol', address: 'Alona Beach, Panglao, Bohol, Philippines', lat: 9.5513, lng: 123.7436, type: 'hotel' },
    { id: 'loc4', name: '탁빌라란 항구', address: 'Tagbilaran City, Bohol, Philippines', lat: 9.6519, lng: 123.8544, type: 'port' },
    { id: 'loc5', name: '세부 Pier 1', address: 'Pier 1, Cebu City, Philippines', lat: 10.2931, lng: 123.9023, type: 'port' },
    { id: 'loc6', name: 'Jpark Island Resort & Waterpark Mactan', address: 'M.L. Quezon National Highway, Maribago, Lapu-Lapu City, Cebu', lat: 10.3127, lng: 124.0052, type: 'hotel' },
    { id: 'loc7', name: '세부 막탄공항(CEB)', address: 'Lapu-Lapu City, Cebu, Philippines', lat: 10.3075, lng: 123.9793, type: 'airport' },
    { id: 'loc8', name: '초콜릿힐', address: 'Carmen, Bohol, Philippines', lat: 9.8998, lng: 124.1699, type: 'attraction' },
  ],
};
