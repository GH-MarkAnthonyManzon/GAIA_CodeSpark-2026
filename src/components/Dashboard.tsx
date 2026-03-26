import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Package, 
  Activity,
  Info,
  ChevronRight,
  Phone,
  WifiOff,
  Building2
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  onNavigate?: (tab: 'map' | 'people' | 'inventory' | 'volunteer' | 'alert') => void;
  isAdmin?: boolean;
}

export default function Dashboard({ onNavigate, isAdmin = false }: DashboardProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showHotlines, setShowHotlines] = useState(false);
  const [allCallSms, setAllCallSms] = useState(false);
  const [stats, setStats] = useState({
    totalResidents: 0,
    safe: 0,
    needsRescue: 0,
    missing: 0,
    inEvacuation: 0,
    lguAyuda: 450, // Mock data
    donations: 120, // Mock data
    activeTasks: 0
  });

  const [deploymentLogs] = useState([
    { item: '10 boxes of rice', destination: 'Brgy. Cuyab', time: '2 hrs ago' },
    { item: '50 hygiene kits', destination: 'Brgy. Landayan', time: '5 hrs ago' },
    { item: '20 water gallons', destination: 'Brgy. San Vicente', time: '1 day ago' },
  ]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cache logic: Save stats to localStorage
    const savedStats = localStorage.getItem('sentinel_stats');
    if (savedStats && !navigator.onLine) {
      setStats(JSON.parse(savedStats));
    }

    let unsubResidents = () => {};
    let unsubInventory = () => {};
    let unsubTasks = () => {};

    if (auth.currentUser) {
      if (isAdmin) {
        unsubResidents = onSnapshot(collection(db, 'residents'), (snapshot) => {
          const docs = snapshot.docs.map(d => d.data());
          const newStats = {
            ...stats,
            totalResidents: docs.length,
            safe: docs.filter(d => d.status === 'SAFE').length,
            needsRescue: docs.filter(d => d.status === 'NEEDS_RESCUE').length,
            missing: docs.filter(d => d.status === 'MISSING').length,
            inEvacuation: docs.filter(d => d.status === 'IN_EVACUATION').length,
          };
          setStats(prev => ({ ...prev, ...newStats }));
          localStorage.setItem('sentinel_stats', JSON.stringify(newStats));
        }, (error) => {
          console.error("Residents listener error in Dashboard:", error);
        });
      }

      unsubInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
        setStats(prev => ({ ...prev, inventoryItems: snapshot.size }));
      }, (error) => {
        console.error("Inventory listener error in Dashboard:", error);
      });

      unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
        setStats(prev => ({ ...prev, activeTasks: snapshot.docs.filter(d => d.data().status === 'OPEN').length }));
      }, (error) => {
        console.error("Tasks listener error in Dashboard:", error);
      });
    }

    return () => {
      unsubResidents();
      unsubInventory();
      unsubTasks();
    };
  }, [isAdmin]);

  const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-white p-5 rounded-3xl border border-accent-green/10 sampaguita-shadow flex flex-col gap-3"
    >
      <div className={`w-10 h-10 ${colorClass.replace('text-', 'bg-').replace('primary-green', 'primary-green/10').replace('alert-red', 'alert-red/10').replace('warning-amber', 'warning-amber/10').replace('accent-green', 'accent-green/10')} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div>
        <p className="text-soft-gray text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-primary-green">{value.toLocaleString()}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 pb-10 watercolor-bg">
      {isOffline && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-alert-red text-white py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
        >
          <WifiOff className="w-3 h-3" />
          Offline Mode: Showing last saved data
        </motion.div>
      )}

      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 text-primary-green">Good Day!</h1>
          <p className="text-soft-gray font-medium text-sm tracking-wide">San Pedro is currently <span className="text-accent-green font-bold">Safe & Monitored</span>.</p>
        </div>
        <button 
          onClick={() => setShowHotlines(!showHotlines)}
          className="bg-primary-green text-white p-3 rounded-2xl shadow-lg hover:bg-primary-green/90 transition-all flex items-center gap-2"
        >
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Quick Call</span>
          <Phone className="w-5 h-5" />
        </button>
      </header>

      <AnimatePresence>
        {showHotlines && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border-2 border-primary-green/20 rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-xs font-black uppercase tracking-widest text-primary-green flex items-center gap-2">
              <Phone className="w-3 h-3" /> Quick Call Directory
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { name: 'Rescue (CDRRMO)', phone: '8808-2020' },
                { name: 'Police (PNP)', phone: '8808-2021' },
                { name: 'Fire (BFP)', phone: '8808-2022' }
              ].map(h => (
                <div key={h.name} className="flex flex-col gap-2 p-4 bg-sampaguita-white rounded-2xl border border-accent-green/5 hover:border-primary-green transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-primary-green">{h.name}</span>
                    <span className="text-xs font-black text-accent-green">{h.phone}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <a 
                      href={`tel:${h.phone}`}
                      className="flex-1 bg-primary-green text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Phone className="w-3 h-3" /> Call
                    </a>
                    <a 
                      href={`sms:${h.phone}`}
                      className="flex-1 border border-primary-green text-primary-green py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Activity className="w-3 h-3" /> SMS
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="grid grid-cols-2 gap-4">
        <StatCard label="LGU Ayuda" value={stats.lguAyuda} icon={Package} colorClass="text-primary-green" />
        <StatCard label="Donations" value={stats.donations} icon={ShieldCheck} colorClass="text-accent-green" />
      </div>

      {/* Deployment View */}
      <section className="bg-white border border-accent-green/10 rounded-3xl p-6 sampaguita-shadow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary-green">Deployment Logs</h3>
          <span className="text-[10px] font-bold text-soft-gray">RECENT ACTIVITY</span>
        </div>
        <div className="space-y-3">
          {deploymentLogs.map((log, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-sampaguita-white rounded-2xl border border-accent-green/5">
              <div>
                <p className="font-black text-sm text-primary-green">{log.item}</p>
                <p className="text-[10px] font-bold text-soft-gray uppercase tracking-widest mt-0.5">Sent to {log.destination}</p>
              </div>
              <span className="text-[9px] font-black text-accent-green uppercase tracking-widest">{log.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="bg-white border border-accent-green/10 rounded-3xl p-6 sampaguita-shadow">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary-green mb-6">Infrastructure & Buildings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-alert-red/5 rounded-2xl border border-alert-red/10">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-alert-red" />
              <div>
                <p className="font-bold text-sm text-charcoal">Old Cuyab Bridge</p>
                <p className="text-[9px] font-black text-alert-red uppercase tracking-widest">Weak Spot</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate?.('map')}
              className="text-[9px] font-black text-primary-green uppercase tracking-widest border border-primary-green/20 px-3 py-1.5 rounded-xl hover:bg-primary-green hover:text-white transition-all"
            >
              View on Map
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-primary-green/5 rounded-2xl border border-primary-green/10">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-primary-green" />
              <div>
                <p className="font-bold text-sm text-charcoal">Cuyab Warehouse</p>
                <p className="text-[9px] font-black text-primary-green uppercase tracking-widest">Main Storage</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate?.('map')}
              className="text-[9px] font-black text-primary-green uppercase tracking-widest border border-primary-green/20 px-3 py-1.5 rounded-xl hover:bg-primary-green hover:text-white transition-all"
            >
              View on Map
            </button>
          </div>
        </div>
      </section>

      {/* Community Care Section */}
      <section className="bg-primary-green rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <h3 className="text-xl font-black mb-2 tracking-tight text-white">Ayuda Transparency</h3>
        <p className="text-white/80 text-xs font-medium leading-relaxed mb-6">
          Sentinel ensures that every Sampaguita petal—every piece of aid—reaches those in need. View our real-time distribution logs.
        </p>
        <button 
          onClick={() => onNavigate?.('inventory')}
          className="bg-white text-primary-green font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-sampaguita-white transition-colors"
        >
          View Report
          <ChevronRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
