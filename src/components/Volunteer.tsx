import React, { useState, useEffect } from 'react';
import { 
  HandHelping, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Plus,
  User,
  X
} from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { SAN_PEDRO_BARANGAYS } from '../constants';

export default function Volunteer() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isVolunteering, setIsVolunteering] = useState(false);

  const MOCK_TASKS = [
    {
      id: 'mock-1',
      title: 'Relief Goods Packing',
      description: 'Help us pack food and hygiene kits for families in Brgy. Cuyab. No experience needed, just a willing heart!',
      location: 'City Hall Operations Center',
      status: 'OPEN',
      details: 'You will be working with a team to assemble food packs containing rice, canned goods, and coffee. Please wear comfortable clothes and a face mask.',
      requirements: 'Must be 18+, able to stand for 3 hours.',
      time: '08:00 AM - 12:00 PM'
    },
    {
      id: 'mock-2',
      title: 'First Aid Support',
      description: 'Assist our medical team at the Pacita Complex II Gym evacuation center. Basic first aid knowledge required.',
      location: 'Pacita Complex II Gym',
      status: 'OPEN',
      details: 'Assist in monitoring vital signs and providing basic wound care under the supervision of registered nurses.',
      requirements: 'First aid certification or medical background.',
      time: '01:00 PM - 05:00 PM'
    },
    {
      id: 'mock-3',
      title: 'Community Kitchen Helper',
      description: 'Support our hot meals program for displaced residents. Help in food preparation and distribution.',
      location: 'San Vicente Barangay Hall',
      status: 'OPEN',
      details: 'Help in chopping vegetables, stirring large pots, and serving hot meals to families in the evacuation center.',
      requirements: 'Health card or basic food safety knowledge.',
      time: '10:00 AM - 02:00 PM'
    }
  ];

  useEffect(() => {
    let unsub = () => {};
    if (auth.currentUser) {
      unsub = onSnapshot(collection(db, 'tasks'), (snapshot) => {
        const user = auth.currentUser;
        const dbTasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        
        // Combine mock tasks with DB tasks
        const combined = [...MOCK_TASKS, ...dbTasks];
        
        // Role-based access: only view own entries for DB tasks, plus all mock tasks
        if (user && !user.isAnonymous) {
          setTasks(combined.filter(t => t.id.startsWith('mock-') || t.createdBy === user.uid));
        } else {
          setTasks(combined);
        }
      }, (error) => {
        console.error("Tasks listener error:", error);
        setTasks(MOCK_TASKS); // Fallback to mocks on error
      });
    } else {
      setTasks(MOCK_TASKS);
    }
    return () => unsub();
  }, []);

  const signUp = async (taskId: string) => {
    await updateDoc(doc(db, 'tasks', taskId), {
      status: 'FILLED',
      volunteerName: auth.currentUser?.displayName || 'Anonymous'
    });
  };

  return (
    <div className="space-y-8 pb-10 watercolor-bg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-primary-green tracking-tighter">Volunteer Portal</h2>
          <p className="text-soft-gray font-medium text-sm">Join the response effort and support San Pedro.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <motion.div 
            key={task.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedTask(task)}
            className="bg-white border border-accent-green/10 rounded-3xl p-6 flex flex-col sampaguita-shadow relative overflow-hidden cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                task.status === 'OPEN' ? 'bg-accent-green/10 text-primary-green' : 'bg-soft-gray/10 text-soft-gray'
              }`}>
                {task.status}
              </div>
              <Clock className="w-4 h-4 text-soft-gray group-hover:text-primary-green transition-colors" />
            </div>
            
            <h4 className="text-lg font-black text-primary-green mb-2 leading-tight group-hover:translate-x-1 transition-transform">{task.title}</h4>
            <p className="text-charcoal text-xs font-medium flex-1 mb-6 leading-relaxed line-clamp-2">{task.description}</p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-soft-gray uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                {task.location || 'City Hall Operations Center'}
              </div>
              {task.volunteerName && (
                <div className="flex items-center gap-2 text-[10px] font-black text-primary-green bg-primary-green/5 p-2 rounded-lg uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" />
                  Claimed by: {task.volunteerName}
                </div>
              )}
            </div>

            <div className="w-full bg-primary-green/5 text-primary-green font-black py-3 rounded-2xl text-center uppercase text-[10px] tracking-widest group-hover:bg-primary-green group-hover:text-white transition-all">
              View Details
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 bg-primary-green/20 backdrop-blur-sm flex items-center justify-center p-4 z-[100] pb-24">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sampaguita-white border border-accent-green/20 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setSelectedTask(null);
                  setIsVolunteering(false);
                }}
                className="absolute top-6 right-6 p-2 text-soft-gray hover:text-primary-green transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {!isVolunteering ? (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-primary-green/10 rounded-2xl flex items-center justify-center">
                      <HandHelping className="w-8 h-8 text-primary-green" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-primary-green tracking-tight">{selectedTask.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-soft-gray uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedTask.location}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 mb-10">
                    <div>
                      <h5 className="text-[10px] font-black text-primary-green uppercase tracking-widest mb-2">Description</h5>
                      <p className="text-sm text-charcoal font-medium leading-relaxed">{selectedTask.description}</p>
                    </div>

                    {selectedTask.details && (
                      <div>
                        <h5 className="text-[10px] font-black text-primary-green uppercase tracking-widest mb-2">What you will do</h5>
                        <p className="text-sm text-charcoal font-medium leading-relaxed">{selectedTask.details}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-accent-green/5">
                        <h5 className="text-[9px] font-black text-soft-gray uppercase tracking-widest mb-1">Schedule</h5>
                        <p className="text-xs font-black text-primary-green">{selectedTask.time || 'Flexible'}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-accent-green/5">
                        <h5 className="text-[9px] font-black text-soft-gray uppercase tracking-widest mb-1">Requirements</h5>
                        <p className="text-xs font-black text-primary-green">{selectedTask.requirements || 'None'}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsVolunteering(true)}
                    className="w-full bg-primary-green hover:bg-primary-green/90 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl uppercase text-sm tracking-widest"
                  >
                    <HandHelping className="w-5 h-5" />
                    Volunteer for this Task
                  </button>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <div className="w-20 h-20 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="w-10 h-10 text-primary-green" />
                  </div>
                  <h3 className="text-3xl font-black text-primary-green mb-4 tracking-tight">You're Registered!</h3>
                  <p className="text-sm text-charcoal font-medium mb-8 leading-relaxed px-4">
                    Thank you for volunteering! Your support means a lot to the community. 
                    Please proceed to the location below to start your task.
                  </p>

                  <div className="bg-white p-6 rounded-3xl border border-accent-green/10 mb-10 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-green/5 rounded-bl-full -mr-8 -mt-8"></div>
                    <h5 className="text-[10px] font-black text-primary-green uppercase tracking-widest mb-3">Reporting Location</h5>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary-green mt-0.5" />
                      <div>
                        <p className="font-black text-charcoal">{selectedTask.location}</p>
                        <p className="text-[10px] font-bold text-soft-gray uppercase mt-1">San Pedro City, Laguna</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary-green/5 p-4 rounded-2xl border border-primary-green/10 mb-8 flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Clock className="w-5 h-5 text-primary-green" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-primary-green uppercase tracking-widest">Arrival Notification</p>
                      <p className="text-xs font-bold text-charcoal">Please arrive at {selectedTask.time?.split(' - ')[0] || 'the scheduled time'}.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedTask(null);
                      setIsVolunteering(false);
                    }}
                    className="w-full bg-primary-green text-white font-black py-5 rounded-2xl hover:bg-primary-green/90 transition-all shadow-lg uppercase text-sm tracking-widest"
                  >
                    Got it, I'm on my way!
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
