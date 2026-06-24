export type Currency = 'KRW' | 'PHP' | 'USD' | 'JPY' | 'THB' | 'VND';

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  updatedAt: string;
}

export interface ItineraryItem {
  id: string;
  time?: string;
  activity: string;
  location?: string;
  notes?: string;
  bookingLink?: string;
  status: 'planned' | 'booked' | 'done';
}

export interface DayItinerary {
  id: string;
  date: string;
  region: string;
  items: ItineraryItem[];
}

export interface Expense {
  id: string;
  date: string;
  category: 'flight' | 'hotel' | 'food' | 'transport' | 'activity' | 'shopping' | 'other';
  description: string;
  amount: number;
  currency: Currency;
  paidBy?: string;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  category: 'before' | 'pack' | 'during' | 'after';
  priority?: 'high' | 'normal';
}

export interface BookingLink {
  id: string;
  label: string;
  url: string;
  type: 'flight' | 'hotel' | 'ferry' | 'tour' | 'other';
  status: 'pending' | 'booked';
  amount?: number;
  currency?: Currency;
  date?: string;
  notes?: string;
}

export interface TravelLocation {
  id: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  type: 'hotel' | 'airport' | 'attraction' | 'restaurant' | 'port' | 'other';
  notes?: string;
}

export interface Trip {
  id: string;
  title: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  coverEmoji?: string;
  baseCurrency: Currency;
  budget?: number;
  itinerary: DayItinerary[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  bookings: BookingLink[];
  locations: TravelLocation[];
  createdAt: string;
  updatedAt: string;
}
