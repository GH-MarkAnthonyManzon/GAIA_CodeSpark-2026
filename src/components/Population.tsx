import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin,
  Users,
  User as UserIcon
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion } from 'motion/react';

export default function Population({ isAdmin }: { isAdmin?: boolean }) {
  const [residents, setResidents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let unsub = () => {};
    if (auth.currentUser && isAdmin) {
      unsub = onSnapshot(collection(db, 'residents'), (snapshot) => {
        const allResidents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        if (allResidents.length === 0) {
          setResidents([
            { id: '1', name: 'Juan Dela Cruz', barangay: 'Cuyab', status: 'SAFE', vulnerability: 'SENIOR', role: 'OFFICIAL' },
            { id: '2', name: 'Maria Clara', barangay: 'San Roque', status: 'NEEDS_RESCUE', vulnerability: 'NONE', role: 'VOLUNTEER' },
            { id: '3', name: 'Jose Rizal', barangay: 'Poblacion', status: 'SAFE', vulnerability: 'NONE', role: 'RESPONDER' },
          ]);
        } else {
          setResidents(allResidents);
        }
      }, (error) => {
        console.error("Residents listener error in Population:", error);
      });
    } else if (!isAdmin) {
      // Non-admins see nothing or just mock data if you want, but for security we show empty
      setResidents([]);
    }
    return () => unsub();
  }, [isAdmin]);

  const filtered = residents.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.barangay.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-black tracking-tighter mb-1">Community Registry</h1>
        <p className="text-soft-gray font-medium text-sm">Managing the safety of every San Pedrense.</p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-soft-gray" />
          <input 
            type="text" 
            placeholder="Search name or barangay..." 
            className="w-full bg-white border border-accent-green/10 rounded-2xl py-4 pl-12 pr-4 text-charcoal font-bold outline-none focus:ring-2 focus:ring-primary-green/10 sampaguita-shadow placeholder:text-soft-gray/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((res) => (
          <motion.div 
            key={res.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-accent-green/10 rounded-3xl p-5 sampaguita-shadow flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  res.status === 'SAFE' ? 'bg-primary-green/10' : 'bg-alert-red/10'
                }`}>
                  <UserIcon className={`w-6 h-6 ${
                    res.status === 'SAFE' ? 'text-primary-green' : 'text-alert-red'
                  }`} />
                </div>
                <div>
                  <h4 className="font-black text-primary-green text-lg leading-none mb-1">{res.name}</h4>
                  <div className="flex items-center gap-1.5 text-soft-gray">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{res.barangay}</span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                res.status === 'SAFE' ? 'bg-primary-green/10 text-primary-green' :
                res.status === 'NEEDS_RESCUE' ? 'bg-alert-red/10 text-alert-red' :
                'bg-warning-amber/10 text-warning-amber'
              }`}>
                {res.status.replace('_', ' ')}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-accent-green/5">
              <div className="flex gap-2">
                {res.role && res.role !== 'RESIDENT' && (
                  <span className="px-2 py-1 bg-primary-green text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                    [{res.role}]
                  </span>
                )}
                {res.vulnerability !== 'NONE' && (
                  <span className="px-2 py-1 bg-warning-amber/10 text-warning-amber rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {res.vulnerability}
                  </span>
                )}
                <span className="px-2 py-1 bg-soft-gray/5 text-soft-gray rounded-lg text-[9px] font-black uppercase tracking-widest">
                  ID: {res.id.slice(0, 6)}
                </span>
              </div>
              
              <div className="bg-sampaguita-white border border-accent-green/10 rounded-xl text-[9px] font-black uppercase tracking-widest py-2 px-3 text-primary-green opacity-70">
                {res.status === 'SAFE' ? 'Safe' : 
                 res.status === 'MISSING' ? 'Missing' : 
                 res.status === 'IN_EVACUATION' ? 'Evacuating' : 
                 'Needs Rescue'}
              </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <Users className="w-12 h-12 mx-auto mb-4 text-soft-gray" />
            <p className="text-xs font-black uppercase tracking-widest text-soft-gray">No residents found</p>
          </div>
        )}
      </div>
    </div>
  );
}
