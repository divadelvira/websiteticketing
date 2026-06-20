export interface BookedSlot {
  session: DeliverySession;
  slotCode: string;
  allocatedQuantity: number;
  allocatedItem: number;
  allocatedKoli: number;
  allocatedPo: number;
}

export interface Ticket {
  id: string; // Dynamic unique ticket code, eg: TKT-20260615-09A03
  email: string;
  vendorName: string;
  picName: string;
  poAmount: number;
  koliAmount: number;
  itemAmount: number;
  quantityAmount: number;
  goodsDescription?: string;
  adminRemark?: string;
  deliveryDate: string; // YYYY-MM-DD
  
  // Legacy fields mapped to first slot or single booking
  session: DeliverySession;
  slotCode: string; // A01 - A10
  
  // Multi-session fields
  bookedSlots?: BookedSlot[];

  createdAt: string;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  cancelledBy?: 'ADMIN' | 'VENDOR';
  cancelRemark?: string;
}

export type DeliverySession = '08:00-09:00' | '09:00-10:00' | '13:00-14:00' | '14:00-15:00';

export const DELIVERY_SESSIONS: { key: DeliverySession; label: string; index: number }[] = [
  { key: '08:00-09:00', label: 'Sesi 1 (08:00 - 09:00 WIB)', index: 0 },
  { key: '09:00-10:00', label: 'Sesi 2 (09:00 - 10:00 WIB)', index: 1 },
  { key: '13:00-14:00', label: 'Sesi 3 (13:00 - 14:00 WIB)', index: 2 },
  { key: '14:00-15:00', label: 'Sesi 4 (14:00 - 15:00 WIB)', index: 3 },
];

export const ParkingSlots = ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10'];

export interface SlotOverride {
  date: string;
  session: DeliverySession;
  slotCode: string;
  status: 'BLOCKED' | 'UNBLOCKED';
}
