import React, { useState, useEffect, useMemo } from 'react';
import { Ticket } from './types';
import { INITIAL_TICKETS } from './utils/mockData';
import HeaderSimulasi from './components/HeaderSimulasi';
import VendorPortal from './components/VendorPortal';
import AdminPortal from './components/AdminPortal';
import { Layers, Shield, Warehouse } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'warehouse_shipping_tickets_v1';

export default function App() {
  // 1. Core database state initialized from browser localStorage or seed templates
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Gagal membaca dari localStorage, beralih ke data awal simulasi.', e);
    }
    return INITIAL_TICKETS;
  });

  // 2. Simulated Clock state - default is Saturday June 13, 2026 08:00 WIB
  const [simulatedTime, setSimulatedTime] = useState<Date>(() => {
    return new Date('2026-06-13T08:00:00');
  });

  // 3. Navigation View switcher: 'vendor' (Sisi Vendor Publik) or 'admin' (Sisi Admin Gudang)
  const [activePortal, setActivePortal] = useState<'vendor' | 'admin'>('vendor');

  // Trigger LocalStorage write on state change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.error('Gagal menulis data ke localStorage.', e);
    }
  }, [tickets]);

  // Translate simulatedTime into YYYY-MM-DD string
  const simulatedDateStr = useMemo(() => {
    const y = simulatedTime.getFullYear();
    const m = String(simulatedTime.getMonth() + 1).padStart(2, '0');
    const d = String(simulatedTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [simulatedTime]);

  // Calculate dynamic active metrics for today of simulated time
  const totalSlotsOccupiedToday = useMemo(() => {
    return tickets.filter(
      t => t.deliveryDate === simulatedDateStr && t.status === 'ACTIVE'
    ).length;
  }, [tickets, simulatedDateStr]);

  const activeTicketsCount = useMemo(() => {
    return tickets.filter(t => t.status === 'ACTIVE').length;
  }, [tickets]);

  // Core Mutation: Adding a new ticket
  const handleAddTicket = (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
  };

  // Core Mutation: Editing a ticket (e.g. reschedule slot, editing PIC name)
  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
  };

  // Core Mutation: Canceling a ticket (changes status to CANCELLED, liberating the slot)
  const handleForceCancelTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'CANCELLED' };
      }
      return t;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      
      {/* 1. TOP SIMULATION BAR */}
      <HeaderSimulasi 
        simulatedTime={simulatedTime} 
        onSetSimulatedTime={setSimulatedTime}
        activeTicketsCount={activeTicketsCount}
        totalSlotsOccupiedToday={totalSlotsOccupiedToday}
      />

      {/* 2. CORPORATE HEADER */}
      <header className="bg-white border-b border-slate-200 py-4.5 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Branding with custom Warehouse Icon */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-md shrink-0">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-orange-50 text-orange-700 font-extrabold uppercase px-2 py-0.5 rounded-full border border-orange-100 tracking-wider">
                  STPG-V1
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold uppercase px-2 py-0.5 rounded-full border border-blue-100 tracking-wider">
                  Member of ASTRA
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 mt-0.5">
                PT Triatra Sinergia Pratama
              </h1>
            </div>
          </div>

          {/* Dual portal switcher - styled beautifully like a native segmentation toggle */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/60 inline-flex items-center self-start sm:self-auto">
            <button
              id="switch-btn-vendor"
              onClick={() => setActivePortal('vendor')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activePortal === 'vendor'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Portal Vendor Publik</span>
            </button>
            
            <button
              id="switch-btn-admin"
              onClick={() => setActivePortal('admin')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activePortal === 'admin'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Portal Admin Gudang</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. MAIN WORKPLACE CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        
        {activePortal === 'vendor' ? (
          /* SISI VENDOR PUBLIK */
          <VendorPortal 
            tickets={tickets}
            onAddTicket={handleAddTicket}
            onUpdateTicket={handleUpdateTicket}
            onCancelTicket={handleForceCancelTicket}
            simulatedTime={simulatedTime}
          />
        ) : (
          /* SISI ADMIN GUDANG */
          <AdminPortal 
            tickets={tickets}
            onUpdateTicket={handleUpdateTicket}
            onCancelTicket={handleForceCancelTicket}
            simulatedTime={simulatedTime}
          />
        )}

      </main>

      {/* 4. FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-[11px] text-slate-400 mt-12 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1.5">
          <p>
            &copy; 2025 <strong>PT Triatra Sinergia Pratama</strong>. Hak Cipta Dilindungi Undang-Undang.
          </p>
          <p className="opacity-70 text-[10px]">
            prototype project by Diva & Andre
          </p>
        </div>
      </footer>

    </div>
  );
}
