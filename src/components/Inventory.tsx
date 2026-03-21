import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Minus, 
  QrCode, 
  ArrowUpRight, 
  ArrowDownLeft,
  Warehouse,
  Search,
  ChevronRight,
  X
} from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { SAN_PEDRO_BARANGAYS } from '../constants';

export default function Inventory({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showMapPrompt, setShowMapPrompt] = useState(false);
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [showDeployedModal, setShowDeployedModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, location: SAN_PEDRO_BARANGAYS[0] });

  useEffect(() => {
    let unsub = () => {};
    if (auth.currentUser) {
      unsub = onSnapshot(collection(db, 'inventory'), (snapshot) => {
        const user = auth.currentUser;
        const allItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        // Role-based access: only view own entries
        if (user && !user.isAnonymous) {
          setItems(allItems.filter(i => i.createdBy === user.uid));
        } else {
          setItems(allItems);
        }
      }, (error) => {
        console.error("Inventory listener error:", error);
      });
    }
    return () => unsub();
  }, []);

  const adjustQuantity = async (id: string, amount: number) => {
    const item = items.find(i => i.id === id);
    if (item && item.quantity + amount < 0) return;
    
    await updateDoc(doc(db, 'inventory', id), {
      quantity: increment(amount),
      updatedAt: serverTimestamp()
    });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Number(newItem.quantity);
    if (quantity <= 0) return;
    
    const user = auth.currentUser;
    await addDoc(collection(db, 'inventory'), {
      ...newItem,
      quantity: quantity,
      createdBy: user?.uid || 'anonymous',
      updatedAt: serverTimestamp()
    });
    setIsAdding(false);
    setNewItem({ name: '', quantity: 0, location: SAN_PEDRO_BARANGAYS[0] });
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10 watercolor-bg">
      <header>
        <h2 className="text-3xl font-black text-primary-green tracking-tighter">Stockroom Ledger</h2>
        <p className="text-soft-gray font-medium text-sm">Manage emergency supplies and distribution logs.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowReceivedModal(true)}
          className="bg-white border border-accent-green/10 rounded-3xl p-6 sampaguita-shadow text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-primary-green" />
            </div>
            <span className="text-[10px] font-black text-accent-green bg-accent-green/10 px-3 py-1 rounded-full">New Arrivals</span>
          </div>
          <p className="text-soft-gray text-[10px] font-black uppercase tracking-widest mb-1">Total Items Received</p>
          <p className="text-2xl font-black text-primary-green">2,450</p>
          <p className="text-[9px] text-soft-gray font-medium mt-1 italic">Click to view relief goods list</p>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDeployedModal(true)}
          className="bg-white border border-accent-green/10 rounded-3xl p-6 sampaguita-shadow text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-primary-green/5 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-primary-green" />
            </div>
            <span className="text-[10px] font-black text-soft-gray bg-soft-gray/10 px-3 py-1 rounded-full">Distributed</span>
          </div>
          <p className="text-soft-gray text-[10px] font-black uppercase tracking-widest mb-1">Total Items Deployed</p>
          <p className="text-2xl font-black text-primary-green">1,600</p>
          <p className="text-[9px] text-soft-gray font-medium mt-1 italic">Click to view distribution areas</p>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowMapPrompt(true)}
          className="bg-white border border-accent-green/10 rounded-3xl p-6 sampaguita-shadow text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-warning-amber/10 rounded-xl flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-warning-amber" />
            </div>
            <span className="text-[10px] font-black text-warning-amber bg-warning-amber/5 px-3 py-1 rounded-full">Active</span>
          </div>
          <p className="text-soft-gray text-[10px] font-black uppercase tracking-widest mb-1">Active Warehouses</p>
          <p className="text-2xl font-black text-primary-green">4</p>
          <p className="text-[9px] text-soft-gray font-medium mt-1 italic">Click to view on map</p>
        </motion.button>
      </div>

      {/* Search and Add Item removed for transparency/view-only mode */}

      <div className="space-y-4">
        {filteredItems.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-accent-green/10 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sampaguita-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sampaguita-white rounded-2xl flex items-center justify-center border border-accent-green/5">
                  <Package className="w-6 h-6 text-primary-green" />
                </div>
                <div>
                  <h4 className="font-black text-primary-green leading-tight">{item.name}</h4>
                  <p className="text-[10px] font-bold text-soft-gray uppercase tracking-widest mt-0.5">{item.location}</p>
                </div>
              </div>

                <div className="flex items-center justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-accent-green/5">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-soft-gray uppercase tracking-widest mb-1">Quantity</p>
                    <span className={`text-xl font-black ${item.quantity < 100 ? 'text-alert-red' : 'text-primary-green'}`}>
                      {item.quantity.toLocaleString()}
                    </span>
                  </div>
                </div>
            </motion.div>
          ))
        }
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-primary-green/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sampaguita-white border border-accent-green/20 rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 p-2 text-soft-gray hover:text-primary-green transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-black text-primary-green mb-6 tracking-tight">Add New Supply</h3>
              <form onSubmit={handleAddItem} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-primary-green uppercase tracking-widest mb-2">Item Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g., Bottled Water, Rice Sack"
                    className="w-full bg-white border border-accent-green/20 rounded-2xl py-3 px-4 text-charcoal focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all outline-none text-sm font-medium"
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-primary-green uppercase tracking-widest mb-2">Quantity</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      className="w-full bg-white border border-accent-green/20 rounded-2xl py-3 px-4 text-charcoal focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all outline-none text-sm font-medium"
                      value={newItem.quantity}
                      onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-primary-green uppercase tracking-widest mb-2">Location (Barangay)</label>
                    <select 
                      required
                      className="w-full bg-white border border-accent-green/20 rounded-2xl py-3 px-4 text-charcoal focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all outline-none text-sm font-medium appearance-none"
                      value={newItem.location}
                      onChange={e => setNewItem({...newItem, location: e.target.value})}
                    >
                      {SAN_PEDRO_BARANGAYS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 bg-white border border-accent-green/20 text-soft-gray font-black py-3.5 rounded-2xl transition-all uppercase text-xs tracking-widest hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={newItem.quantity <= 0}
                    className={`flex-1 font-black py-3.5 rounded-2xl transition-all shadow-lg uppercase text-xs tracking-widest ${newItem.quantity <= 0 ? 'bg-soft-gray/20 text-soft-gray cursor-not-allowed' : 'bg-primary-green hover:bg-primary-green/90 text-white'}`}
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReceivedModal && (
          <div className="fixed inset-0 bg-primary-green/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center">
                  <ArrowDownLeft className="w-6 h-6 text-primary-green" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary-green tracking-tight">Relief Goods Received</h3>
                  <p className="text-[10px] font-bold text-soft-gray uppercase tracking-widest">Recent Donations & Supplies</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  { name: 'Rice Sacks (50kg)', qty: '500 units', source: 'DSWD Regional' },
                  { name: 'Canned Goods (Box)', qty: '1,200 boxes', source: 'LGU San Pedro' },
                  { name: 'Bottled Water (6L)', qty: '450 units', source: 'Private Donor' },
                  { name: 'Hygiene Kits', qty: '300 sets', source: 'Red Cross' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-sampaguita-white rounded-2xl border border-accent-green/5">
                    <div>
                      <p className="text-sm font-black text-charcoal">{item.name}</p>
                      <p className="text-[9px] font-bold text-soft-gray uppercase">{item.source}</p>
                    </div>
                    <span className="text-sm font-black text-primary-green">{item.qty}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowReceivedModal(false)}
                className="w-full bg-primary-green text-white font-black py-4 rounded-2xl hover:bg-primary-green/90 transition-all shadow-lg uppercase text-xs tracking-widest"
              >
                Close Window
              </button>
            </motion.div>
          </div>
        )}

        {showDeployedModal && (
          <div className="fixed inset-0 bg-primary-green/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary-green/5 rounded-2xl flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-primary-green" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary-green tracking-tight">Distribution Status</h3>
                  <p className="text-[10px] font-bold text-soft-gray uppercase tracking-widest">Barangay Deployment Logs</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  { area: 'Bagong Silang', qty: '450 units', status: 'Completed' },
                  { area: 'Calendola', qty: '320 units', status: 'In Progress' },
                  { area: 'Chrysanthemum', qty: '580 units', status: 'Completed' },
                  { area: 'Ciudad Real', qty: '250 units', status: 'Scheduled' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-sampaguita-white rounded-2xl border border-accent-green/5">
                    <div>
                      <p className="text-sm font-black text-charcoal">{item.area}</p>
                      <p className={`text-[9px] font-bold uppercase ${item.status === 'Completed' ? 'text-primary-green' : 'text-warning-amber'}`}>
                        {item.status}
                      </p>
                    </div>
                    <span className="text-sm font-black text-primary-green">{item.qty}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowDeployedModal(false)}
                className="w-full bg-primary-green text-white font-black py-4 rounded-2xl hover:bg-primary-green/90 transition-all shadow-lg uppercase text-xs tracking-widest"
              >
                Close Window
              </button>
            </motion.div>
          </div>
        )}

        {showMapPrompt && (
          <div className="fixed inset-0 bg-primary-green/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-10 text-center max-w-xs w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-primary-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Warehouse className="w-8 h-8 text-primary-green" />
              </div>
              <h3 className="text-2xl font-black text-primary-green mb-4 tracking-tight">View on Map?</h3>
              <p className="text-xs text-soft-gray font-medium mb-8 leading-relaxed">
                Would you like to view the active warehouses and distribution centers on the map?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowMapPrompt(false)}
                  className="flex-1 bg-white border border-accent-green/20 text-soft-gray font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-widest hover:bg-gray-50"
                >
                  No
                </button>
                <button 
                  onClick={() => {
                    setShowMapPrompt(false);
                    onNavigate?.('map');
                  }}
                  className="flex-1 bg-primary-green text-white font-black py-4 rounded-2xl hover:bg-primary-green/90 transition-all shadow-lg uppercase text-xs tracking-widest"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
