import React, { useState } from 'react';
import { Clock, Calendar, Activity, RefreshCw, Info, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderSimulasiProps {
  simulatedTime: Date;
  onSetSimulatedTime: (newTime: Date) => void;
  activeTicketsCount: number;
  totalSlotsOccupiedToday: number;
}

export default function HeaderSimulasi({
  simulatedTime,
  onSetSimulatedTime,
  activeTicketsCount,
  totalSlotsOccupiedToday
}: HeaderSimulasiProps) {
  const { t, language, setLanguage } = useLanguage();
  const [showConfig, setShowConfig] = useState(false);
  const [dateInput, setDateInput] = useState('2026-06-13');
  const [timeInput, setTimeInput] = useState('08:00');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const [year, month, day] = dateInput.split('-').map(Number);
    const [hour, min] = timeInput.split(':').map(Number);
    const newDate = new Date(year, month - 1, day, hour, min, 0, 0);
    onSetSimulatedTime(newDate);
    setShowConfig(false);
  };

  const resetToDefault = () => {
    const defaultTime = new Date('2026-06-13T08:00:00');
    setDateInput('2026-06-13');
    setTimeInput('08:00');
    onSetSimulatedTime(defaultTime);
    setShowConfig(false);
  };

  const fastForwardHours = (hours: number) => {
    const nextTime = new Date(simulatedTime.getTime() + hours * 60 * 60 * 1000);
    onSetSimulatedTime(nextTime);
    
    // update inputs
    const y = nextTime.getFullYear();
    const m = String(nextTime.getMonth() + 1).padStart(2, '0');
    const d = String(nextTime.getDate()).padStart(2, '0');
    const hh = String(nextTime.getHours()).padStart(2, '0');
    const mm = String(nextTime.getMinutes()).padStart(2, '0');
    setDateInput(`${y}-${m}-${d}`);
    setTimeInput(`${hh}:${mm}`);
  };

  const formatFullDateTime = (date: Date) => {
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const daysId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const days = language === 'en' ? daysEn : daysId;
    const months = language === 'en' ? monthsEn : monthsId;
    
    const day = days[date.getDay()];
    const dateNum = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}, ${dateNum} ${month} ${year} — ${language === 'en' ? 'At' : 'Pukul'} ${hour}:${min} WIB`;
  };

  // Calculate capacity percentage (assuming 40 slots total per day)
  const capacityPct = Math.min(100, Math.round((totalSlotsOccupiedToday / 40) * 100));

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-100 z-50 relative">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          
          {/* Warehouse Metrics Stats */}
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse animate-duration-1000" />
              <span className="font-semibold text-slate-200">{t('Operasional Gudang:', 'Warehouse Operations:')}</span>
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">NORMAL</span>
            </div>
            
            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block"></div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">{t('Slot Hari Ini:', 'Today Slots:')}</span>
              <span className="font-mono text-slate-200">{totalSlotsOccupiedToday} / 40 {t('Terisi', 'Occupied')} ({capacityPct}%)</span>
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    capacityPct > 75 ? 'bg-amber-500' : 'bg-orange-500'
                  }`} 
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            </div>

            <div className="h-4 w-[1px] bg-slate-800 hidden md:block"></div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">{t('Total Tiket Aktif:', 'Total Active Tickets:')}</span>
              <span className="bg-slate-800 text-orange-400 px-2 py-0.5 rounded font-mono font-semibold">
                {activeTicketsCount} {t('Tiket', 'Tickets')}
              </span>
            </div>
          </div>

          {/* Actions: Clock and Language */}
          <div className="flex items-center gap-2 self-stretch md:self-auto">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-950/60 rounded-lg border border-slate-850 p-1">
              <button 
                onClick={() => setLanguage('id')}
                className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition ${language === 'id' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                ID
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition ${language === 'en' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                EN
              </button>
            </div>

            {/* Simulated Clock Panel trigger */}
            <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-850">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('WAKTU SIMULASI OPERASIONAL', 'OPERATIONAL SIMULATION TIME')}</p>
                  <p className="font-mono text-slate-200 text-[11px] sm:text-xs">
                    {formatFullDateTime(simulatedTime)}
                  </p>
                </div>
              </div>
              <button
                id="btn-toggle-time-sim"
                onClick={() => setShowConfig(!showConfig)}
                className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('Sesuaikan', 'Adjust')}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Time adjustment panel popover */}
        {showConfig && (
          <div className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-2.5 mb-3">
              <Info className="w-4.5 h-4.5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">
                {language === 'en' ? (
                  <>This <strong>Time Simulation</strong> feature is strictly provided to easily test the <strong>min H+2</strong> constraint and the <strong>48-hour</strong> reschedule rule by forwarding/rewinding system date.</>
                ) : (
                  <>Fitur <strong>Simulasi Waktu</strong> ini disediakan secara khusus agar penilai dapat dengan mudah menguji batasan pengiriman <strong>minimal H+2</strong> serta aturan reschedule maksimal <strong>48 jam sebelum keberangkatan</strong> dengan memajukan/memundurkan tanggal sistem.</>
                )}
              </p>
            </div>
            
            <form onSubmit={handleApply} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">{t('Tanggal Simulasi', 'Simulation Date')}</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="sim-date-input"
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 pl-9 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">{t('Waktu Simulasi (WIB)', 'Simulation Time (WIB)')}</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="sim-time-input"
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 pl-9 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 sm:col-span-2">
                <button
                  id="btn-sim-FF24"
                  type="button"
                  onClick={() => fastForwardHours(24)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded transition font-medium border border-slate-700/60 flex-1 cursor-pointer"
                >
                  {t('+24 Jam', '+24 Hours')}
                </button>
                <button
                  id="btn-sim-FF48"
                  type="button"
                  onClick={() => fastForwardHours(48)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded transition font-medium border border-slate-700/60 flex-1 cursor-pointer"
                >
                  {t('+48 Jam (2 Hari)', '+48 Hrs (2 Days)')}
                </button>
                <button
                  id="btn-sim-reset"
                  type="button"
                  onClick={resetToDefault}
                  className="bg-amber-950/40 hover:bg-amber-950/70 text-amber-300 text-xs px-2.5 py-1.5 rounded transition font-medium border border-amber-900/40 cursor-pointer"
                >
                  {t('Reset (13 Juni)', 'Reset (June 13)')}
                </button>
                <button
                  id="btn-sim-apply"
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-1.5 rounded transition cursor-pointer"
                >
                  {t('Terapkan', 'Apply')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
