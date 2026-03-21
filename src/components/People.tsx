import React, { useState } from 'react';
import { 
  Search, 
  MapPin,
  Users,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { SAN_PEDRO_BARANGAYS } from '../constants';

interface BarangayStatus {
  name: string;
  population: number;
  safe: number;
  atRisk: number;
  trend: 'up' | 'down' | 'stable';
}

export default function People() {
  const [searchTerm, setSearchTerm] = useState('');

  // Use useMemo to generate stable but varied mock data
  const barangayStatuses: BarangayStatus[] = React.useMemo(() => {
    const priority: BarangayStatus[] = [
      { name: 'Cuyab', population: 15000, safe: 14150, atRisk: 850, trend: 'down' },
      { name: 'Landayan', population: 12000, safe: 11580, atRisk: 420, trend: 'down' },
      { name: 'San Vicente', population: 18000, safe: 17690, atRisk: 310, trend: 'down' },
      { name: 'Nueva', population: 10000, safe: 9820, atRisk: 180, trend: 'stable' },
      { name: 'Poblacion', population: 25000, safe: 24880, atRisk: 120, trend: 'stable' }
    ];

    const others: BarangayStatus[] = SAN_PEDRO_BARANGAYS
      .filter(name => !priority.find(p => p.name === name))
      .map((name, index) => {
        // Create varied numbers based on name length and index to avoid obvious patterns
        const seed = name.length + index;
        const population = 4500 + (seed * 149) % 3500;
        const atRisk = (seed * 13) % 18; // Varied small numbers 0-17
        return {
          name,
          population,
          safe: population - atRisk,
          atRisk,
          trend: seed % 3 === 0 ? 'up' : 'stable'
        };
      });

    return [...priority, ...others];
  }, []);

  const filtered = barangayStatuses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary-green rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-primary-green">Community Status</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-soft-gray">Barangay population and safety overview</p>
          </div>
        </div>
        <p className="text-xs font-medium text-soft-gray leading-relaxed mt-2">
          Monitor the safety status and population distribution across all barangays in San Pedro. This overview provides real-time insights into community well-being.
        </p>
      </header>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-soft-gray" />
          <input 
            type="text" 
            placeholder="Search barangay..." 
            className="w-full bg-white border border-accent-green/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-green/10 sampaguita-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((brgy, index) => (
          <motion.div 
            key={brgy.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-accent-green/10 rounded-[2rem] p-5 sampaguita-shadow flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-green/5 rounded-2xl flex items-center justify-center border border-accent-green/10">
                  <MapPin className="w-6 h-6 text-primary-green" />
                </div>
                <div>
                  <h4 className="font-black text-primary-green text-lg leading-none mb-1">{brgy.name}</h4>
                  <div className="flex items-center gap-1.5 text-soft-gray">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pop: {brgy.population.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                  brgy.trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
                  brgy.trend === 'down' ? 'bg-rose-50 text-rose-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${brgy.trend === 'down' ? 'rotate-180' : brgy.trend === 'stable' ? 'rotate-90' : ''}`} />
                  {brgy.trend === 'up' ? 'Improving' : brgy.trend === 'down' ? 'Critical' : 'Stable'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-accent-green/5">
              <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Safe</p>
                  <p className="text-sm font-black text-emerald-700">{brgy.safe.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">At Risk</p>
                  <p className="text-sm font-black text-rose-700">{brgy.atRisk.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Activity className="w-3.5 h-3.5 text-accent-green" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-green" 
                  style={{ width: `${(brgy.safe / brgy.population) * 100}%` }}
                />
              </div>
              <span className="text-[9px] font-black text-soft-gray uppercase tracking-widest">
                {Math.round((brgy.safe / brgy.population) * 100)}% Secure
              </span>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-[2rem] border border-dashed border-accent-green/20">
            <Users className="w-12 h-12 mx-auto mb-4 text-soft-gray opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest text-soft-gray opacity-40">No barangay found</p>
          </div>
        )}
      </div>
    </div>
  );
}
