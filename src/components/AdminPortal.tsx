import React, { useState, useMemo } from 'react';
import { Ticket, DELIVERY_SESSIONS, ParkingSlots } from '../types';
import { formatIndoDate } from '../utils/mockData';
import { 
  Lock, 
  Key, 
  Filter, 
  Edit3, 
  Trash2, 
  LayoutDashboard, 
  CheckCircle, 
  XCircle, 
  Search, 
  FileSpreadsheet, 
  User, 
  Calendar, 
  Clock, 
  RefreshCw,
  LogOut,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminPortalProps {
  tickets: Ticket[];
  onUpdateTicket: (updated: Ticket) => void;
  onCancelTicket: (ticketId: string) => void;
  simulatedTime: Date;
}

export default function AdminPortal({
  tickets,
  onUpdateTicket,
  onCancelTicket,
  simulatedTime
}: AdminPortalProps) {
  const { t, language } = useLanguage();
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // format: YYYY-MM
  const [adminSearch, setAdminSearch] = useState('');

  // Editing PIC States
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editingPicName, setEditingPicName] = useState('');

  // Handle Login Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Static credentials: admin / whsjkttriatra
    if (username.trim() === 'admin' && password === 'whsjkttriatra') {
      setIsLoggedIn(true);
      // seed admin token in session storage to remember login in this trial
      try {
        sessionStorage.setItem('admin_session', 'true');
      } catch (err) {}
    } else {
      setLoginError(t('Kredensial salah! Silakan periksa kembali username dan password Anda.', 'Invalid credentials! Please check your username and password.') as string);
    }
  };

  // Check persistent session on mount
  React.useEffect(() => {
    try {
      if (sessionStorage.getItem('admin_session') === 'true') {
        setIsLoggedIn(true);
      }
    } catch (err) {}
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    try {
      sessionStorage.removeItem('admin_session');
    } catch (err) {}
  };

  // Generate list of available months in ticket DB for filtering
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    tickets.forEach(t => {
      if (t.deliveryDate) {
        // YYYY-MM-DD -> extract YYYY-MM
        const monthPart = t.deliveryDate.substring(0, 7);
        months.add(monthPart);
      }
    });
    // convert and sort
    return Array.from(months).sort();
  }, [tickets]);

  // Translate YYYY-MM to Indonesian Month String
  const getIndoMonthLabel = (yearMonthStr: string) => {
    if (!yearMonthStr) return '';
    const [year, month] = yearMonthStr.split('-');
    const INDO_MONTHS = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const idx = parseInt(month, 10) - 1;
    return `${INDO_MONTHS[idx]} ${year}`;
  };

  // Filter logic
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Month filter matching
      if (selectedMonth !== 'ALL') {
        const tMonth = t.deliveryDate.substring(0, 7);
        if (tMonth !== selectedMonth) return false;
      }

      // Search matching (Ticket ID, Vendor Name, PIC Name, Email)
      if (adminSearch.trim()) {
        const query = adminSearch.toLowerCase();
        const idMatch = t.id.toLowerCase().includes(query);
        const vendorMatch = t.vendorName.toLowerCase().includes(query);
        const picMatch = t.picName.toLowerCase().includes(query);
        const emailMatch = t.email.toLowerCase().includes(query);
        const slotStr = t.bookedSlots ? t.bookedSlots.map(s => s.slotCode).join(', ') : t.slotCode;
        const slotMatch = slotStr.toLowerCase().includes(query);
        
        return idMatch || vendorMatch || picMatch || emailMatch || slotMatch;
      }

      return true;
    });
  }, [tickets, selectedMonth, adminSearch]);

  // Operational statistics computed from the filtered set
  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const active = filteredTickets.filter(t => t.status === 'ACTIVE').length;
    const cancelled = total - active;
    
    // total volumetric calculations
    let totalPO = 0;
    let totalKoli = 0;
    let totalItems = 0;
    let totalQty = 0;

    filteredTickets.forEach(t => {
      if (t.status === 'ACTIVE') {
        totalPO += t.poAmount;
        totalKoli += t.koliAmount;
        totalItems += t.itemAmount;
        totalQty += t.quantityAmount;
      }
    });

    return { total, active, cancelled, totalPO, totalKoli, totalItems, totalQty };
  }, [filteredTickets]);

  // Real-time Simulation Summary calculations based on simulatedTime
  const currentDateStrStr = useMemo(() => {
    const y = simulatedTime.getFullYear();
    const m = String(simulatedTime.getMonth() + 1).padStart(2, '0');
    const d = String(simulatedTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [simulatedTime]);

  const currentMonthStr = useMemo(() => {
    const y = simulatedTime.getFullYear();
    const m = String(simulatedTime.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [simulatedTime]);

  const activeTodayCount = useMemo(() => {
    return tickets
      .filter(t => t.deliveryDate === currentDateStrStr && t.status === 'ACTIVE')
      .reduce((sum, t) => sum + (t.bookedSlots ? t.bookedSlots.length : 1), 0);
  }, [tickets, currentDateStrStr]);

  // percentage of slots filled today (max 40 slots per day: 10 docks * 4 sessions = 40)
  const slotOccupancyPercent = useMemo(() => {
    return Math.min(100, Math.round((activeTodayCount / 40) * 105) / 1.05); // Standard rounding calculation
  }, [activeTodayCount]);

  // total cancelled tickets this month (status CANCELLED & delivery date within this month)
  const cancelledThisMonthCount = useMemo(() => {
    return tickets.filter(t => {
      const isCancelled = t.status === 'CANCELLED';
      const isThisMonth = t.deliveryDate && t.deliveryDate.substring(0, 7) === currentMonthStr;
      return isCancelled && isThisMonth;
    }).length;
  }, [tickets, currentMonthStr]);

  // total tickets this month (any status & delivery date within this month)
  const totalThisMonthCount = useMemo(() => {
    return tickets.filter(t => t.deliveryDate && t.deliveryDate.substring(0, 7) === currentMonthStr).length;
  }, [tickets, currentMonthStr]);

  // calculated cancellation rate for the current month
  const cancellationRate = useMemo(() => {
    return totalThisMonthCount > 0 
      ? Math.round((cancelledThisMonthCount / totalThisMonthCount) * 100) 
      : 0;
  }, [cancelledThisMonthCount, totalThisMonthCount]);

  // Inline editor actions for PIC modification
  const startEditingPic = (ticket: Ticket) => {
    setEditingTicketId(ticket.id);
    setEditingPicName(ticket.picName);
  };

  const savePicChange = (ticketId: string) => {
    const orig = tickets.find(t => t.id === ticketId);
    if (!orig) return;

    if (!editingPicName.trim()) {
      alert('Nama PIC tidak boleh kosong.');
      return;
    }

    const updated: Ticket = {
      ...orig,
      picName: editingPicName.trim(),
    };

    onUpdateTicket(updated);
    setEditingTicketId(null);
  };

  // Force cancel ticket action (liberates dock slot immediately)
  const handleForceCancel = (ticketId: string, slotCode: string) => {
    const cMsg = `PERINGATAN ADMIN!\n\nApakah Anda yakin ingin MEMBATALKAN SECARA PAKSA tiket pengiriman "${ticketId}"?\n\nTindakan ini akan membebaskan kembali slot dock "${slotCode}" ke publik agar dapat dipesan oleh vendor logistik lain.`;
    if (confirm(cMsg)) {
      onCancelTicket(ticketId);
    }
  };

  // Triggering native JavaScript CSV export & download file
  const exportFilteredToCSV = () => {
    if (filteredTickets.length === 0) {
      alert('Tidak ada data tiket yang tersaring untuk diekspor ke CSV.');
      return;
    }

    // CSV header row matching RFC 4180
    const headers = [
      'Kode Tiket',
      'Email Vendor',
      'Nama Vendor',
      'Nama PIC',
      'Tanggal Pengiriman',
      'Sesi Waktu',
      'Slot Parkir',
      'Jumlah PO',
      'Jumlah Koli',
      'Jumlah Item',
      'Jumlah Quantity',
      'Waktu Registrasi',
      'Status Operasional'
    ];

    // CSV body rows, escaping commas and quotes
    const rows = filteredTickets.map(t => [
      t.id,
      t.email,
      t.vendorName.replace(/"/g, '""'),
      t.picName.replace(/"/g, '""'),
      t.deliveryDate,
      t.session,
      t.bookedSlots ? t.bookedSlots.map(s => s.slotCode).join(' & ') : t.slotCode,
      t.poAmount,
      t.koliAmount,
      t.itemAmount,
      t.quantityAmount,
      t.createdAt,
      t.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    // Create a client-side Blob containing the text/csv format
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link element
    const link = document.createElement('a');
    link.href = url;
    
    // Filename setting based on dynamic filters
    const monthSuffix = selectedMonth === 'ALL' ? 'semua_periode' : selectedMonth;
    link.setAttribute('download', `rekap_tiket_gudang_${monthSuffix}.csv`);
    
    // Click action trigger
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Free the object URL
    URL.revokeObjectURL(url);
  };

  // Renders login screen if unauthorized
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12">
        <div id="admin-login-card" className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-250">
          
          {/* Header Banner */}
          <div className="bg-slate-900 px-6 py-8 text-center text-slate-100 border-b border-slate-850 relative">
            <div className="absolute top-2 right-2 bg-orange-500/10 text-orange-400 border border-orange-500/25 rounded font-mono text-[9px] px-1.5 font-bold">
              {t('PORTAL ADMIN', 'ADMIN PORTAL')}
            </div>
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">{t('Operator Portal — PT Triatra Sinergia Pratama', 'Operator Portal — PT Triatra Sinergia Pratama')}</h1>
            <p className="text-xs text-slate-400 mt-1">{t('Gunakan kredensial pengawas resmi untuk masuk mengelola slot parkir', 'Use official supervisor credentials to manage parking slots')}</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            
            {loginError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl border border-rose-200 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Username Operator', 'Operator Username')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-username-input"
                  type="text"
                  required
                  placeholder="user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:ring-1 focus:ring-orange-500 focus:outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Password Keamanan', 'Security Password')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-password-input"
                  type="password"
                  required
                  placeholder="passadmin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:ring-1 focus:ring-orange-500 focus:outline-none text-slate-850"
                />
              </div>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm"
            >
              {t('Masuk Dashboard Admin', 'Enter Admin Dashboard')}
            </button>

          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Admin Dashboard header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
              {t('Portal Operator Gudang Triatra', 'Triatra Warehouse Operator Portal')}
              <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold uppercase px-2 py-0.5 rounded-full border border-blue-100 tracking-wider">
                ASTRA GROUP
              </span>
            </h1>
            <p className="text-xs text-slate-500">{t('Manajemen antrean, monitoring alokasi dock, dan rekapitulasi data', 'Queue management, dock allocation monitoring, and data summary')}</p>
          </div>
        </div>

        <button
          id="btn-admin-logout"
          onClick={handleLogout}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>{t('Keluar Portal', 'Logout from Portal')}</span>
        </button>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('Tiket Terfilter', 'Filtered Tickets')}</p>
          <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{stats.total} <span className="text-xs text-slate-400 font-normal">{t('registrasi', 'registrations')}</span></p>
          <div className="mt-2 text-[10px] text-slate-500 flex gap-2">
            <span className="text-emerald-600 font-bold">{stats.active} {t('Aktif', 'Active')}</span>
            <span>&bull;</span>
            <span className="text-rose-500 font-bold">{stats.cancelled} {t('Batal', 'Cancelled')}</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('Total Quantity Aktif', 'Total Active Quantity')}</p>
          <p className="text-2xl font-black text-orange-600 mt-1 font-mono">{stats.totalQty.toLocaleString()}</p>
          <p className="mt-2 text-[10px] text-slate-400 font-medium">{t('Bahan unit muatan terdaftar', 'Registered payload units')}</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('Jumlah Dokumen PO', 'Total PO Documents')}</p>
          <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{stats.totalPO} <span className="text-xs text-slate-400 font-normal">{t('berkas', 'files')}</span></p>
          <p className="mt-2 text-[10px] text-slate-400 font-medium">{t('Sertifikasi purchase order', 'Purchase order certification')}</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('Jumlah Koli Terangkut', 'Total Transported Koli')}</p>
          <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{stats.totalKoli} <span className="text-xs text-slate-400 font-normal">{t('dus', 'boxes')}</span></p>
          <p className="mt-2 text-[10px] text-slate-400">{t('Total berat kiriman teregistrasi', 'Total registered shipment weight')}</p>
        </div>

      </div>

      {/* Real-Time Simulation Stats Card Row (Persentase slot terisi, tiket aktif hari ini, batal bulan ini) */}
      <div id="simulated-real-time-summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Persentase Slot Terisi */}
        <div id="stat-card-occupancy-percent" className="bg-white p-5 rounded-2xl border border-slate-150 border-l-4 border-l-orange-600 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{t('UTILISASI SLOTS DOCK', 'DOCK SLOTS UTILIZATION')}</p>
              <span className="text-[9px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-full border border-blue-100 tracking-wider">ASTRA INTERNAL</span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {slotOccupancyPercent % 1 === 0 ? slotOccupancyPercent.toFixed(0) : slotOccupancyPercent.toFixed(1)}%
              </p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                slotOccupancyPercent > 75 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : slotOccupancyPercent > 40 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {slotOccupancyPercent > 75 ? t('Padat', 'Busy') : slotOccupancyPercent > 40 ? t('Optimal', 'Optimal') : t('Senggang', 'Available')}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${slotOccupancyPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-2 font-semibold flex justify-between">
              <span>{t('Terisi:', 'Occupied:')} {activeTodayCount} {t('Slot', 'Slots')}</span>
              <span>{t('Kapasitas Efektif:', 'Effective Capacity:')} 40 {t('Slot', 'Slots')}</span>
            </div>
          </div>
        </div>

        {/* Tiket Aktif Hari Ini */}
        <div id="stat-card-active-today" className="bg-white p-5 rounded-2xl border border-slate-150 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{t('TIKET AKTIF HARI INI', 'ACTIVE TICKETS TODAY')}</p>
              <div className="w-6 h-6 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2.5 font-mono tracking-tight">
              {activeTodayCount} <span className="text-xs text-slate-400 font-normal">{t('tiket aktif', 'active tickets')}</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{t('Tanggal:', 'Date:')} <strong className="text-slate-800">{formatIndoDate(currentDateStrStr, language)}</strong></span>
            </p>
            <div className="text-[9px] bg-slate-50 text-slate-500 p-1.5 rounded border border-slate-100 flex justify-between items-center">
              <span>{t('Status Operasional', 'Operational Status')}</span>
              <span className="text-emerald-600 font-extrabold">LIVE</span>
            </div>
          </div>
        </div>

        {/* Tiket Dibatalkan Bulan Ini dengan Rasio SLA */}
        <div id="stat-card-cancelled-this-month" className="bg-white p-5 rounded-2xl border border-slate-150 border-l-4 border-l-slate-400 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{t('REKAPITULASI PEMBATALAN', 'CANCELLATION SUMMARY')}</p>
              <div className="w-6 h-6 bg-red-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
                <XCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-3xl font-black text-rose-600 mt-2.5 font-mono tracking-tight">
              {cancelledThisMonthCount} <span className="text-xs text-slate-400 font-normal">{t('tiket', 'tickets')}</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1">
              <span>{t('SLA Kebatalan Bulanan', 'Monthly Cancellation SLA')}</span>
              <span className={cancellationRate > 15 ? 'text-rose-600' : 'text-emerald-600'}>
                {cancellationRate}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-1 rounded-full transition-all duration-500 ${cancellationRate > 15 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(100, cancellationRate)}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5 leading-tight">
              {t('Dari rentang total', 'From a total of')} <strong>{totalThisMonthCount}</strong> {t('kuota pengiriman bulan ini', 'delivery quotas this month')} ({getIndoMonthLabel(currentMonthStr)}).
            </p>
          </div>
        </div>

      </div>

      {/* Parking docks status dashboard preview */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
            {t('Live Session Layout', 'Visual Layout Sesi Hari Ini')}
          </h3>
          <span className="text-[10px] text-indigo-600 font-bold tracking-wide uppercase px-2 py-0.5 bg-indigo-50 rounded">
            Live
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          {t('Here is the parking dock layout (A01 - A10) for today', 'Berikut adalah layout sebaran parkir dock utama (A01 - A10) untuk tanggal hari ini')} <strong>{formatIndoDate(currentDateStrStr, language)}</strong>.
        </p>

        <div className="space-y-3.5 pt-2">
          {DELIVERY_SESSIONS.map((sess) => {
            const occupiedOnThisSess = tickets.filter(
              tk => tk.deliveryDate === currentDateStrStr && tk.status === 'ACTIVE'
            ).flatMap(tk => tk.bookedSlots ? tk.bookedSlots.filter(s => s.session === sess.key).map(s => s.slotCode) : (tk.session === sess.key ? [tk.slotCode] : []));
            
            const isSessFull = occupiedOnThisSess.length >= 10;
            
            return (
              <div key={sess.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] text-slate-800 font-bold">{sess.label.split(' ')[0]} {sess.label.substring(sess.label.indexOf('('))}</span>
                  <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded ${
                    isSessFull ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {occupiedOnThisSess.length}/10 {t('Slots Taken', 'Slot Terisi')}
                  </span>
                </div>
                
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                  {ParkingSlots.map(sl => {
                    const taken = occupiedOnThisSess.includes(sl);
                    return (
                      <div
                        key={sl}
                        className={`py-1 text-center text-[10px] font-mono font-bold rounded ${
                          taken 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                            : 'bg-white text-slate-500 border border-slate-200'
                        }`}
                        title={taken ? t('Occupied', 'Slot Terisi') as string : t('Available', 'Slot Kosong') as string}
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

      {/* Control panel: Filters & CSV exports */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
            
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-search-input"
                type="text"
                placeholder={t('Cari Agen, Vendor, PIC, Slot (contoh: A05)...', 'Search Agent, Vendor, PIC, Slot (e.g., A05)...')}
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
              />
            </div>

            {/* Month Filter Selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="admin-month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none text-slate-700 font-sans pr-1"
              >
                <option value="ALL">{t('Semua Bulan Pengiriman', 'All Delivery Months')}</option>
                {availableMonths.map(mon => (
                  <option key={mon} value={mon}>
                    {getIndoMonthLabel(mon)}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Export to CSV Trigger Button */}
          <button
            id="btn-admin-export-csv"
            onClick={exportFilteredToCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('Ekspor ke CSV (.csv)', 'Export to CSV (.csv)')}</span>
          </button>
        </div>

      </div>

      {/* Main Database Table view */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {filteredTickets.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Inbox className="w-14 h-14 mx-auto text-slate-200 mb-2" />
            <p className="text-sm font-bold text-slate-600">{t('Tidak Ada Data Tiket Cocok', 'No Matching Ticket Data')}</p>
            <p className="text-xs mt-1 max-w-xs mx-auto">{t('Sesuaikan filter pencarian atau saringan bulan pengujian.', 'Adjust the search filter or testing month filter.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-100 uppercase font-bold text-[10px] tracking-wider border-b border-slate-850">
                  <th className="px-4.5 py-3">{t('Kode Tiket', 'Ticket Code')}</th>
                  <th className="px-4.5 py-3">{t('Jadwal Pengiriman', 'Delivery Schedule')}</th>
                  <th className="px-4.5 py-3">{t('Dock/Slot', 'Dock/Slot')}</th>
                  <th className="px-4.5 py-3">{t('Vendor / PIC', 'Vendor / PIC')}</th>
                  <th className="px-4.5 py-3 text-right">{t('Volumetrik Cargo', 'Cargo Volumetric')}</th>
                  <th className="px-4.5 py-3 text-center">{t('Status', 'Status')}</th>
                  <th className="px-4.5 py-3 text-right">{t('Tindakan Admin', 'Admin Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTickets.map((t) => {
                  const isEditing = editingTicketId === t.id;
                  
                  return (
                    <tr 
                      key={t.id} 
                      id={`admin-row-${t.id}`}
                      className={`hover:bg-slate-50 transition ${t.status === 'CANCELLED' ? 'bg-slate-50/50 opacity-70' : ''}`}
                    >
                      {/* Ticket unique code */}
                      <td className="px-4.5 py-3.5">
                        <span className="font-mono font-bold text-slate-900 block select-all">{t.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono italic block mt-0.5 select-none font-normal">Reg: {new Date(t.createdAt).toLocaleDateString()}</span>
                      </td>

                      {/* Schedule info */}
                      <td className="px-4.5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatIndoDate(t.deliveryDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sesi: {t.bookedSlots ? t.bookedSlots.map(s => s.session.split('-')[0]).join(', ') : t.session} WIB</span>
                        </div>
                      </td>

                      {/* Dock/Slot */}
                      <td className="px-4.5 py-3.5 text-center">
                        <span className={`font-mono font-black text-[11px] px-2.5 py-1 rounded inline-block ${
                          t.status === 'ACTIVE' 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {t.bookedSlots ? t.bookedSlots.map(s => s.slotCode).join(', ') : t.slotCode}
                        </span>
                      </td>

                      {/* Vendor & PIC inline editing */}
                      <td className="px-4.5 py-3.5 max-w-[200px]">
                        <span className="text-slate-900 font-extrabold block truncate" title={t.vendorName}>
                          {t.vendorName}
                        </span>
                        
                        {isEditing ? (
                          <div className="flex items-center gap-1 mt-1.5">
                            <input
                              id={`input-edit-pic-${t.id}`}
                              type="text"
                              value={editingPicName}
                              onChange={(e) => setEditingPicName(e.target.value)}
                              className="bg-white border border-indigo-400 rounded px-2 py-1 text-slate-800 font-sans focus:outline-none text-[11px] w-full shadow-sm"
                            />
                            <button
                              id={`btn-save-edit-pic-${t.id}`}
                              onClick={() => savePicChange(t.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-1 rounded transition text-[10px]"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingTicketId(null)}
                              className="bg-slate-300 hover:bg-slate-200 text-slate-700 font-bold p-1 rounded transition text-[10px]"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group mt-0.5">
                            <span className="text-xs text-slate-600">
                              PIC: <strong className="text-slate-800 font-semibold">{t.picName}</strong>
                            </span>
                            {t.status === 'ACTIVE' && (
                              <button
                                id={`btn-trigger-edit-pic-${t.id}`}
                                onClick={() => startEditingPic(t)}
                                className="text-indigo-600 hover:text-indigo-800 opacity-80 hover:opacity-100 transition p-0.5 cursor-pointer"
                                title="Edit Nama PIC"
                              >
                                <Edit3 className="w-3.5 h-3.5 inline" />
                              </button>
                            )}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono block truncate select-all">{t.email}</span>
                      </td>

                      {/* Quantities */}
                      <td className="px-4.5 py-3.5 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-900 block font-mono text-xs">{t.quantityAmount.toLocaleString()} Pcs</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{t.koliAmount} Koli / {t.poAmount} PO</span>
                      </td>

                      {/* Status badge */}
                      <td className="px-4.5 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full inline-flex items-center gap-1 ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {t.status === 'ACTIVE' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Batal</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Administrative actions */}
                      <td className="px-4.5 py-3.5 text-right whitespace-nowrap">
                        {t.status === 'ACTIVE' ? (
                          <button
                            id={`btn-admin-cancel-${t.id}`}
                            onClick={() => handleForceCancel(t.id, t.bookedSlots ? t.bookedSlots.map(s=>s.slotCode).join(', ') : t.slotCode)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 inline-flex cursor-pointer text-[11px]"
                            title="Batalkan Tiket & Lepaskan Slot Parkir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Batal Paksa</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Slot Bebas</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
