import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, SlotOverride } from './types';
import { INITIAL_TICKETS } from './utils/mockData';
import HeaderSimulasi from './components/HeaderSimulasi';
import VendorPortal from './components/VendorPortal';
import AdminPortal from './components/AdminPortal';
import { Layers, Shield, Warehouse } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { db } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function App() {
  const { t } = useLanguage();
  // 1. Core database state initialized from Firestore
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [slotOverrides, setSlotOverrides] = useState<SlotOverride[]>([]);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  useEffect(() => {
    // Listen to tickets
    const unsubscribeTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      // Start with our mock data so previous data isn't lost
      const mergedTickets = [...INITIAL_TICKETS];
      
      snapshot.forEach((doc) => {
        const ticketData = { id: doc.id, ...doc.data() } as Ticket;
        const existingIdx = mergedTickets.findIndex(t => t.id === ticketData.id);
        if (existingIdx >= 0) {
          mergedTickets[existingIdx] = ticketData; // Override mock if it exists in Firebase
        } else {
          mergedTickets.push(ticketData);
        }
      });
      // sort tickets by createdAt desc
      mergedTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTickets(mergedTickets);
    }, (error) => {
      console.error("Error fetching tickets from Firestore:", error);
    });

    // Listen to slotOverrides
    const unsubscribeOverrides = onSnapshot(collection(db, 'slotOverrides'), (snapshot) => {
      const fetchedOverrides: SlotOverride[] = [];
      snapshot.forEach((doc) => {
        fetchedOverrides.push(doc.data() as SlotOverride);
      });
      setSlotOverrides(fetchedOverrides);
      setIsFirebaseLoading(false);
    }, (error) => {
      console.error("Error fetching overrides from Firestore:", error);
      setIsFirebaseLoading(false);
    });

    return () => {
      unsubscribeTickets();
      unsubscribeOverrides();
    };
  }, []);

  // 2. Simulated Clock state - default is Saturday June 13, 2026 08:00 WIB
  const [simulatedTime, setSimulatedTime] = useState<Date>(() => {
    return new Date('2026-06-13T08:00:00');
  });

  // 3. Navigation View switcher: 'vendor' (Sisi Vendor Publik) or 'admin' (Sisi Admin Gudang)
  const [activePortal, setActivePortal] = useState<'vendor' | 'admin'>('vendor');

  const handleUpdateOverride = async (override: SlotOverride) => {
    // Optimistic Update
    setSlotOverrides(prev => {
      const idx = prev.findIndex(o => o.date === override.date && o.session === override.session && o.slotCode === override.slotCode);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = override;
        return next;
      }
      return [...prev, override];
    });

    try {
      // Create a unique deterministic ID for the override document
      const docId = `${override.date}_${override.session}_${override.slotCode}`;
      await setDoc(doc(db, 'slotOverrides', docId), override);
    } catch (e) {
      console.error("Error updating override in Firestore:", e);
    }
  };

  const handleRemoveOverride = async (date: string, session: string, slotCode: string) => {
    // Optimistic Update
    setSlotOverrides(prev => prev.filter(o => !(o.date === date && o.session === session && o.slotCode === slotCode)));

    try {
      const docId = `${date}_${session}_${slotCode}`;
      await deleteDoc(doc(db, 'slotOverrides', docId));
    } catch (e) {
      console.error("Error removing override in Firestore:", e);
    }
  };

  // Translate simulatedTime into YYYY-MM-DD string
  const simulatedDateStr = useMemo(() => {
    const y = simulatedTime.getFullYear();
    const m = String(simulatedTime.getMonth() + 1).padStart(2, '0');
    const d = String(simulatedTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [simulatedTime]);

  // Sweep past active tickets to COMPLETED in the background
  useEffect(() => {
    tickets.forEach(async (t) => {
      if (t.status === 'ACTIVE' && t.deliveryDate < simulatedDateStr) {
        try {
          await setDoc(doc(db, 'tickets', t.id), { ...t, status: 'COMPLETED' }, { merge: true });
        } catch (e) {
          console.error("Error sweeping ticket to COMPLETED:", e);
        }
      }
    });
  }, [simulatedDateStr, tickets]);

  // Derived tickets for instant UI feedback (no roundtrip delay)
  const derivedTickets = useMemo(() => {
    return tickets.map(t => {
      if (t.status === 'ACTIVE' && t.deliveryDate < simulatedDateStr) {
        return { ...t, status: 'COMPLETED' as const };
      }
      return t;
    });
  }, [tickets, simulatedDateStr]);

  // Calculate dynamic active metrics for today of simulated time
  const totalSlotsOccupiedToday = useMemo(() => {
    return derivedTickets
      .filter(t => t.deliveryDate === simulatedDateStr && t.status === 'ACTIVE')
      .reduce((sum, t) => sum + (t.bookedSlots ? t.bookedSlots.length : 1), 0);
  }, [derivedTickets, simulatedDateStr]);

  const activeTicketsCount = useMemo(() => {
    return derivedTickets.filter(t => t.status === 'ACTIVE').length;
  }, [derivedTickets]);

  // Core Mutation: Adding a new ticket
  const handleAddTicket = async (newTicket: Ticket) => {
    // Optimistic Update
    setTickets(prev => [newTicket, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    try {
      await setDoc(doc(db, 'tickets', newTicket.id), newTicket);
    } catch (e) {
      console.error("Error adding ticket to Firestore:", e);
    }
  };

  // Core Mutation: Editing a ticket (e.g. reschedule slot, editing PIC name)
  const handleUpdateTicket = async (updatedTicket: Ticket) => {
    // Optimistic Update
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));

    try {
      await setDoc(doc(db, 'tickets', updatedTicket.id), updatedTicket, { merge: true });
    } catch (e) {
      console.error("Error updating ticket in Firestore:", e);
    }
  };

  // Core Mutation: Canceling a ticket (changes status to CANCELLED, liberating the slot)
  const handleForceCancelTicket = async (ticketId: string, cancelledBy?: 'ADMIN' | 'VENDOR') => {
    // Optimistic Update
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'CANCELLED', cancelledBy } : t));

    try {
      const tk = tickets.find(t => t.id === ticketId);
      if (tk) {
        await setDoc(doc(db, 'tickets', ticketId), { ...tk, status: 'CANCELLED', cancelledBy }, { merge: true });
      }
    } catch (e) {
      console.error("Error cancelling ticket in Firestore:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      
      {isFirebaseLoading && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-700">Connecting to Cloud Database...</p>
          </div>
        </div>
      )}

      {/* 1. TOP SIMULATION BAR */}
      <HeaderSimulasi 
        simulatedTime={simulatedTime} 
        onSetSimulatedTime={setSimulatedTime}
        activeTicketsCount={activeTicketsCount}
        totalSlotsOccupiedToday={totalSlotsOccupiedToday}
      />

      {/* 2. CORPORATE HEADER */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Branding with custom Warehouse Icon */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
              <Warehouse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">
                WHTIX
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Warehouse Ticketing
              </p>
            </div>
          </div>

          {/* Dual portal switcher - styled beautifully like native buttons */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              id="switch-btn-vendor"
              onClick={() => setActivePortal('vendor')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activePortal === 'vendor'
                  ? 'bg-orange-600 text-white shadow hover:bg-orange-700'
                  : 'text-orange-600 bg-white border border-orange-600 hover:bg-orange-50'
              }`}
            >
              <span>{t('Buat Tiket', 'Create Ticket')}</span>
            </button>
            
            <button
              id="switch-btn-admin"
              onClick={() => setActivePortal('admin')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activePortal === 'admin'
                  ? 'bg-orange-600 text-white shadow hover:bg-orange-700'
                  : 'text-orange-600 bg-white border border-orange-600 hover:bg-orange-50'
              }`}
            >
              <span>{t('Admin', 'Admin')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activePortal === 'vendor' ? (
          /* SISI VENDOR PUBLIK */
          <VendorPortal 
            tickets={derivedTickets}
            onAddTicket={handleAddTicket}
            onUpdateTicket={handleUpdateTicket}
            onCancelTicket={handleForceCancelTicket}
            simulatedTime={simulatedTime}
            slotOverrides={slotOverrides}
          />
        ) : (
          /* SISI ADMIN GUDANG */
          <AdminPortal 
            tickets={derivedTickets}
            onUpdateTicket={handleUpdateTicket}
            onCancelTicket={handleForceCancelTicket}
            simulatedTime={simulatedTime}
            slotOverrides={slotOverrides}
            onUpdateOverride={handleUpdateOverride}
            onRemoveOverride={handleRemoveOverride}
          />
        )}

      </main>

      {/* 4. FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-[11px] text-slate-400 mt-12 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1.5">
          <p>
            &copy; 2025 <strong>PT Triatra Sinergia Pratama</strong>. {t('Hak Cipta Dilindungi Undang-Undang.', 'All Rights Reserved.')}
          </p>
          <p className="opacity-70 text-[10px]">
            prototype project by Diva & Andre
          </p>
        </div>
      </footer>

    </div>
  );
}

