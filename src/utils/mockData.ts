import { Ticket } from '../types';

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TKT-20260615-S1-A01',
    email: 'vendor.amanah@gmail.com',
    vendorName: 'PT Amanah Logistik',
    picName: 'Rudi Hermawan',
    poAmount: 3,
    koliAmount: 15,
    itemAmount: 120,
    quantityAmount: 500,
    deliveryDate: '2026-06-15',
    session: '08:00-09:00',
    slotCode: 'A01',
    createdAt: '2026-06-13T10:15:00.000Z',
    status: 'ACTIVE'
  },
  {
    id: 'TKT-20260615-S1-A05',
    email: 'budi@andalanshipping.co.id',
    vendorName: 'CV Andalan Trans',
    picName: 'Budi Santoso',
    poAmount: 1,
    koliAmount: 8,
    itemAmount: 45,
    quantityAmount: 150,
    deliveryDate: '2026-06-15',
    session: '08:00-09:00',
    slotCode: 'A05',
    createdAt: '2026-06-13T11:20:00.000Z',
    status: 'ACTIVE'
  },
  {
    id: 'TKT-20260616-S3-A10',
    email: 'logistik@sumbermakmur.com',
    vendorName: 'PT Sumber Makmur',
    picName: 'Ahmad Fauzi',
    poAmount: 5,
    koliAmount: 34,
    itemAmount: 250,
    quantityAmount: 1200,
    deliveryDate: '2026-06-16',
    session: '13:00-14:00',
    slotCode: 'A10',
    createdAt: '2026-06-13T09:44:00.000Z',
    status: 'ACTIVE'
  },
  {
    id: 'TKT-20260618-S4-A03',
    email: 'susi.trans@ekspedisi.com',
    vendorName: 'PT Ekspedisi Susi Jaya',
    picName: 'Susi Susanti',
    poAmount: 2,
    koliAmount: 12,
    itemAmount: 90,
    quantityAmount: 400,
    deliveryDate: '2026-06-18',
    session: '14:00-15:00',
    slotCode: 'A03',
    createdAt: '2026-06-13T08:12:00.000Z',
    status: 'ACTIVE'
  },
  {
    id: 'TKT-20260620-S2-A02',
    email: 'info@nusantaraspeed.com',
    vendorName: 'CV Nusantara Speed',
    picName: 'Giri Wijaya',
    poAmount: 4,
    koliAmount: 22,
    itemAmount: 180,
    quantityAmount: 750,
    deliveryDate: '2026-06-20',
    session: '09:00-10:00',
    slotCode: 'A02',
    createdAt: '2026-06-12T16:00:00.000Z',
    status: 'ACTIVE'
  }
];

/**
 * Calculates current minimum allowed delivery date (H+2 of given simulated date string).
 * Returns date in YYYY-MM-DD local format.
 */
export function getMinBookingDateStr(simulatedDate: Date): string {
  const d = new Date(simulatedDate);
  d.setDate(d.getDate() + 2);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/**
 * Formats standard string date (YYYY-MM-DD) to a nice Indonesian format.
 */
export function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  
  const INDO_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  return `${day} ${INDO_MONTHS[monthIdx]} ${year}`;
}

/**
 * Evaluates whether rescheduling of a ticket is allowed based on simulated clock.
 * Must be at least 48 hours before the initial scheduled delivery session start time.
 */
export function isRescheduleAllowed(
  deliveryDate: string,
  session: string,
  simulatedTime: Date
): { allowed: boolean; hoursRemaining: number; scheduledTime: Date } {
  // Session format example: "08:00-09:00" -> extract start hour
  const startHourStr = session.split('-')[0]; // "08:00"
  const [hour, min] = startHourStr.split(':').map(Number);
  
  // Parse delivery date: YYYY-MM-DD
  const [year, month, day] = deliveryDate.split('-').map(Number);
  
  // Set accurate scheduled arrival time
  const scheduledTime = new Date(year, month - 1, day, hour, min, 0, 0);
  
  const diffMs = scheduledTime.getTime() - simulatedTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return {
    allowed: diffHours >= 48,
    hoursRemaining: Math.round(diffHours * 10) / 10,
    scheduledTime
  };
}

/**
 * Generates a unique 4-character code
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

/**
 * Generates official ticket ID using a consistent template
 */
export function generateTicketId(dateStr: string, sessionIndex: number, slotCode: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const rIdx = generateShortId();
  return `TKT-${cleanDate}-S${sessionIndex + 1}-${slotCode}-${rIdx}`;
}
