import { Ticket, BookedSlot, DeliverySession, DELIVERY_SESSIONS, ParkingSlots, SlotOverride } from '../types';

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
  quantity: 2500,
  item: 100,
  koli: 200,
  po: 10
};

export function getSessionLoad(tickets: Ticket[], date: string, session: DeliverySession, slotOverrides: SlotOverride[] = []) {
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

  // Add manually blocked slots from overrides
  const blockedOverrides = slotOverrides.filter(o => o.date === date && o.session === session && o.status === 'BLOCKED');
  for (const o of blockedOverrides) {
    if (!occupiedSlots.includes(o.slotCode)) {
      occupiedSlots.push(o.slotCode);
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
  selectedSlotCode: string,
  reqQty: number,
  reqItem: number,
  reqKoli: number,
  reqPo: number,
  slotOverrides: SlotOverride[] = []
): { success: boolean; allocations?: BookedSlot[]; message?: string; messageEn?: string } {
  let remQty = reqQty;
  let remItem = reqItem;
  let remKoli = reqKoli;
  let remPo = reqPo;
  
  const allocations: BookedSlot[] = [];
  const startIndex = DELIVERY_SESSIONS.findIndex(s => s.key === startSession);
  
  if (startIndex === -1) return { success: false, message: "Sesi tidak valid", messageEn: "Invalid session" };

  // 1. Evaluate the starting session
  const startLoad = getSessionLoad(tickets, date, startSession, slotOverrides);
  if (startLoad.occupiedSlots.includes(selectedSlotCode)) {
    return { 
      success: false, 
      message: "Slot yang dipilih sudah terisi pada sesi ini.", 
      messageEn: "Selected slot is already occupied in this session." 
    };
  }

  const startOverride = slotOverrides.find(o => o.date === date && o.session === startSession && o.slotCode === selectedSlotCode);
  const isStartForceUnblocked = startOverride?.status === 'UNBLOCKED';

  // If force unblocked, pretend we have at least a full session's worth of capacity just for this allocation
  const startCapQty = isStartForceUnblocked ? Math.max(startLoad.availQty, SESSION_LIMITS.quantityAmount) : startLoad.availQty;
  const startCapItem = isStartForceUnblocked ? Math.max(startLoad.availItem, SESSION_LIMITS.itemAmount) : startLoad.availItem;
  const startCapKoli = isStartForceUnblocked ? Math.max(startLoad.availKoli, SESSION_LIMITS.koliAmount) : startLoad.availKoli;
  const startCapPo = isStartForceUnblocked ? Math.max(startLoad.availPo, SESSION_LIMITS.poAmount) : startLoad.availPo;

  const startAllocQty = Math.min(remQty, startCapQty);
  const startAllocItem = Math.min(remItem, startCapItem);
  const startAllocKoli = Math.min(remKoli, startCapKoli);
  const startAllocPo = Math.min(remPo, startCapPo);

  // Check if it spills over
  const willSpillOver = 
    remQty > startAllocQty || 
    remItem > startAllocItem || 
    remKoli > startAllocKoli || 
    remPo > startAllocPo;

  if (willSpillOver) {
    // If spilling over, ensure no one is booked BEHIND this slot in the starting session
    const selectedSlotIdx = ParkingSlots.indexOf(selectedSlotCode);
    const hasFollowingOccupied = startLoad.occupiedSlots.some(s => ParkingSlots.indexOf(s) > selectedSlotIdx);
    
    if (hasFollowingOccupied) {
      return { 
        success: false, 
        message: "Kapasitas muatan Anda sangat besar sehingga akan memakan waktu melebihi sesi ini. Anda tidak dapat memilih slot ini karena sudah ada antrean vendor lain setelah slot Anda di sesi ini.", 
        messageEn: "Your load capacity is too large and will exceed this session's time. You cannot choose this slot because there are already other vendors queued behind you in this session." 
      };
    }
  }

  // Allocate starting session
  if (startAllocQty > 0 || startAllocItem > 0 || startAllocKoli > 0 || startAllocPo > 0) {
    allocations.push({
      session: startSession,
      slotCode: selectedSlotCode,
      allocatedQuantity: startAllocQty,
      allocatedItem: startAllocItem,
      allocatedKoli: startAllocKoli,
      allocatedPo: startAllocPo
    });
    remQty -= startAllocQty;
    remItem -= startAllocItem;
    remKoli -= startAllocKoli;
    remPo -= startAllocPo;
  }

  // 2. Evaluate subsequent spill-over sessions
  for (let i = startIndex + 1; i < DELIVERY_SESSIONS.length; i++) {
    if (remQty <= 0 && remItem <= 0 && remKoli <= 0 && remPo <= 0) break;

    const sess = DELIVERY_SESSIONS[i];
    const sessKey = sess.key;
    const load = getSessionLoad(tickets, date, sess.key, slotOverrides);
    const requiredSlot = 'A01'; // MUST be A01 for spill-overs

    if (load.occupiedSlots.includes(requiredSlot)) {
      return { 
        success: false, 
        message: `Muatan Anda harus dilanjutkan ke sesi berikutnya (${sessKey}), namun Slot ${requiredSlot} pada sesi tersebut sudah dipesan. Silakan pilih jadwal lain yang lebih luang.`, 
        messageEn: `Your load spills over to the next session (${sessKey}), but Slot ${requiredSlot} is already booked. Please choose a less busy schedule.` 
      };
    }

    const override = slotOverrides.find(o => o.date === date && o.session === sess.key && o.slotCode === 'A01');
    const isForceUnblocked = override?.status === 'UNBLOCKED';

    const capQty = isForceUnblocked ? Math.max(load.availQty, SESSION_LIMITS.quantityAmount) : load.availQty;
    const capItem = isForceUnblocked ? Math.max(load.availItem, SESSION_LIMITS.itemAmount) : load.availItem;
    const capKoli = isForceUnblocked ? Math.max(load.availKoli, SESSION_LIMITS.koliAmount) : load.availKoli;
    const capPo = isForceUnblocked ? Math.max(load.availPo, SESSION_LIMITS.poAmount) : load.availPo;

    const allocQty = Math.min(remQty, capQty);
    const allocItem = Math.min(remItem, capItem);
    const allocKoli = Math.min(remKoli, capKoli);
    const allocPo = Math.min(remPo, capPo);

    allocations.push({
      session: sessKey,
      slotCode: requiredSlot,
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

  if (remQty > 0 || remItem > 0 || remKoli > 0 || remPo > 0) {
    return { 
      success: false, 
      message: "Kapasitas keseluruhan sisa hari ini tidak mencukupi untuk memuat barang Anda. Silakan pilih hari lain atau kurangi muatan.",
      messageEn: "The remaining capacity for the rest of the day is insufficient for your load. Please select another day or reduce load."
    };
  }

  return { success: true, allocations };
}
