import { Ticket, BookedSlot, DeliverySession, DELIVERY_SESSIONS, ParkingSlots } from '../types';

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
    bookedSlots: [{
      session: '08:00-09:00',
      slotCode: 'A01',
      allocatedQuantity: 500,
      allocatedItem: 120,
      allocatedKoli: 15,
      allocatedPo: 3
    }],
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
    bookedSlots: [{
      session: '08:00-09:00',
      slotCode: 'A05',
      allocatedQuantity: 150,
      allocatedItem: 45,
      allocatedKoli: 8,
      allocatedPo: 1
    }],
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
    bookedSlots: [
      {
        session: '13:00-14:00',
        slotCode: 'A10',
        allocatedQuantity: 1000,
        allocatedItem: 200,
        allocatedKoli: 25,
        allocatedPo: 3
      },
      {
        session: '14:00-15:00',
        slotCode: 'A10',
        allocatedQuantity: 200,
        allocatedItem: 50,
        allocatedKoli: 9,
        allocatedPo: 2
      }
    ],
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
    bookedSlots: [{
      session: '14:00-15:00',
      slotCode: 'A03',
      allocatedQuantity: 400,
      allocatedItem: 90,
      allocatedKoli: 12,
      allocatedPo: 2
    }],
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
    bookedSlots: [{
      session: '09:00-10:00',
      slotCode: 'A02',
      allocatedQuantity: 750,
      allocatedItem: 180,
      allocatedKoli: 22,
      allocatedPo: 4
    }],
    createdAt: '2026-06-12T16:00:00.000Z',
    status: 'ACTIVE'
  }
];

export function getMinBookingDateStr(simulatedDate: Date): string {
  const d = new Date(simulatedDate);
  d.setDate(d.getDate() + 2);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function formatIndoDate(dateStr: string, lang: 'id' | 'en' = 'id'): string {
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
  const EN_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return `${day} ${lang === 'en' ? EN_MONTHS[monthIdx] : INDO_MONTHS[monthIdx]} ${year}`;
}

export function isRescheduleAllowed(
  deliveryDate: string,
  session: string,
  simulatedTime: Date
): { allowed: boolean; hoursRemaining: number; scheduledTime: Date } {
  const startHourStr = session.split('-')[0];
  const [hour, min] = startHourStr.split(':').map(Number);
  const [year, month, day] = deliveryDate.split('-').map(Number);
  const scheduledTime = new Date(year, month - 1, day, hour, min, 0, 0);
  
  const diffMs = scheduledTime.getTime() - simulatedTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return {
    allowed: diffHours >= 48,
    hoursRemaining: Math.round(diffHours * 10) / 10,
    scheduledTime
  };
}

export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function generateTicketId(dateStr: string, sessionIndex: number, slotCode: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const rIdx = generateShortId();
  return `TKT-${cleanDate}-S${sessionIndex + 1}-${slotCode}-${rIdx}`;
}

// ALGORITHM FOR MULTI-SLOT CAPACITY ALLOCATION
export const SESSION_LIMITS = {
  quantity: 1000,
  item: 1000,
  koli: 50,
  po: 10
};

export function getSessionLoad(tickets: Ticket[], date: string, session: DeliverySession) {
  const activeTickets = tickets.filter(t => t.deliveryDate === date && t.status === 'ACTIVE');
  let usedQty = 0, usedItem = 0, usedKoli = 0, usedPo = 0;
  const occupiedSlots: string[] = [];

  for (const t of activeTickets) {
    if (t.bookedSlots) {
      for (const bs of t.bookedSlots) {
        if (bs.session === session) {
          usedQty += bs.allocatedQuantity;
          usedItem += bs.allocatedItem;
          usedKoli += bs.allocatedKoli;
          usedPo += bs.allocatedPo;
          if (!occupiedSlots.includes(bs.slotCode)) occupiedSlots.push(bs.slotCode);
        }
      }
    } else if (t.session === session) {
      usedQty += t.quantityAmount;
      usedItem += t.itemAmount;
      usedKoli += t.koliAmount;
      usedPo += t.poAmount;
      if (!occupiedSlots.includes(t.slotCode)) occupiedSlots.push(t.slotCode);
    }
  }

  return {
    usedQty, usedItem, usedKoli, usedPo,
    availQty: Math.max(0, SESSION_LIMITS.quantity - usedQty),
    availItem: Math.max(0, SESSION_LIMITS.item - usedItem),
    availKoli: Math.max(0, SESSION_LIMITS.koli - usedKoli),
    availPo: Math.max(0, SESSION_LIMITS.po - usedPo),
    occupiedSlots
  };
}

export function allocateBooking(
  tickets: Ticket[],
  date: string,
  startSession: DeliverySession,
  reqQty: number,
  reqItem: number,
  reqKoli: number,
  reqPo: number
): { success: boolean; allocations?: BookedSlot[]; message?: string; messageEn?: string } {
  let remQty = reqQty;
  let remItem = reqItem;
  let remKoli = reqKoli;
  let remPo = reqPo;
  
  const allocations: BookedSlot[] = [];
  const startIndex = DELIVERY_SESSIONS.findIndex(s => s.key === startSession);
  
  if (startIndex === -1) return { success: false, message: "Sesi tidak valid", messageEn: "Invalid session" };

  for (let i = startIndex; i < DELIVERY_SESSIONS.length; i++) {
    const sessKey = DELIVERY_SESSIONS[i].key;
    const load = getSessionLoad(tickets, date, sessKey);
    
    // Find a free slot in this session
    const freeSlot = ParkingSlots.find(s => !load.occupiedSlots.includes(s));
    if (!freeSlot) continue; // Session slots full, skip to next session
    
    if (load.availQty <= 0 || load.availItem <= 0 || load.availKoli <= 0 || load.availPo <= 0) {
       continue; // Session capacity full, skip to next
    }

    // Allocate greedily
    const allocQty = Math.min(remQty, load.availQty);
    const allocItem = Math.min(remItem, load.availItem);
    const allocKoli = Math.min(remKoli, load.availKoli);
    const allocPo = Math.min(remPo, load.availPo);

    if (allocQty > 0 || allocItem > 0 || allocKoli > 0 || allocPo > 0) {
      allocations.push({
        session: sessKey,
        slotCode: freeSlot,
        allocatedQuantity: allocQty,
        allocatedItem: allocItem,
        allocatedKoli: allocKoli,
        allocatedPo: allocPo
      });
      
      remQty -= allocQty;
      remItem -= allocItem;
      remKoli -= allocKoli;
      remPo -= allocPo;
    }

    if (remQty <= 0 && remItem <= 0 && remKoli <= 0 && remPo <= 0) break;
  }

  if (remQty > 0 || remItem > 0 || remKoli > 0 || remPo > 0) {
    return { 
      success: false, 
      message: "Kapasitas gudang (atau ketersediaan slot) mulai dari sesi terpilih tidak mencukupi untuk memuat barang Anda di hari tersebut. Silakan pilih hari lain atau kurangi muatan.",
      messageEn: "Warehouse capacity (or slot availability) from the selected session is insufficient to handle your load on this day. Please select another day or reduce load."
    };
  }

  return { success: true, allocations };
}
