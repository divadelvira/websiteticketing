import React, { useState, useMemo } from 'react';
import { Ticket, DELIVERY_SESSIONS, ParkingSlots, DeliverySession } from '../types';
import { 
getMinBookingDateStr, 
  formatIndoDate, 
  isRescheduleAllowed, 
  generateTicketId,
  allocateBooking,
  SESSION_LIMITS,
} from '../utils/mockData';
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Layers, 
  CheckCircle, 
  XCircle, 
  Lock, 
  AlertTriangle, 
  MapPin, 
  RotateCcw, 
  Printer, 
  Check, 
  Shield,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface VendorPortalProps {
  tickets: Ticket[];
  onAddTicket: (ticket: Ticket) => void;
  onUpdateTicket: (updated: Ticket) => void;
  onCancelTicket: (ticketId: string) => void;
  simulatedTime: Date;
}

type TabType = 'beranda' | 'pesan';

export default function VendorPortal({
  tickets,
  onAddTicket,
  onUpdateTicket,
  onCancelTicket,
  simulatedTime
}: VendorPortalProps) {
  const { language } = useLanguage();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<TabType>('beranda');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<Ticket[]>([]);

  // Selected ticket for looking at detail
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSession, setRescheduleSession] = useState<DeliverySession>('08:00-09:00');
  const [rescheduleSlot, setRescheduleSlot] = useState<string | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  // New Booking States
  const [email, setEmail] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [picName, setPicName] = useState('');
  const [poAmount, setPoAmount] = useState<number | ''>('');
  const [koliAmount, setKoliAmount] = useState<number | ''>('');
  const [itemAmount, setItemAmount] = useState<number | ''>('');
  const [quantityAmount, setQuantityAmount] = useState<number | ''>('');
  
  // Date and session choices
  const [deliveryDate, setDeliveryDate] = useState('');
  const [session, setSession] = useState<DeliverySession>('08:00-09:00');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [latestCreatedTicket, setLatestCreatedTicket] = useState<Ticket | null>(null);

  // minimum booking date is simulated time + 2 days
  const minBookingDate = useMemo(() => {
    return getMinBookingDateStr(simulatedTime);
  }, [simulatedTime]);

  // Set default form date when switching to booking tab
  React.useEffect(() => {
    if (activeTab === 'pesan' && !deliveryDate) {
      setDeliveryDate(minBookingDate);
    }
  }, [activeTab, minBookingDate, deliveryDate]);

  // Handle Search for Tickets
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const matches = tickets.filter(t => 
      t.id.toLowerCase().includes(query) || 
      t.email.toLowerCase().includes(query) ||
      t.vendorName.toLowerCase().includes(query)
    );

    setSearchResults(matches);
    setHasSearched(true);
    
    // Automatically select detail if only 1 match found
    if (matches.length === 1) {
      setSelectedTicketId(matches[0].id);
    } else {
      setSelectedTicketId(null);
    }
  };

  // Find detailed ticket object
  const activeDetailedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find(t => t.id === selectedTicketId) || null;
  }, [selectedTicketId, tickets]);

  // Find slot occupancy on selected booking config
  const getOccupiedSlots = (date: string, sess: DeliverySession) => {
    return tickets
      .filter(t => t.deliveryDate === date && t.session === sess && t.status === 'ACTIVE')
      .map(t => t.slotCode);
  };

  const occupiedSlotsForBooking = useMemo(() => {
    return [];
  }, [deliveryDate, session, tickets]);

  const occupiedSlotsForReschedule = useMemo(() => {
    if (!rescheduleDate) return [];
    return getOccupiedSlots(rescheduleDate, rescheduleSession);
  }, [rescheduleDate, rescheduleSession, tickets]);

  // Handle Booking flow submit
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    // Validate inputs
    if (!email || !vendorName || !picName || !poAmount || !koliAmount || !itemAmount || !quantityAmount || !deliveryDate || !session) {
      setBookingError(language === 'en' ? 'Incomplete form. Please ensure all data is filled.' : 'Isian formulir tidak lengkap. Harap pastikan semua data telah diisi.');
      return;
    }

    const minTimeStr = getMinBookingDateStr(simulatedTime);
    if (deliveryDate < minTimeStr) {
      setBookingError(language === 'en' ? `Invalid delivery date. Must be at least D+2 (Since ${formatIndoDate(minTimeStr, language)}).` : `Tanggal pengiriman tidak valid. Harus minimal H+2 dari hari ini (Semenjak tanggal ${formatIndoDate(minTimeStr, language)}).`);
      return;
    }

    const allocResult = allocateBooking(
      tickets,
      deliveryDate,
      session,
      Number(quantityAmount),
      Number(itemAmount),
      Number(koliAmount),
      Number(poAmount)
    );

    if (!allocResult.success || !allocResult.allocations || allocResult.allocations.length === 0) {
      setBookingError(language === 'en' ? allocResult.messageEn! : allocResult.message!);
      return;
    }

    const sessionIndex = DELIVERY_SESSIONS.findIndex(s => s.key === session);
    const firstSlot = allocResult.allocations[0].slotCode;

    const newTicket: Ticket = {
      id: generateTicketId(deliveryDate, sessionIndex, firstSlot),
      email,
      vendorName,
      picName,
      poAmount: Number(poAmount),
      koliAmount: Number(koliAmount),
      itemAmount: Number(itemAmount),
      quantityAmount: Number(quantityAmount),
      deliveryDate,
      session: allocResult.allocations[0].session,
      slotCode: firstSlot,
      bookedSlots: allocResult.allocations,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE'
    };

    onAddTicket(newTicket);
    setLatestCreatedTicket(newTicket);
    
    // Clear Booking form
    setEmail('');
    setVendorName('');
    setPicName('');
    setPoAmount('');
    setKoliAmount('');
    setItemAmount('');
    setQuantityAmount('');
  };

  // Open reschedule wizard
  const initiateReschedule = (ticket: Ticket) => {
    // Validate rules
    const val = isRescheduleAllowed(ticket.deliveryDate, ticket.session, simulatedTime);
    if (!val.allowed) {
      alert(`Penjadwalan ulang DITOLAK!\n\nSesuai aturan operasional, reschedule hanya diperbolehkan maksimal 48 jam sebelum keberangkatan awal.\n\nJadwal Awal: ${formatIndoDate(ticket.deliveryDate)} pukul ${ticket.session} WIB\nWaktu Simulasi Sekarang: ${simulatedTime.toLocaleString()}\nSisa Waktu: ${val.hoursRemaining} jam (Butuh minimal 48 jam).`);
      return;
    }

    setReschedulingId(ticket.id);
    setRescheduleDate(minBookingDate);
    setRescheduleSession(ticket.session);
    setRescheduleSlot(null);
    setRescheduleError(null);
    setRescheduleSuccess(false);
  };

  // Confirm reschedule submit
  const handleRescheduleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setRescheduleError(null);

    if (!reschedulingId) return;
    const originalTicket = tickets.find(t => t.id === reschedulingId);
    if (!originalTicket) return;

    if (!rescheduleDate || !rescheduleSession) {
      setRescheduleError(language === 'en' ? 'Please specify a new date and session.' : 'Harap tentukan tanggal dan sesi baru untuk penjadwalan.');
      return;
    }

    // Validate next date (min H+2)
    const minTimeStr = getMinBookingDateStr(simulatedTime);
    if (rescheduleDate < minTimeStr) {
      setRescheduleError(language === 'en' ? `Invalid date. Must be at least D+2 (${formatIndoDate(minTimeStr, language)}).` : `Tanggal reschedule tidak valid. Harus minimal H+2 dari hari ini (${formatIndoDate(minTimeStr, language)}).`);
      return;
    }

    // Since it's a reschedule, we temporarily remove the old ticket's slots from the pool
    // to calculate if the new timeslot can fit the ticket's requirements.
    const tempTickets = tickets.filter(t => t.id !== reschedulingId);

    const allocResult = allocateBooking(
      tempTickets,
      rescheduleDate,
      rescheduleSession,
      originalTicket.quantityAmount,
      originalTicket.itemAmount,
      originalTicket.koliAmount,
      originalTicket.poAmount
    );

    if (!allocResult.success || !allocResult.allocations || allocResult.allocations.length === 0) {
      setRescheduleError(language === 'en' ? allocResult.messageEn! : allocResult.message!);
      return;
    }

    // Apply Reschedule changes
    const updatedTicket: Ticket = {
      ...originalTicket,
      deliveryDate: rescheduleDate,
      session: allocResult.allocations[0].session,
      slotCode: allocResult.allocations[0].slotCode,
      bookedSlots: allocResult.allocations,
      createdAt: new Date().toISOString() // refresh timestamp
    };

    onUpdateTicket(updatedTicket);
    setRescheduleSuccess(true);
    setTimeout(() => {
      setReschedulingId(null);
      setRescheduleSuccess(false);
      setSelectedTicketId(updatedTicket.id);
    }, 1500);
  };

  const currentDateStrFormatted = useMemo(() => {
    const y = simulatedTime.getFullYear();
    const m = String(simulatedTime.getMonth() + 1).padStart(2, '0');
    const d = String(simulatedTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [simulatedTime]);

  return (
    <div className="space-y-6">
      
      {/* Portal Greeting Banner */}
      <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-750">
        <div className="absolute top-0 right-0 p-8 text-slate-700/30 font-bold text-7xl select-none hidden md:block">
          DOCK
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">
            PORTAL VENDOR PUBLIK
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-3 text-slate-100">
            {language === 'en' ? 'Warehouse Parking Booking & Management' : 'Booking & Manajemen Tiket Parkir Gudang'}
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            {language === 'en' ? 'Welcome to the main logistics scheduling system. Enter your load data, schedule your arrival at least D+2 in advance, and instantly secure your parking dock.' : 'Selamat datang di sistem manajemen penjadwalan logistik gudang utama. Masukkan data muatan, jadwalkan kedatangan Anda minimal H+2 ke depan, dan dapatkan alokasi dock parkir instan dengan aman.'}
          </p>
          <div className="mt-5 flex gap-3 flex-wrap">
            <button
              id="tab-btn-beranda"
              onClick={() => { setActiveTab('beranda'); setLatestCreatedTicket(null); }}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'beranda'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Beranda & Lacak Tiket</span>
            </button>
            <button
              id="tab-btn-pesan"
              onClick={() => { setActiveTab('pesan'); setLatestCreatedTicket(null); }}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pesan'
                  ? 'bg-indigo-600 text-white shadow hover:bg-indigo-500'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Formulir Pesan Tiket (H+2)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab: BERANDA / SEARCH TICKET */}
      {activeTab === 'beranda' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main search and check in column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search Frame */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Search className="w-5 h-5 text-indigo-600" />
                {language === 'en' ? 'Vendor Delivery Ticket Search' : 'Pencarian Tiket Pengiriman Vendor'}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                {language === 'en' ? 'Search your tickets using Ticket Code or Registered Email to view details, reschedule, or cancel your arrival.' : 'Cari tiket Anda menggunakan Kode Tiket atau Email Terdaftar untuk melihat detail, melakukan penjadwalan ulang, atau membatalkan kedatangan.'}
              </p>
              
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-vendor-search"
                    type="text"
                    placeholder="Masukkan Kode Tiket (TKT-...) atau Email Vendor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-slate-800 placeholder-slate-400"
                  />
                </div>
                <button
                  id="btn-vendor-search-submit"
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  Cari Tiket
                </button>
              </form>

              {/* Suggestions for testing */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Kode Contoh Pengujian:</span>
                {tickets.slice(0, 3).map(tk => (
                  <button
                    key={tk.id}
                    onClick={() => { setSearchQuery(tk.id); setSearchResults([tk]); setSelectedTicketId(tk.id); setHasSearched(true); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                  >
                    {tk.id.slice(0, 16)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results list */}
            {hasSearched && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-800">
                    Hasil Pencarian ({searchResults.length} ditemukan)
                  </h3>
                  {searchResults.length > 0 && (
                    <button 
                      onClick={() => { setHasSearched(false); setSearchQuery(''); setSearchResults([]); setSelectedTicketId(null); }}
                      className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      Bersihkan Hasil
                    </button>
                  )}
                </div>

                {searchResults.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <XCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Tiket Tidak Ditemukan</p>
                    <p className="text-xs mt-1 max-w-sm mx-auto">Kami tidak dapat menemukan tiket aktif dengan kata kunci "{searchQuery}". Pastikan penulisan kode atau email sudah sesuai.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {searchResults.map((tk) => (
                      <div
                        key={tk.id}
                        id={`search-item-${tk.id}`}
                        onClick={() => setSelectedTicketId(tk.id)}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          selectedTicketId === tk.id
                            ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{tk.id}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              tk.status === 'ACTIVE' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {tk.status === 'ACTIVE' ? (language === 'en' ? 'Active' : 'Aktif') : (language === 'en' ? 'Cancelled' : 'Dibatalkan')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 font-medium">
                            {tk.vendorName} &bull; PIC: <span className="text-slate-800 font-semibold">{tk.picName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatIndoDate(tk.deliveryDate)}</span>
                            <span className="text-slate-300">&bull;</span>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{language === 'en' ? 'Session:' : 'Sesi:'} {tk.bookedSlots ? tk.bookedSlots.map(s => s.session.split('-')[0]).join(', ') : tk.session}</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold font-mono text-[10px]">{language === 'en' ? 'Slot' : 'Slot'} {tk.bookedSlots ? tk.bookedSlots.map(s => s.slotCode).join(', ') : tk.slotCode}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{language === 'en' ? 'TOTAL LOAD' : 'TOTAL MUATAN'}</p>
                          <p className="text-sm font-bold text-slate-800">{tk.quantityAmount} Qty <span className="text-slate-500 text-xs font-normal">({tk.koliAmount} Koli)</span></p>
                          <span className="text-xs text-indigo-600 font-semibold hover:underline inline-flex items-center gap-0.5 mt-1">
                            {language === 'en' ? 'View Detail \u2192' : 'Lihat Detail \u2192'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Display active ticket detail */}
            {activeDetailedTicket && (
              <div id="vendor-ticket-detail" className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                
                {/* Header detail */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{language === 'en' ? 'Delivery Document Detail' : 'Detail Dokumen Pengiriman'}</span>
                    <h3 className="font-mono text-lg font-bold text-slate-900 mt-1 select-all select-none">
                      {activeDetailedTicket.id}
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    {/* Print simulator */}
                    <button
                      id="btn-print-ticket"
                      onClick={() => window.print()}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title={language === 'en' ? 'Print Delivery Ticket' : 'Cetak Tiket Pengiriman'}
                    >
                      <Printer className="w-4 h-4" />
                      <span>{language === 'en' ? 'Print PDF' : 'Cetak PDF'}</span>
                    </button>
                    
                    {activeDetailedTicket.status === 'ACTIVE' && (
                      <button
                        id="btn-cancel-ticket"
                        onClick={() => {
                          const slotsStr = activeDetailedTicket.bookedSlots ? activeDetailedTicket.bookedSlots.map(s => s.slotCode).join(', ') : activeDetailedTicket.slotCode;
                          const confirmMsg = language === 'en' 
                            ? `Are you sure you want to cancel this Delivery Ticket Booking?\nThis action is final and slot ${slotsStr} will be released back to the public pool.` 
                            : `Apakah Anda yakin ingin membatalkan Booking Tiket Pengiriman ini?\nTindakan ini bersifat final dan slot parkir ${slotsStr} akan dikembalikan ke publik.`;
                          if (confirm(confirmMsg)) {
                            onCancelTicket(activeDetailedTicket.id);
                            alert(language === 'en' ? 'Ticket cancelled successfully.' : 'Tiket berhasil dibatalkan.');
                          }
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {language === 'en' ? 'Cancel Ticket' : 'Batalkan Tiket'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Main cargo metrics */}
                <div className="bg-slate-50 rounded-2xl p-4.5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="border-r border-slate-200 last:border-r-0 pr-2">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{language === 'en' ? 'Total PO' : 'Jumlah PO'}</p>
                    <p className="text-lg font-black text-slate-800">{activeDetailedTicket.poAmount}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{language === 'en' ? 'PO Documents' : 'Dokumen PO'}</span>
                  </div>
                  <div className="border-r border-slate-200 last:border-r-0 pr-2 pl-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{language === 'en' ? 'Total Boxes' : 'Jumlah Koli'}</p>
                    <p className="text-lg font-black text-slate-800">{activeDetailedTicket.koliAmount}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{language === 'en' ? 'Boxes' : 'Kotak / Dus'}</span>
                  </div>
                  <div className="border-r border-slate-200 last:border-r-0 pr-2 pl-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{language === 'en' ? 'Total Items' : 'Jumlah Item'}</p>
                    <p className="text-lg font-black text-slate-800">{activeDetailedTicket.itemAmount}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{language === 'en' ? 'SKUs' : 'Jenis SKUs'}</span>
                  </div>
                  <div className="pl-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{language === 'en' ? 'Total Quantity' : 'Total Quantity'}</p>
                    <p className="text-lg font-black text-slate-900">{activeDetailedTicket.quantityAmount}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{language === 'en' ? 'Pcs / Units' : 'Pcs / Unit'}</span>
                  </div>
                </div>

                {/* Booking details info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-slate-800 tracking-wider uppercase text-[10px]">{language === 'en' ? 'Vendor Information' : 'Informasi Pengirim (Vendor)'}</h4>
                    <div className="flex items-center gap-2.5 text-slate-755 font-medium">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-normal">{language === 'en' ? 'Vendor Company' : 'Perusahaan Vendor'}</p>
                        <p className="text-slate-800 font-semibold">{activeDetailedTicket.vendorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-755 font-medium">
                      <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-normal">{language === 'en' ? 'PIC Name' : 'Nama PIC Lapangan'}</p>
                        <p className="text-slate-800 font-semibold">{activeDetailedTicket.picName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-755 font-medium">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-normal">{language === 'en' ? 'Contact Email' : 'Email Kontak'}</p>
                        <p className="text-slate-800 font-mono">{activeDetailedTicket.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-indigo-50/20 border border-indigo-500/10 rounded-2xl p-4">
                    <h4 className="font-bold text-indigo-900 tracking-wider uppercase text-[10px] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      {language === 'en' ? 'ARRIVAL SCHEDULE ALLOCATION' : 'ALOKASI JADWAL KEDATANGAN'}
                    </h4>
                    
                    <div>
                      <p className="text-[10px] text-slate-400 font-normal">{language === 'en' ? 'Arrival Date' : 'Tanggal Kedatangan'}</p>
                      <p className="text-slate-800 font-bold text-sm">{formatIndoDate(activeDetailedTicket.deliveryDate, language)}</p>
                    </div>
                    
                    <div>
                      <p className="text-[10px] text-slate-400 font-normal">{language === 'en' ? 'Time Window' : 'Sesi Jendela Waktu'}</p>
                      <p className="text-slate-800 font-bold text-sm">{activeDetailedTicket.bookedSlots ? activeDetailedTicket.bookedSlots.map(s => s.session.split('-')[0]).join(', ') : activeDetailedTicket.session} WIB</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-normal">{language === 'en' ? 'Selected Slot' : 'Lokasi Slot Terpilih'}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="bg-indigo-600 text-white font-mono font-black px-2.5 py-1 rounded text-xs select-all">
                          {language === 'en' ? 'SLOT' : 'SLOT'} {activeDetailedTicket.bookedSlots ? activeDetailedTicket.bookedSlots.map(s => s.slotCode).join(', ') : activeDetailedTicket.slotCode}
                        </span>
                        <span className="text-[10px] text-slate-500 italic font-medium">{language === 'en' ? '(Bring this for check-in)' : '(Bawa tiket ini saat check-in)'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reschedule Action area */}
                {activeDetailedTicket.status === 'ACTIVE' && (
                  <div className="border-t border-slate-100 pt-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="text-xs">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-emerald-600" />
                        {language === 'en' ? 'Need to Reschedule?' : 'Butuh Penjadwalan Ulang (Reschedule)?'}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5 max-w-lg leading-relaxed">
                        {language === 'en' ? 'You may change your schedule date, session, or slot, provided it is done at least 48 hours before the initial start time.' : 'Anda diperbolehkan mengubah jadwal tanggal, sesi, atau slot parkir, asalkan dilakukan <strong>minimal 48 jam sebelum</strong> dimulainya jadwal awal di atas.'}
                      </p>
                    </div>

                    <button
                      id="btn-open-reschedule"
                      onClick={() => initiateReschedule(activeDetailedTicket)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-stretch md:self-auto justify-center cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{language === 'en' ? 'Request Reschedule' : 'Ajukan Reschedule'}</span>
                    </button>
                  </div>
                )}

                {/* Rescheduling Form UI */}
                {reschedulingId === activeDetailedTicket.id && (
                  <div id="reschedule-form-wizard" className="bg-slate-900 text-slate-100 rounded-2xl p-5 mt-4 space-y-4 border border-slate-800 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                        <RotateCcw className="w-4.5 h-4.5 animate-spin animate-duration-3000" />
                        {language === 'en' ? 'RESCHEDULE FORM' : 'FORMULIR PENJADWALAN ULANG (RESCHEDULE)'}
                      </h4>
                      <button
                        onClick={() => setReschedulingId(null)}
                        className="text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
                      >
                        {language === 'en' ? 'Cancel' : 'Batal'}
                      </button>
                    </div>

                    {rescheduleError && (
                      <div className="bg-rose-950/40 p-2.5 rounded border border-rose-900/60 text-rose-300 text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{rescheduleError}</span>
                      </div>
                    )}

                    {rescheduleSuccess ? (
                      <div className="bg-emerald-950/45 p-4 rounded border border-emerald-900 text-emerald-300 text-center text-xs space-y-1">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                        <p className="font-bold">{language === 'en' ? 'Reschedule Confirmed!' : 'Reschedule Berhasil Ditindaklanjuti!'}</p>
                        <p className="text-[11px] text-emerald-400/80">{language === 'en' ? 'Old slot released, new slot secured. Redirecting...' : 'Slot lama dibebaskan, slot baru berhasil diamankan. Mengalihkan...'}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleRescheduleConfirm} className="space-y-4 text-xs">
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Date input */}
                          <div>
                            <label className="block text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                              {language === 'en' ? 'New Date (Min D+2)' : 'Pilih Tanggal Reschedule Baru (Min H+2)'}
                            </label>
                            <input
                              id="input-reschedule-date"
                              type="date"
                              min={minBookingDate}
                              value={rescheduleDate}
                              onChange={(e) => {
                                setRescheduleDate(e.target.value);
                                setRescheduleSlot(null);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">{language === 'en' ? 'Today:' : 'Hari Ini:'} {formatIndoDate(currentDateStrFormatted, language)} ({language === 'en' ? 'D+2:' : 'H+2:'} {formatIndoDate(minBookingDate, language)})</p>
                          </div>

                          {/* Session input */}
                          <div>
                            <label className="block text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                              {language === 'en' ? 'New Session' : 'Pilih Sesi Baru'}
                            </label>
                            <select
                              id="select-reschedule-session"
                              value={rescheduleSession}
                              onChange={(e) => {
                                setRescheduleSession(e.target.value as DeliverySession);
                                setRescheduleSlot(null);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                            >
                              {DELIVERY_SESSIONS.map(s => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Automatic Slot Allocation Notice */}
                        <div>
                          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg mt-2">
                            <span className="text-[11px] text-slate-400 block mb-1">
                              {language === 'en' ? 'Slot Status:' : 'Status Slot:'}
                            </span>
                            <span className="text-xs text-amber-400 font-bold">
                              {language === 'en' ? 'Auto-Allocated based on load capacity' : 'Otomatis Dialokasikan berdasarkan kapasitas'}
                            </span>
                          </div>
                        </div>

                        {/* Manual slot selection removed for Reschedule */}

                        <div className="flex justify-end gap-2.5 border-t border-slate-800 pt-3">
                          <button
                            id="btn-cancel-reschedule-form"
                            type="button"
                            onClick={() => setReschedulingId(null)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-lg cursor-pointer"
                          >
                            {language === 'en' ? 'Close' : 'Tutup'}
                          </button>
                          <button
                            id="btn-confirm-reschedule"
                            type="submit"
                            className={`px-5 py-2 rounded-lg font-extrabold text-slate-950 transition cursor-pointer bg-amber-400 hover:bg-amber-300 shadow-md`}
                          >
                            {language === 'en' ? 'Confirm New Schedule' : 'Konfirmasi Jadwal Baru'}
                          </button>
                        </div>

                      </form>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Right sidebar column: informational details about dock slots */}
          <div className="space-y-6">
            
            {/* Warehouse capacity & rule book */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                {language === 'en' ? 'Logistics Arrival Rules' : 'Aturan Kedatangan Logistik'}
              </h3>
              
              <ul className="text-xs text-slate-600 space-y-3">
                <li className="flex gap-2.5">
                  <div className="w-5 h-5 bg-indigo-50 text-indigo-600 font-bold rounded-full flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    <strong className="text-slate-800 font-semibold block">{language === 'en' ? 'Mandatory D+2 Rule' : 'Regulasi Wajib H+2'}</strong>
                    {language === 'en' ? 'Dock booking must be requested at least D-2 before arrival. This allows warehouse documentation preparation.' : 'Pemesanan slot bongkar muat paling lambat harus diajukan H-2 sebelum hari kedatangan. Hal ini untuk mempersiapkan dokumen logistik gudang.'}
                  </div>
                </li>
                <li className="flex gap-2.5">
                  <div className="w-5 h-5 bg-indigo-50 text-indigo-600 font-bold rounded-full flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    <strong className="text-slate-800 font-semibold block">{language === 'en' ? 'Reschedule Rules' : 'Aturan Ketat Reschedule'}</strong>
                    {language === 'en' ? 'Rescheduling can only be done at least 48 hours prior to your initial scheduled arrival start time.' : 'Penjadwalan ulang hanya dapat dilakukan dihitung mundur minimal 48 jam sebelum sesi kedatangan awal Anda dimulai.'}
                  </div>
                </li>
                <li className="flex gap-2.5">
                  <div className="w-5 h-5 bg-indigo-50 text-indigo-600 font-bold rounded-full flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <div>
                    <strong className="text-slate-800 font-semibold block">{language === 'en' ? 'Arrival Sessions' : 'Sesi Kedatangan'}</strong>
                    {language === 'en' ? 'Delivery vehicles must be in the queue area 30 minutes before your assigned dock time session.' : 'Mobil angkutan barang harus sudah terparkir di area antrean 30 menit sebelum sesi waktu dock Anda dimulai.'}
                  </div>
                </li>
              </ul>
            </div>

            {/* Parking docks status dashboard preview */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  {language === 'en' ? 'Live Session Layout' : 'Visual Layout Sesi Hari Ini'}
                </h3>
                <span className="text-[10px] text-indigo-600 font-bold tracking-wide uppercase px-2 py-0.5 bg-indigo-50 rounded">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {language === 'en' ? 'Here is the parking dock layout (A01 - A10) for today' : 'Berikut adalah layout sebaran parkir dock utama (A01 - A10) untuk tanggal hari ini'} <strong>{formatIndoDate(currentDateStrFormatted, language)}</strong>.
              </p>

              <div className="space-y-3.5 pt-2">
                {DELIVERY_SESSIONS.map((sess) => {
                  const occupiedOnThisSess = tickets.filter(
                    t => t.deliveryDate === currentDateStrFormatted && t.session === sess.key && t.status === 'ACTIVE'
                  );
                  const isSessFull = occupiedOnThisSess.length >= 10;
                  
                  return (
                    <div key={sess.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] text-slate-800 font-bold">{sess.label.split(' ')[0]} {sess.label.substring(sess.label.indexOf('('))}</span>
                        <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded ${
                          isSessFull ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {occupiedOnThisSess.length}/10 {language === 'en' ? 'Slots Taken' : 'Slot Terisi'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1">
                        {ParkingSlots.map(sl => {
                          const taken = occupiedOnThisSess.some(t => t.slotCode === sl);
                          return (
                            <div
                              key={sl}
                              className={`py-1 text-center text-[10px] font-mono font-bold rounded ${
                                taken 
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                  : 'bg-white text-slate-500 border border-slate-200'
                              }`}
                              title={taken ? (language === 'en' ? 'Occupied' : 'Slot Terisi') : (language === 'en' ? 'Available' : 'Slot Kosong')}
                            >
                              {sl}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab: TICKET BOOKING FORM */}
      {activeTab === 'pesan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Booking form */}
          <div className="lg:col-span-2">
            
            {latestCreatedTicket ? (
              /* Booking Success view screen */
              <div id="booking-success-screen" className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-250">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-slate-950">
                    {language === 'en' ? 'Booking Successful!' : 'Pemesanan Tiket Pengiriman Berhasil!'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {language === 'en' ? 'Your booking has been saved to the main logistics system. Note and present this ticket code:' : 'Dokumen kedatangan bongkar muat Anda telah disimpan pada sistem operator logistik gudang utama. Catat dan tunjukkan kode tiket berikut:'}
                  </p>
                </div>

                {/* Digital Ticket Block layout */}
                <div className="max-w-md mx-auto bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-6 text-left relative overflow-hidden font-mono text-xs text-slate-800">
                  {/* Circle cutouts for ticket aesthetics */}
                  <div className="absolute top-1/2 -left-3 w-6 h-6 bg-white border-r border-slate-200 rounded-full -translate-y-1/2"></div>
                  <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white border-l border-slate-200 rounded-full -translate-y-1/2"></div>

                  <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{language === 'en' ? 'LOGISTICS OPERATOR' : 'OPERATOR LOGISTIK'}</p>
                      <p className="font-sans font-extrabold text-slate-900 text-sm">PT Triatra Sinergia Pratama</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{language === 'en' ? 'STATUS' : 'STATUS'}</p>
                      <p className="text-emerald-600 font-bold text-xs uppercase tracking-wider">{language === 'en' ? 'Verified' : 'Terverifikasi'}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold">{language === 'en' ? 'UNIQUE TICKET CODE' : 'KODE TIKET UNIK (KEEPSAFE)'}</p>
                      <p className="font-bold text-slate-900 text-sm select-all">{latestCreatedTicket.id}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">{language === 'en' ? 'VENDOR NAME' : 'NAMA VENDOR'}</p>
                        <p className="font-bold text-slate-800 font-sans tracking-tight">{latestCreatedTicket.vendorName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">{language === 'en' ? 'FIELD PIC' : 'PIC LAPANGAN'}</p>
                        <p className="font-bold text-slate-800 font-sans tracking-tight">{latestCreatedTicket.picName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-200/60 pt-2.5">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">{language === 'en' ? 'DELIVERY DATE' : 'TANGGAL PO'}</p>
                        <p className="font-bold text-slate-800 font-sans tracking-tight">{formatIndoDate(latestCreatedTicket.deliveryDate, language)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">{language === 'en' ? 'OPERATIONAL SESSION' : 'SESI OPERASIONAL'}</p>
                        <p className="font-bold text-slate-800 tracking-tight">{latestCreatedTicket.bookedSlots ? latestCreatedTicket.bookedSlots.map(s => s.session.split('-')[0]).join(', ') : latestCreatedTicket.session} WIB</p>
                      </div>
                    </div>

                    <div className="bg-indigo-600 text-white rounded-xl p-3 text-center space-y-0.5 border border-indigo-750">
                      <p className="text-[9px] opacity-80 uppercase font-black tracking-widest font-mono">{language === 'en' ? 'SELECTED DOCK SLOT' : 'DOCK PARKIR TERPILIH'}</p>
                      <p className="text-xl font-black font-mono tracking-wider">{language === 'en' ? 'SLOT' : 'SLOT'} {latestCreatedTicket.bookedSlots ? latestCreatedTicket.bookedSlots.map(s => s.slotCode).join(', ') : latestCreatedTicket.slotCode}</p>
                    </div>

                    <div className="pt-2 text-[10px] text-slate-400 flex flex-wrap justify-between">
                      <span>{latestCreatedTicket.quantityAmount} Qty &bull; {latestCreatedTicket.koliAmount} Koli &bull; {latestCreatedTicket.poAmount} PO</span>
                      <span>{language === 'en' ? 'Created:' : 'Dibuat:'} {new Date(latestCreatedTicket.createdAt).toLocaleTimeString()}</span>
                    </div>

                    {/* Mock barcode strip */}
                    <div className="pt-3 border-t border-slate-200/60 flex flex-col items-center">
                      <div className="w-full h-10 bg-slate-800 flex items-center justify-between px-2 text-[6px] tracking-[4px] text-slate-300 font-mono select-none overflow-hidden rounded">
                        || | ||| | |||| | || | ||| || ||| || |||| | ||| | ||| || ||| || ||| | ||| | |||| | || | ||| || ||| || |||| | ||
                      </div>
                      <p className="text-[8px] text-slate-400 font-normal tracking-widest mt-1 uppercase">{language === 'en' ? 'System Safety & Unloading Check' : 'Pemeriksaan Sistem Keamanan & Bongkar Muat'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    id="btn-print-bill"
                    onClick={() => window.print()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{language === 'en' ? 'Print PDF Ticket' : 'Cetak Tiket PDF'}</span>
                  </button>
                  <button
                    id="btn-new-booking-trigger"
                    onClick={() => setLatestCreatedTicket(null)}
                    className="bg-slate-150 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-3 rounded-xl transition cursor-pointer"
                  >
                    {language === 'en' ? 'New Booking' : 'Buat Booking Baru'}
                  </button>
                  <button
                    id="btn-track-booking-trigger"
                    onClick={() => {
                      setSearchQuery(latestCreatedTicket.id);
                      setSearchResults([latestCreatedTicket]);
                      setSelectedTicketId(latestCreatedTicket.id);
                      setHasSearched(true);
                      setActiveTab('beranda');
                      setLatestCreatedTicket(null);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Track Ticket \u2192' : 'Lacak Tiket Ini \u2192'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* The standard booking form structure */
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  {language === 'en' ? 'Ticket Submission Form & Slot Allocation' : 'Formulir Pengajuan Tiket & Alokasi Slot Parkir'}
                </h2>

                {bookingError && (
                  <div className="mb-5 bg-rose-50 text-rose-700 p-3.5 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  
                  {/* SECTION 1: Identity of Vendor */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {language === 'en' ? '1. Vendor & Field Details' : '1. Identitas Lengkap Vendor & Lapangan'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-750 mb-1">
                          {language === 'en' ? 'Vendor Contact Email' : 'Email Kontak Vendor'} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="input-vendor-email"
                            type="email"
                            required
                            placeholder="nama@perusahaankamu.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 transition"
                          />
                        </div>
                      </div>

                      {/* Vendor name input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-750 mb-1">
                          {language === 'en' ? 'Vendor Company Name' : 'Nama Perusahaan Vendor'} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-vendor-name"
                          type="text"
                          required
                          placeholder="Contoh: PT Semesta Express Logistik"
                          value={vendorName}
                          onChange={(e) => setVendorName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 transition"
                        />
                      </div>

                      {/* PIC name input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-755 mb-1">
                          Nama Penanggung Jawab Lapangan (PIC) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-vendor-pic"
                          type="text"
                          required
                          placeholder="Masukkan nama lengkap supir / pengawas"
                          value={picName}
                          onChange={(e) => setPicName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Cargo details */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      2. Estimasi Dimensi & Jumlah Muatan Barang
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                      <div>
                        <label className="block text-slate-750 font-bold mb-1">
                          Jumlah PO <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-po-amount"
                          type="number"
                          required
                          min="1"
                          placeholder="cth: 3"
                          value={poAmount}
                          onChange={(e) => setPoAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-850"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-750 font-bold mb-1">
                          Jumlah Koli <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-koli-amount"
                          type="number"
                          required
                          min="1"
                          placeholder="cth: 24"
                          value={koliAmount}
                          onChange={(e) => setKoliAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-850"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-750 font-bold mb-1">
                          Jumlah Item (SKU) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-item-amount"
                          type="number"
                          required
                          min="1"
                          placeholder="cth: 15"
                          value={itemAmount}
                          onChange={(e) => setItemAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-855"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-750 font-bold mb-1">
                          Jumlah Quantity <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-quantity-amount"
                          type="number"
                          required
                          min="1"
                          placeholder="cth: 850"
                          value={quantityAmount}
                          onChange={(e) => setQuantityAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-855 font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Allocation coordinates */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      3. Penjadwalan & Koordinat Slot Bongkar Muat
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Date input (min H+2) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-750 mb-1">
                          Tanggal Pengiriman <span className="text-rose-500">* (Min H+2)</span>
                        </label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="input-delivery-date"
                            type="date"
                            required
                            min={minBookingDate}
                            value={deliveryDate}
                            onChange={(e) => {
                              setDeliveryDate(e.target.value);
                              setSlotCode(null); // reset slot choice when date shifts
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 font-mono tracking-wider transition"
                          />
                        </div>
                        <p className="text-[10px] text-indigo-600 mt-1.5 font-medium leading-relaxed">
                          Aturan pengiriman wajib H+2. Berdasarkan jam simulasi Anda, tanggal tercepat yang diperbolehkan adalah <strong>{formatIndoDate(minBookingDate)}</strong>.
                        </p>
                      </div>

                      {/* Session selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-750 mb-1">
                          Sesi Jendela Kedatangan <span className="text-rose-500">*</span>
                        </label>
                        <select
                          id="select-delivery-session"
                          required
                          value={session}
                          onChange={(e) => {
                            setSession(e.target.value as DeliverySession);
                            setSlotCode(null); // reset slot when session changes
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 tracking-tight transition"
                        >
                          {DELIVERY_SESSIONS.map((sess) => (
                            <option key={sess.key} value={sess.key}>
                              {sess.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
                          {language === 'en' ? 'Each session has an auto-allocated capacity. Large volumes may span multiple consecutive sessions.' : 'Sistem akan secara otomatis mengalokasikan slot parkir dan memecah sesi jika muatan Anda besar (melebihi batas sesi).'}
                        </p>
                      </div>
                    </div>

                    {/* Dynamic slot codes grid removed - Auto allocation active */}
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="text-xs font-black text-indigo-900 block">{language === 'en' ? 'Automatic Capacity Allocation' : 'Alokasi Kapasitas Otomatis'}</span>
                          <span className="text-[10px] text-indigo-600/80">{language === 'en' ? 'The system will calculate the required slots based on your input quantities.' : 'Sistem akan menghitung slot yang dibutuhkan berdasarkan input kuantitas Anda.'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      * Kolom bertanda merah wajib diverifikasi keakuratannya.
                    </span>

                    <button
                      id="btn-submit-booking-form"
                      type="submit"
                      className={`px-6 py-3 rounded-xl text-xs font-black tracking-wide transition shadow cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white`}
                    >
                      Ajukan Pemesanan Tiket &rarr;
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right quick reminder column */}
          <div className="space-y-6">
            
            {/* Real-time system log checking */}
            <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-sm border border-slate-800 space-y-4 font-mono text-[11px]">
              <h3 className="font-sans font-black text-sm text-amber-400 tracking-wide flex items-center gap-1.5 uppercase">
                <CheckCircle className="w-4 h-4" />
                Validasi Otomatis Real-time
              </h3>
              
              <div className="space-y-2 text-slate-400">
                <p className="text-slate-200 border-b border-slate-800 pb-1.5">
                  &bull; Waktu server: <span className="text-indigo-400">{simulatedTime.toISOString()}</span>
                </p>

                <p className="flex justify-between">
                  <span>Input Email:</span>
                  <span className={email ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                    {email ? 'Terisi ✓' : 'Belum Terisi'}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Nama Vendor:</span>
                  <span className={vendorName ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                    {vendorName ? 'Terisi ✓' : 'Belum Terisi'}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Nama PIC Lapangan:</span>
                  <span className={picName ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                    {picName ? 'Terisi ✓' : 'Belum Terisi'}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Volumetrik Qty:</span>
                  <span className={quantityAmount && quantityAmount > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                    {quantityAmount && quantityAmount > 0 ? `${quantityAmount} Pcs ✓` : 'Wajib &gt;0'}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Min Tanggal H+2:</span>
                  <span className={deliveryDate >= minBookingDate ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
                    {deliveryDate ? `${formatIndoDate(deliveryDate)} (${deliveryDate >= minBookingDate ? 'OK' : 'DENIED'})` : 'Menunggu Tanggal'}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>{language === 'en' ? 'Slot Status:' : 'Status Slot Parkir:'}</span>
                  <span className="text-indigo-400 font-black">
                    {language === 'en' ? 'Auto-Allocated' : 'Otomatis Dialokasikan'}
                  </span>
                </p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[10px] text-slate-500 font-sans leading-relaxed">
                <strong>Ingat:</strong> Saat menekan "Ajukan Pemesanan Tiket", sistem akan mengunci slot tumpangan tersebut secara global pada local database untuk mencegah bentrok jadwal.
              </div>
            </div>

            {/* General FAQs */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                Pertanyaan Sering Diajukan (FAQ)
              </h3>
              <div className="space-y-3.5 text-xs text-slate-600">
                <div>
                  <strong className="text-slate-800 block mb-0.5">Apakah biaya per dock parkir gratis?</strong>
                  Alokasi slot parkir bongkar muat adalah gratis tanpa dipungut biaya untuk seluruh vendor partner gudang terdaftar.
                </div>
                <div>
                  <strong className="text-slate-800 block mb-0.5">Bagaimana jika supir terlambat datang?</strong>
                  Keterlambatan melebihi 20 menit pada jam sesi akan menyebabkan tiket hangus secara otomatis, harap batalkan segera jika ada hambatan.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
