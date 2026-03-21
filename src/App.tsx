import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Users, 
  Package, 
  HandHelping, 
  ShieldAlert,
  Shield,
  Globe,
  Menu,
  X,
  LogOut,
  Smartphone,
  User as UserIcon,
  ChevronRight,
  Flower2,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from './firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { SAN_PEDRO_BARANGAYS } from './constants';

// Components
import Dashboard from './components/Dashboard';
import GeoMap from './components/GeoMap';
import People from './components/People';
import Population from './components/Population';
import Inventory from './components/Inventory';
import Volunteer from './components/Volunteer';
import Alert from './components/Alert';

type Tab = 'dashboard' | 'map' | 'people' | 'population' | 'inventory' | 'volunteer' | 'alert';

interface AppUser {
  uid: string;
  displayName: string;
  email?: string;
  isGuest: boolean;
  isAdmin: boolean;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  barangay?: string;
}

const GaiaLogo = ({ className = "w-14 h-14" }: { className?: string }) => (
  <div className={`${className} bg-primary-green rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden group`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
    <Shield className="w-[70%] h-[70%] text-white fill-white relative z-10 drop-shadow-lg" />
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <Globe className="w-[40%] h-[40%] text-primary-green animate-pulse" />
    </div>
    <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-green rotate-45 opacity-50" />
  </div>
);

const SampaguitaIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Flower2 className={`${className} text-accent-green`} />
);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [user, setUser] = useState<AppUser | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Registration States
  const [isRegistering, setIsRegistering] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [regData, setRegData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    suffix: '',
    barangay: '',
    contactNumber: '',
    agreedToTerms: false,
    agreedToPrivacy: false
  });

  const [isSOSActive, setIsSOSActive] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        const isAdmin = u.email === 'altaccmz.ph@gmail.com';
        setUser({
          uid: u.uid,
          displayName: u.displayName || 'Resident',
          email: u.email || '',
          isGuest: u.isAnonymous,
          isAdmin: isAdmin
        });
        setAuthError(null);
      } else {
        // Only clear if not a mock user
        setUser(prev => (prev && (prev.uid.startsWith('demo-') || prev.uid.startsWith('mock-')) ? prev : null));
      }
    });
    return () => unsubscribe();
  }, []);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 0 && digits[0] !== '9') return '';
    
    let formatted = '';
    for (let i = 0; i < digits.length && i < 10; i++) {
      if (i === 3 || i === 6) formatted += ' ';
      formatted += digits[i];
    }
    return formatted;
  };

  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = mobileNumber.replace(/\D/g, '');
    if (digits.length < 10) return;
    setIsLoading(true);
    setAuthError(null);
    
    // Mock login flow: just enter demo mode with the phone number
    setTimeout(() => {
      const isAdmin = mobileNumber.includes('9123456789'); // Mock admin for testing
      setUser({
        uid: 'mock-' + digits,
        displayName: `+63 ${mobileNumber}`,
        isGuest: false,
        isAdmin: isAdmin,
        phoneNumber: mobileNumber
      });
      setIsLoading(false);
    }, 800);
  };

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.firstName || !regData.lastName || !regData.barangay || !regData.contactNumber || !regData.agreedToTerms || !regData.agreedToPrivacy) {
      setAuthError("Please fill in all required fields and accept agreements.");
      return;
    }
    setIsLoading(true);
    // Mock sending OTP
    setTimeout(() => {
      setOtpSent(true);
      setIsLoading(false);
      setAuthError(null);
    }, 1000);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setAuthError("Please enter a 6-digit code.");
      return;
    }
    setIsLoading(true);
    
    // Mock verification: just set the user state locally
    setTimeout(() => {
      const isAdmin = regData.contactNumber.includes('9123456789'); // Mock admin for testing
      setUser({
        uid: 'mock-reg-' + regData.contactNumber.replace(/\D/g, ''),
        displayName: `${regData.firstName} ${regData.lastName}`,
        isGuest: false,
        isAdmin: isAdmin,
        phoneNumber: regData.contactNumber,
        firstName: regData.firstName,
        lastName: regData.lastName,
        barangay: regData.barangay
      });
      setIsLoading(false);
      setAuthError(null);
    }, 1000);
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
      enterDemoMode();
    } catch (err) {
      console.error("Anonymous auth error:", err);
      // Fallback to local demo mode if Firebase auth fails
      enterDemoMode();
    }
  };

  const enterDemoMode = () => {
    const isAdmin = false; // Demo guests are not admins
    setUser({
      uid: 'demo-' + Math.random().toString(36).substr(2, 9),
      displayName: 'Demo Guest',
      isGuest: true,
      isAdmin
    });
    setAuthError(null);
  };

  const handleLogout = () => {
    // signOut(auth); // No need for real sign out in mockup
    setMobileNumber('');
    setUser(null);
    setOtpSent(false);
    setIsRegistering(false);
  };

  const handleSOS = () => {
    if (!user) return;
    
    const newState = !isSOSActive;
    setIsSOSActive(newState);
    
    // Pure mockup: we just toggle local state to show the marker on the map
    // This avoids "Missing or insufficient permissions" errors when using mock users
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, adminOnly: false },
    { id: 'map', label: 'Map', icon: MapIcon, adminOnly: false },
    { id: 'people', label: 'People', icon: Users, adminOnly: false },
    { id: 'inventory', label: 'Aid', icon: Package, adminOnly: false },
    { id: 'volunteer', label: 'Help', icon: HandHelping, adminOnly: false },
    { id: 'alert', label: 'Alert', icon: ShieldAlert, adminOnly: false },
  ].filter(item => !item.adminOnly || user?.isAdmin);

  if (!user) {
    return (
      <div className="min-h-screen bg-sampaguita-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Watercolor Background Motif */}
        <div className="absolute inset-0 watercolor-bg opacity-40 pointer-events-none" />
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-accent-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary-green/5 rounded-full blur-3xl" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center z-10"
        >
          <div className="mb-4 flex flex-col items-center">
            <GaiaLogo className="w-16 h-16 mb-4 shadow-2xl" />
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-primary-green tracking-tighter">GAIA</h1>
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              <SampaguitaIcon className="w-5 h-5" />
            </div>
            <p className="text-accent-green font-bold tracking-[0.3em] uppercase text-[9px] leading-relaxed">Geospatial Analytics & Integrated Action</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-alert-red/5 border border-alert-red/10 rounded-2xl text-left">
              <p className="text-alert-red text-xs font-medium leading-relaxed">
                {authError}
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!isRegistering ? (
              <motion.div 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <form onSubmit={handleMobileLogin} className="space-y-3">
                  <div className="bg-white border border-accent-green/20 rounded-2xl p-4 sampaguita-shadow flex items-center gap-4">
                    <div className="flex items-center gap-2 border-r border-soft-gray/20 pr-4">
                      <span className="text-sm font-bold text-charcoal">🇵🇭 +63</span>
                    </div>
                    <input 
                      type="tel" 
                      placeholder="9XX XXX XXXX"
                      maxLength={12}
                      className="flex-1 bg-transparent text-charcoal font-bold outline-none placeholder:text-soft-gray tracking-widest"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(formatPhoneNumber(e.target.value))}
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isLoading || mobileNumber.length < 10}
                    className="w-full bg-primary-green hover:bg-primary-green/90 disabled:bg-soft-gray/20 disabled:text-soft-gray text-white font-bold py-5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isLoading ? 'Connecting...' : 'Continue'}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </form>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setIsRegistering(true)}
                    className="text-primary-green text-sm font-bold hover:underline"
                  >
                    Don't have an account? Register here
                  </button>
                  
                  <button 
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                    className="w-full bg-white border border-primary-green text-primary-green font-bold py-5 px-6 rounded-2xl hover:bg-sampaguita-white transition-all sampaguita-shadow flex items-center justify-center gap-2"
                  >
                    <UserIcon className="w-5 h-5" />
                    Browse as Guest
                  </button>
                </div>
              </motion.div>
            ) : !otpSent ? (
              <motion.div 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl p-6 sampaguita-shadow text-left space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setIsRegistering(false)} className="text-soft-gray hover:text-primary-green">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-black text-primary-green">User Registration</h2>
                </div>

                <form onSubmit={handleRegistration} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-soft-gray uppercase">First Name</label>
                      <input 
                        className="w-full bg-sampaguita-white border border-accent-green/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary-green"
                        value={regData.firstName}
                        onChange={e => setRegData({...regData, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-soft-gray uppercase">M.I.</label>
                      <input 
                        maxLength={1}
                        className="w-full bg-sampaguita-white border border-accent-green/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary-green text-center"
                        value={regData.middleInitial}
                        onChange={e => setRegData({...regData, middleInitial: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-soft-gray uppercase">Last Name</label>
                      <input 
                        className="w-full bg-sampaguita-white border border-accent-green/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary-green"
                        value={regData.lastName}
                        onChange={e => setRegData({...regData, lastName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-soft-gray uppercase">Suffix</label>
                      <input 
                        className="w-full bg-sampaguita-white border border-accent-green/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary-green"
                        value={regData.suffix}
                        onChange={e => setRegData({...regData, suffix: e.target.value})}
                        placeholder="Jr, III, etc"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-soft-gray uppercase">Barangay</label>
                    <select 
                      className="w-full bg-sampaguita-white border border-accent-green/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary-green appearance-none"
                      value={regData.barangay}
                      onChange={e => setRegData({...regData, barangay: e.target.value})}
                      required
                    >
                      <option value="">Select Barangay</option>
                      {SAN_PEDRO_BARANGAYS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-soft-gray uppercase tracking-widest">Contact Number</label>
                    <div className="flex items-center gap-2 bg-sampaguita-white border border-accent-green/10 rounded-xl p-3">
                      <span className="text-sm font-bold text-soft-gray">🇵🇭 +63</span>
                      <input 
                        type="tel"
                        maxLength={12}
                        className="flex-1 bg-transparent text-sm font-bold outline-none tracking-widest"
                        value={regData.contactNumber}
                        onChange={e => setRegData({...regData, contactNumber: formatPhoneNumber(e.target.value)})}
                        required
                        placeholder="9XX XXX XXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-4 h-4 rounded border-accent-green/20 text-primary-green focus:ring-primary-green"
                        checked={regData.agreedToTerms}
                        onChange={e => setRegData({...regData, agreedToTerms: e.target.checked})}
                      />
                      <span className="text-[10px] text-soft-gray font-medium leading-tight group-hover:text-charcoal transition-colors">
                        I agree to the <span className="text-primary-green font-bold">Terms and Conditions</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-4 h-4 rounded border-accent-green/20 text-primary-green focus:ring-primary-green"
                        checked={regData.agreedToPrivacy}
                        onChange={e => setRegData({...regData, agreedToPrivacy: e.target.checked})}
                      />
                      <span className="text-[10px] text-soft-gray font-medium leading-tight group-hover:text-charcoal transition-colors">
                        I agree to the <span className="text-primary-green font-bold">Privacy Policy</span>
                      </span>
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-green text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-primary-green/90 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Processing...' : 'Register & Send OTP'}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 sampaguita-shadow text-center space-y-6"
              >
                <div className="w-16 h-16 bg-primary-green/10 rounded-full flex items-center justify-center mx-auto">
                  <Smartphone className="w-8 h-8 text-primary-green" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-primary-green mb-2">Verify Identity</h2>
                  <p className="text-xs text-soft-gray font-medium">
                    We've sent a 6-digit code to <br/>
                    <span className="text-charcoal font-bold">+63 {regData.contactNumber}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <input 
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full bg-sampaguita-white border-2 border-accent-green/10 rounded-2xl p-4 text-center text-3xl font-black tracking-[0.5em] outline-none focus:border-primary-green"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />

                  <p className="text-[10px] text-soft-gray font-medium tracking-wide">
                    Mockup: Enter any <span className="text-primary-green font-bold">6-digit code</span> to proceed
                  </p>

                  <button 
                    type="submit"
                    disabled={isLoading || otpCode.length < 6}
                    className="w-full bg-primary-green text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-primary-green/90 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Login'}
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </form>

                <button 
                  onClick={() => setOtpSent(false)}
                  className="text-soft-gray text-xs font-bold hover:text-primary-green"
                >
                  Change number
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-12 text-soft-gray text-xs font-medium">
            Rooted in San Pedro, Laguna. Built for the People.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sampaguita-white text-charcoal flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Mobile Header */}
      <header className="h-20 bg-sampaguita-white border-b border-accent-green/10 flex items-center justify-between px-6 sticky top-0 z-50">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 hover:opacity-90 transition-all group"
        >
          <GaiaLogo className="w-10 h-10 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-primary-green text-2xl tracking-tighter leading-none">GAIA</span>
              <SampaguitaIcon className="w-4 h-4" />
            </div>
            <span className="text-[8px] font-black text-accent-green tracking-[0.15em] uppercase leading-none mt-0.5">Integrated Action</span>
          </div>
        </button>
        
        <div className="flex items-center gap-4">
          <div className="text-right flex flex-col items-end">
            <span className="text-[8px] font-black text-primary-green uppercase tracking-[0.25em] bg-primary-green/5 px-2 py-0.5 rounded-full mb-1">
              {user.isGuest ? 'Guest' : 'Resident'}
            </span>
            <p className="text-[10px] text-soft-gray font-bold tracking-tight leading-tight max-w-[120px] truncate">
              {user.isGuest ? user.displayName : `Hi, ${user.displayName}!`}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-2xl bg-primary-green/5 flex items-center justify-center text-primary-green hover:bg-primary-green/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 px-6 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard onNavigate={(tab) => setActiveTab(tab)} isAdmin={user?.isAdmin} />}
            {activeTab === 'map' && <GeoMap isAdmin={user?.isAdmin} isSOSActive={isSOSActive} currentUser={user} />}
            {activeTab === 'people' && <People />}
            {activeTab === 'population' && <Population isAdmin={user?.isAdmin} />}
            {activeTab === 'inventory' && <Inventory onNavigate={(tab) => setActiveTab(tab as Tab)} />}
            {activeTab === 'volunteer' && <Volunteer />}
            {activeTab === 'alert' && <Alert />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating SOS Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSOS}
        className={`fixed bottom-24 right-6 z-[1100] w-16 h-16 rounded-full shadow-2xl flex flex-col items-center justify-center border-4 border-white transition-all ${
          isSOSActive ? 'bg-alert-red text-white' : 'bg-primary-green text-white'
        }`}
      >
        <ShieldAlert className={`w-6 h-6 ${isSOSActive ? 'animate-pulse' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {isSOSActive ? 'ACTIVE' : 'SOS'}
        </span>
      </motion.button>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 max-w-md mx-auto h-[1px] bg-accent-green/10 z-40" />
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-primary-green border-t border-white/10 px-4 py-3 flex items-center justify-around z-50 rounded-t-3xl shadow-2xl">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === item.id 
                ? 'text-white' 
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-white/10' : ''}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
