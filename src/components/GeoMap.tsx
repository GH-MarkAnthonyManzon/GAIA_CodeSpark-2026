import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ShieldAlert, Droplets, Activity, X, Layers, Map as MapIcon, Building2, Warehouse, Home, AlertTriangle, Info, ChevronDown, ChevronUp, Minimize2, Maximize2, Users, MapPin, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Fix Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ route }: { route: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
}

const SAN_PEDRO_CENTER: [number, number] = [14.3514, 121.0504];

const RISK_ZONES = [
  { 
    name: 'Brgy. Cuyab (Baha)', 
    center: [14.365, 121.058] as [number, number], 
    radius: 800, 
    type: 'flood', 
    color: '#3b82f6',
    impactAnalysis: '27°C + High Humidity + 30mm Rain = Potential Flashflood in low-lying areas.',
    consequence: 'Maaaring umabot ng 1-meter ang baha dito dahil sa baradong drainage at malakas na ulan.',
    healthRisk: 'Mataas ang risk ng Leptospirosis at water-borne diseases. Iwasang lumusong sa baha.',
    action: 'Lumikas agad sa Brgy. Hall o pinakamalabit na Evacuation Center.'
  },
  { 
    name: 'Brgy. Landayan (Baha)', 
    center: [14.355, 121.052] as [number, number], 
    radius: 600, 
    type: 'flood', 
    color: '#3b82f6',
    impactAnalysis: 'Heavy Rainfall + High Tide = Rapid water level rise in coastal areas.',
    consequence: 'Mabilis tumaas ang tubig kapag malakas ang ulan dahil sa lapit sa lawa.',
    healthRisk: 'Mag-ingat sa mga lamok na may dalang Dengue sa mga stagnant water.',
    action: 'Ihanda ang Go-Bag at mag-abang sa abiso ng Barangay.'
  },
  { 
    name: 'San Vicente (Baha)', 
    center: [14.345, 121.060] as [number, number], 
    radius: 700, 
    type: 'flood', 
    color: '#3b82f6',
    impactAnalysis: 'Thunderstorm + Saturated Soil = High-risk for flash floods in residential zones.',
    consequence: 'High-risk area para sa flash floods dahil sa slope ng lupa.',
    healthRisk: 'Delikado sa skin infections at diarrhea dahil sa kontaminadong tubig.',
    action: 'Huwag nang mag-atubiling lumikas kung tumataas na ang tubig.'
  },
  { 
    name: 'West Valley Fault Line', 
    center: [14.360, 121.040] as [number, number], 
    radius: 1500, 
    type: 'fault', 
    color: '#ef4444',
    consequence: 'Delikado sa malakas na lindol (The Big One).',
    action: 'Siguraduhing matibay ang bahay at alam ang Duck, Cover, and Hold.'
  },
];

const INFRASTRUCTURE = [
  {
    name: 'Old Cuyab Bridge',
    location: [14.362, 121.062] as [number, number],
    type: 'bridge',
    status: 'WEAK',
    healthIndex: 42,
    usherVerified: true,
    description: 'Marupok na ang pundasyon dahil sa katandaan at nakaraang lindol. Iwasan ang pagdaan ng mabibigat na sasakyan.'
  },
  {
    name: 'San Pedro City Hall',
    location: [14.3514, 121.0504] as [number, number],
    type: 'government',
    status: 'SAFE',
    healthIndex: 88,
    usherVerified: true,
    description: 'Main Command Center for CDRRMO.'
  },
  {
    name: 'Landayan Old Warehouse',
    location: [14.358, 121.054] as [number, number],
    type: 'commercial',
    status: 'WEAK',
    healthIndex: 35,
    usherVerified: true,
    description: 'May mga bitak sa pader mula pa noong 2019 earthquake. High risk for collapse.'
  },
  {
    name: 'Poblacion Heritage Building',
    location: [14.348, 121.055] as [number, number],
    type: 'heritage',
    status: 'WEAK',
    healthIndex: 51,
    usherVerified: true,
    description: 'Higit 50 taon na ang istruktura. Hindi pa sumasailalim sa retrofitting.'
  },
  {
    name: 'San Roque Water Tank',
    location: [14.352, 121.056] as [number, number],
    type: 'utility',
    status: 'WEAK',
    healthIndex: 28,
    usherVerified: true,
    description: 'Kinakalawang na ang mga suporta. Delikado kapag may malakas na pagyanig.'
  }
];

const EVACUATION_CENTERS = [
  { name: 'Cuyab Elementary School', location: [14.363, 121.060] as [number, number], capacity: 500, address: 'Brgy. Cuyab, San Pedro' },
  { name: 'Pacita Complex II Gym', location: [14.348, 121.045] as [number, number], capacity: 800, address: 'Pacita Complex II, San Pedro' },
  { name: 'Landayan Evacuation Center', location: [14.3534, 121.054] as [number, number], capacity: 400, address: '13 Quirino, San Pedro, Laguna' },
  { name: 'San Pedro CDRRMO (SPARC)', location: [14.3514, 121.0504] as [number, number], capacity: 200, address: 'San Pedro Municipal Hall, J. Luna Street', phone: '0498476606' },
  { name: 'SM Center San Pedro', location: [14.3558, 121.0583] as [number, number], capacity: 1000, address: 'San Pedro, Laguna' },
  { name: 'Robinsons Galleria South', location: [14.3601, 121.0535] as [number, number], capacity: 1200, address: '179 Manila S Rd, San Pedro', phone: '0282833562' },
  { name: 'United Bayanihan Covered Court', location: [14.3412, 121.0595] as [number, number], capacity: 300, address: 'United Bayanihan Proper Rd' },
  { name: 'Laram Basketball Court', location: [14.3485, 121.0421] as [number, number], capacity: 250, address: '133 R. Magsaysay Ave', phone: '0284784191' },
  { name: 'Filinvest Homesite Basketball Court', location: [14.3685, 121.0452] as [number, number], capacity: 200, address: 'Brgy Bagong Silang' },
  { name: 'Brgy. Estrella Covered Court', location: [14.3652, 121.0581] as [number, number], capacity: 350, address: 'Brgy. Estrella, San Pedro' },
  { name: 'Barangay Narra Basketball Court', location: [14.3521, 121.0485] as [number, number], capacity: 250, address: 'Main Road Barangay Narra' },
];

const TYPHOON_PATH: [number, number][] = [
  [14.30, 121.15],
  [14.33, 121.10],
  [14.35, 121.05],
  [14.37, 121.00],
  [14.40, 120.95],
];

const RAINFALL_ZONES = [
  { center: [14.36, 121.06] as [number, number], radius: 2000, intensity: 'Heavy', color: '#1e3a8a' },
  { center: [14.34, 121.04] as [number, number], radius: 1500, intensity: 'Moderate', color: '#3b82f6' },
];

export default function GeoMap({ isAdmin = false, isSOSActive = false, currentUser }: { isAdmin?: boolean, isSOSActive?: boolean, currentUser?: any }) {
  const [residents, setResidents] = useState<any[]>([
    { id: 'm1', name: 'Juan Dela Cruz', barangay: 'Cuyab', status: 'SAFE', location: { lat: 14.364, lng: 121.064 } },
    { id: 'm2', name: 'Maria Clara', barangay: 'San Roque', status: 'NEEDS_RESCUE', location: { lat: 14.354, lng: 121.069 } },
    { id: 'm3', name: 'Jose Rizal', barangay: 'Poblacion', status: 'MISSING', location: { lat: 14.346, lng: 121.058 } },
    { id: 'm4', name: 'Andres Bonifacio', barangay: 'Landayan', status: 'IN_EVACUATION', location: { lat: 14.356, lng: 121.072 } },
  ]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedInfra, setSelectedInfra] = useState<any>(null);
  const [activeRoute, setActiveRoute] = useState<[number, number][] | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [filters, setFilters] = useState({
    dangerZones: true,
    infrastructure: true,
    evacuation: true,
    predictive: false,
    mapType: 'voyager' // 'voyager' or 'satellite'
  });

  const [weatherRisk, setWeatherRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [isForecastMinimized, setIsForecastMinimized] = useState(false);
  const [forecast, setForecast] = useState({
    rainfall: 'Light',
    typhoonDistance: '350km',
    eta: '12 hours'
  });

  useEffect(() => {
    // Simulate fetching weather-based risk
    const timer = setTimeout(() => {
      setWeatherRisk('high'); // Set to high for demo
      setForecast({
        rainfall: 'Heavy (30mm/hr)',
        typhoonDistance: '120km',
        eta: '4 hours'
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let unsub = () => {};
    let unsubSOS = () => {};

    if (auth.currentUser && isAdmin) {
      unsub = onSnapshot(collection(db, 'residents'), (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        if (docs.length === 0) {
          // Mock residents for demo if DB is empty
          setResidents([
            { id: 'm1', name: 'Juan Dela Cruz', barangay: 'Cuyab', status: 'SAFE', location: { lat: 14.364, lng: 121.064 } },
            { id: 'm2', name: 'Maria Clara', barangay: 'San Roque', status: 'NEEDS_RESCUE', location: { lat: 14.354, lng: 121.052 } },
            { id: 'm3', name: 'Jose Rizal', barangay: 'Poblacion', status: 'MISSING', location: { lat: 14.346, lng: 121.058 } },
            { id: 'm4', name: 'Andres Bonifacio', barangay: 'Landayan', status: 'IN_EVACUATION', location: { lat: 14.356, lng: 121.054 } },
          ]);
        } else {
          setResidents(docs);
        }
      }, (error) => {
        console.error("Residents listener error in GeoMap:", error);
      });

      unsubSOS = onSnapshot(collection(db, 'sos_alerts'), (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        setSosAlerts(docs.filter(d => d.status === 'ACTIVE'));
      }, (error) => {
        console.error("SOS listener error in GeoMap:", error);
      });
    }

    return () => {
      unsub();
      unsubSOS();
    };
  }, [isAdmin]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEEDS_RESCUE': return '#D90429'; // alert-red
      case 'SAFE': return '#1B4332'; // primary-green
      case 'MISSING': return '#F7B538'; // warning-amber
      case 'IN_EVACUATION': return '#74C69D'; // accent-green
      default: return '#94A3B8'; // soft-gray
    }
  };

  const handleViewEvacuationPlan = () => {
    if (!selectedZone) return;

    // Mock User Location: Magsaysay, San Pedro
    const userLoc: [number, number] = [14.354, 121.058];
    
    // Determine destination based on zone
    let destLoc: [number, number] = EVACUATION_CENTERS[0].location;
    if (selectedZone.name.includes('Pacita') || selectedZone.name.includes('San Vicente')) {
      destLoc = EVACUATION_CENTERS[1].location;
    }

    // Create a mock route (just a simple path for demo)
    const route: [number, number][] = [
      userLoc,
      [ (userLoc[0] + destLoc[0]) / 2, (userLoc[1] + destLoc[1]) / 2 ],
      destLoc
    ];

    setActiveRoute(route);
    setSelectedZone(null);
    setSelectedInfra(null);
  };

  const handleReportProblem = () => {
    if (!reportDescription.trim()) return;
    
    // Mocking the report process
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setIsReporting(false);
      setReportDescription('');
      setSelectedInfra(null);
    }, 3000);
  };

  return (
    <div className="h-[calc(100vh-14rem)] -mx-6 overflow-hidden border-y-4 border-primary-green/10 relative shadow-2xl watercolor-bg my-2">
      <MapContainer 
        center={SAN_PEDRO_CENTER} 
        zoom={14} 
        style={{ width: '100%', height: '100%', background: '#FDFCF8' }}
        zoomControl={false}
      >
        <MapController route={activeRoute} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={filters.mapType === 'voyager' 
            ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          }
        />
        
        {/* Predictive Analysis Layers */}
        {filters.predictive && (
          <>
            {/* Typhoon Path Prediction */}
            <Polyline 
              positions={TYPHOON_PATH} 
              pathOptions={{ 
                color: '#D90429', 
                weight: 4, 
                dashArray: '10, 10',
                opacity: 0.8 
              }} 
            />
            {TYPHOON_PATH.map((pos, i) => (
              <Circle 
                key={`typhoon-point-${i}`}
                center={pos}
                radius={300}
                pathOptions={{ color: '#D90429', fillColor: '#D90429', fillOpacity: 0.4 }}
              >
                <Popup className="sampaguita-popup">
                  <div className="p-2">
                    <p className="text-[10px] font-black text-alert-red uppercase">Predicted Path</p>
                    <p className="text-xs font-bold">Estimated Time: T+{i * 3}h</p>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Rainfall Intensity Zones */}
            {RAINFALL_ZONES.map((zone, i) => (
              <Circle 
                key={`rainfall-${i}`}
                center={zone.center}
                radius={zone.radius}
                pathOptions={{ 
                  color: zone.color, 
                  fillColor: zone.color, 
                  fillOpacity: 0.2,
                  weight: 1,
                  dashArray: '5, 5'
                }}
              >
                <Popup className="sampaguita-popup">
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="w-3 h-3 text-blue-600" />
                      <p className="text-[10px] font-black text-blue-600 uppercase">Rainfall Forecast</p>
                    </div>
                    <p className="text-xs font-bold">Intensity: {zone.intensity}</p>
                    <p className="text-[9px] text-soft-gray">Expected within 6 hours</p>
                  </div>
                </Popup>
              </Circle>
            ))}
          </>
        )}

        {filters.dangerZones && RISK_ZONES.map((zone, i) => {
          const isHighRisk = filters.predictive && weatherRisk !== 'low' && zone.type === 'flood';
          return (
            <React.Fragment key={i}>
              <Circle 
                center={zone.center} 
                radius={zone.radius} 
                pathOptions={{ 
                  color: isHighRisk ? '#D90429' : (zone.type === 'flood' ? '#3b82f6' : '#ef4444'), 
                  fillColor: isHighRisk ? '#D90429' : (zone.type === 'flood' ? '#3b82f6' : '#ef4444'), 
                  fillOpacity: isHighRisk ? 0.3 : 0.15,
                  weight: isHighRisk ? 3 : 2,
                  dashArray: isHighRisk ? '1, 5' : '5, 10'
                }} 
                eventHandlers={{
                  click: () => {
                    setSelectedZone(zone);
                    setSelectedInfra(null);
                  }
                }}
              />
            </React.Fragment>
          );
        })}

        {filters.infrastructure && INFRASTRUCTURE.map((infra, i) => (
          <Marker
            key={`infra-${i}`}
            position={infra.location}
            icon={L.divIcon({
              className: 'infra-icon',
              html: `
                <div class="relative">
                  <div class="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border-2 ${infra.status === 'WEAK' ? 'border-alert-red' : 'border-primary-green'}">
                    ${infra.status === 'WEAK' ? '<span class="text-alert-red text-xs">⚠️</span>' : '<span class="text-primary-green text-xs">🏢</span>'}
                  </div>
                  ${infra.usherVerified ? `
                    <div class="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border border-white flex items-center justify-center">
                      <div class="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                    </div>
                  ` : ''}
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
            eventHandlers={{
              click: () => {
                setSelectedInfra(infra);
                setSelectedZone(null);
              }
            }}
          />
        ))}

        {filters.evacuation && EVACUATION_CENTERS.map((evac, i) => (
          <Marker
            key={`evac-${i}`}
            position={evac.location}
            icon={L.divIcon({
              className: 'evac-icon',
              html: `<div class="w-8 h-8 rounded-full bg-primary-green shadow-lg flex items-center justify-center border-2 border-white">
                <span class="text-white text-xs">🏠</span>
              </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
            <Popup className="sampaguita-popup">
              <div className="p-2 min-w-[150px]">
                <h4 className="font-black text-primary-green text-sm leading-tight mb-1">{(evac as any).name}</h4>
                <p className="text-[10px] font-bold text-soft-gray uppercase tracking-widest mb-2">Evacuation Center</p>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-accent-green" />
                    <span className="text-[10px] font-bold text-charcoal">Capacity: {(evac as any).capacity} persons</span>
                  </div>
                  
                  {(evac as any).address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-soft-gray mt-0.5" />
                      <span className="text-[9px] font-medium text-soft-gray leading-tight">{(evac as any).address}</span>
                    </div>
                  )}

                  {(evac as any).phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-primary-green" />
                      <span className="text-[9px] font-bold text-primary-green">{(evac as any).phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {isSOSActive && currentUser && (
          <Marker 
            position={[14.354, 121.058]} 
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `
                <div class="relative flex items-center justify-center">
                  <div class="absolute w-12 h-12 bg-alert-red rounded-full animate-ping opacity-75"></div>
                  <div class="relative w-8 h-8 bg-alert-red rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m12 8 4 4"/><path d="m16 8-4 4"/></svg>
                  </div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
            <Popup className="sampaguita-popup">
              <div className="p-2 min-w-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-alert-red rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-alert-red">Active SOS</span>
                </div>
                <h3 className="font-black text-sm mb-1 text-charcoal">{currentUser.displayName}</h3>
                <p className="text-[10px] font-bold text-soft-gray mb-2">Location: Magsaysay, San Pedro</p>
                <div className="bg-alert-red/10 border border-alert-red/20 rounded-lg p-2">
                  <p className="text-[9px] font-bold text-alert-red leading-tight">
                    Emergency alert triggered. Dispatching local responders to Magsaysay area.
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {isAdmin && sosAlerts.map((sos) => (
          <Marker
            key={sos.id}
            position={[sos.location.lat, sos.location.lng]}
            icon={L.divIcon({
              className: 'sos-icon',
              html: `<div class="w-10 h-10 rounded-full bg-alert-red shadow-2xl flex items-center justify-center border-4 border-white animate-bounce">
                <span class="text-white text-xs font-black">SOS</span>
              </div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })}
          >
            <Popup className="sampaguita-popup">
              <div className="p-3">
                <h4 className="font-black text-alert-red">EMERGENCY SOS</h4>
                <p className="text-xs font-bold text-charcoal mt-1">{sos.userName}</p>
                <p className="text-[10px] text-soft-gray mt-2">
                  {sos.timestamp?.toDate().toLocaleString() || 'Just now'}
                </p>
                <button className="w-full mt-3 bg-alert-red text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Dispatch Rescue
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {activeRoute && (
          <>
            <Polyline 
              positions={activeRoute} 
              pathOptions={{ color: '#1B4332', weight: 6, opacity: 0.8, lineJoin: 'round' }} 
            />
            <Marker position={activeRoute[0]} icon={L.divIcon({
              className: 'user-location-icon',
              html: `<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center">
                <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })}>
              <Popup className="sampaguita-popup">
                <div className="p-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase">Your Location</p>
                  <p className="text-xs font-bold">Magsaysay, San Pedro</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={activeRoute[activeRoute.length - 1]} icon={L.divIcon({
              className: 'dest-icon',
              html: `<div class="w-8 h-8 rounded-full bg-primary-green shadow-lg flex items-center justify-center border-2 border-white">
                <span class="text-white text-xs">🏁</span>
              </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}>
              <Popup className="sampaguita-popup">
                <div className="p-2">
                  <p className="text-[10px] font-black text-primary-green uppercase">Destination</p>
                  <p className="text-xs font-bold">Evacuation Center</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {activeRoute && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000]">
          <button 
            onClick={() => setActiveRoute(null)}
            className="bg-alert-red text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <X className="w-4 h-4" /> Clear Evacuation Route
          </button>
        </div>
      )}

      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-accent-green/10 sampaguita-shadow flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-green animate-pulse" />
              <span className="text-[10px] font-black text-primary-green uppercase tracking-widest">Live Monitoring</span>
            </div>
          </div>
        </div>

        {/* Filter Toggle Button */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-accent-green/10 sampaguita-shadow pointer-events-auto flex items-center gap-2 hover:bg-white transition-all"
        >
          <Layers className="w-4 h-4 text-primary-green" />
          <span className="text-[10px] font-black text-primary-green uppercase tracking-widest">Filters</span>
        </button>
      </div>

      {/* Filter Menu */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-20 right-4 z-[1000] bg-white/95 backdrop-blur-md p-6 rounded-[2rem] border border-accent-green/10 sampaguita-shadow w-64"
          >
            <div className="flex items-center justify-between mb-4 border-b border-accent-green/10 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-3 h-3 text-primary-green" />
                <h5 className="text-[10px] font-black text-primary-green uppercase tracking-widest">Map Layers</h5>
              </div>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-soft-gray" />
              </button>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-alert-red" />
                  <span className="text-xs font-bold text-charcoal">Danger Zones</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={filters.dangerZones} 
                  onChange={(e) => setFilters({...filters, dangerZones: e.target.checked})}
                  className="w-4 h-4 rounded border-accent-green/20 text-primary-green focus:ring-primary-green"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-warning-amber" />
                  <span className="text-xs font-bold text-charcoal">Gusali (Infra)</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={filters.infrastructure} 
                  onChange={(e) => setFilters({...filters, infrastructure: e.target.checked})}
                  className="w-4 h-4 rounded border-accent-green/20 text-primary-green focus:ring-primary-green"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-primary-green" />
                  <span className="text-xs font-bold text-charcoal">Evac Centers</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={filters.evacuation} 
                  onChange={(e) => setFilters({...filters, evacuation: e.target.checked})}
                  className="w-4 h-4 rounded border-accent-green/20 text-primary-green focus:ring-primary-green"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-alert-red" />
                  <span className="text-xs font-bold text-charcoal">Predictive Analysis</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={filters.predictive} 
                  onChange={(e) => setFilters({...filters, predictive: e.target.checked})}
                  className="w-4 h-4 rounded border-accent-green/20 text-primary-green focus:ring-primary-green"
                />
              </label>

              <div className="pt-4 mt-4 border-t border-accent-green/10">
                <h5 className="text-[10px] font-black text-primary-green uppercase tracking-widest mb-3">Map Type</h5>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setFilters({...filters, mapType: 'voyager'})}
                    className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${filters.mapType === 'voyager' ? 'bg-primary-green text-white border-primary-green' : 'bg-white text-soft-gray border-accent-green/10'}`}
                  >
                    Street
                  </button>
                  <button 
                    onClick={() => setFilters({...filters, mapType: 'satellite'})}
                    className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${filters.mapType === 'satellite' ? 'bg-primary-green text-white border-primary-green' : 'bg-white text-soft-gray border-accent-green/10'}`}
                  >
                    Satellite
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Predictive Analysis Info Panel */}
      <AnimatePresence>
        {filters.predictive && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ 
              y: 0, 
              opacity: 1,
              height: isForecastMinimized ? 'auto' : 'auto',
              width: isForecastMinimized ? '180px' : '280px'
            }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-20 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-alert-red/20 sampaguita-shadow transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 border-b border-alert-red/10 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-alert-red animate-pulse" />
                <h5 className="text-[10px] font-black text-alert-red uppercase tracking-widest">
                  {isForecastMinimized ? 'Impact' : 'AI Impact Analysis'}
                </h5>
              </div>
              <button 
                onClick={() => setIsForecastMinimized(!isForecastMinimized)}
                className="p-1 hover:bg-alert-red/5 rounded-lg transition-colors"
              >
                {isForecastMinimized ? <Maximize2 className="w-3 h-3 text-alert-red" /> : <Minimize2 className="w-3 h-3 text-alert-red" />}
              </button>
            </div>
            
            {!isForecastMinimized && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3 h-3 text-blue-600" />
                    <span className="text-[10px] font-bold text-charcoal">Weather Input</span>
                  </div>
                  <span className="text-[10px] font-black text-blue-600">{forecast.rainfall}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-alert-red" />
                    <span className="text-[10px] font-bold text-charcoal">Hazards</span>
                  </div>
                  <span className="text-[10px] font-black text-alert-red">Flashflood Risk</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-3 h-3 text-soft-gray" />
                    <span className="text-[10px] font-bold text-charcoal">Est. Time</span>
                  </div>
                  <span className="text-[10px] font-black text-charcoal">{forecast.eta}</span>
                </div>

                <div className="mt-2 p-3 bg-alert-red/5 rounded-xl border border-alert-red/10">
                  <p className="text-[9px] font-black text-alert-red uppercase tracking-widest mb-1">Impact Correlation</p>
                  <p className="text-[10px] font-bold text-alert-red leading-tight italic">
                    "27°C + High Humidity + 30mm Rain = Potential Flashflood in Cuyab"
                  </p>
                </div>
              </motion.div>
            )}

            {isForecastMinimized && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-alert-red uppercase">High Risk</span>
                <div className="w-2 h-2 bg-alert-red rounded-full animate-pulse"></div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-[999] flex flex-col items-start gap-2">
        <AnimatePresence>
          {showLegend && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/90 backdrop-blur-md p-5 rounded-[2rem] border border-accent-green/10 space-y-4 sampaguita-shadow min-w-[160px]"
            >
              <div className="flex items-center justify-between border-b border-accent-green/10 pb-2">
                <h5 className="text-[10px] font-black text-primary-green uppercase tracking-widest">Map Guide</h5>
                <button 
                  onClick={() => setShowLegend(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-soft-gray" />
                </button>
              </div>
              <div className="space-y-2.5">
                {filters.dangerZones && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-alert-red/10 border border-alert-red border-dashed" />
                      <span className="text-[10px] font-bold text-charcoal">Danger Zone</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500/10 border border-blue-500 border-dashed" />
                      <span className="text-[10px] font-bold text-charcoal">Flood Zone (Baha)</span>
                    </div>
                  </>
                )}

                {filters.infrastructure && (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center border border-accent-green/20">
                      <span className="text-[8px]">🏢</span>
                    </div>
                    <span className="text-[10px] font-bold text-charcoal">Gusali (Infra)</span>
                  </div>
                )}

                {filters.evacuation && (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-primary-green shadow-sm flex items-center justify-center border border-white">
                      <span className="text-[8px]">🏠</span>
                    </div>
                    <span className="text-[10px] font-bold text-charcoal">Evac Centers</span>
                  </div>
                )}

                {filters.predictive && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-0.5 bg-alert-red border-dashed border-t-2" />
                      <span className="text-[10px] font-bold text-charcoal">Typhoon Path</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-600/30 border border-blue-600" />
                      <span className="text-[10px] font-bold text-charcoal">Rainfall Forecast</span>
                    </div>
                  </>
                )}
                {filters.predictive && weatherRisk !== 'low' && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-alert-red/30 border-2 border-alert-red animate-pulse" />
                    <span className="text-[10px] font-black text-alert-red uppercase tracking-tighter">High Risk (AI)</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setShowLegend(!showLegend)}
          className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-accent-green/10 sampaguita-shadow flex items-center gap-2 hover:bg-white transition-all"
        >
          <MapIcon className="w-4 h-4 text-primary-green" />
          <span className="text-[10px] font-black text-primary-green uppercase tracking-widest">
            {showLegend ? 'Hide Guide' : 'Show Guide'}
          </span>
        </button>
      </div>

      {/* Selected Zone Info Card */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-[2.5rem] p-8 sampaguita-shadow border-t border-accent-green/10"
          >
            <div className="w-12 h-1.5 bg-accent-green/20 rounded-full mx-auto mb-6" />
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-primary-green tracking-tight">{selectedZone.name}</h3>
                <p className="text-soft-gray text-xs font-bold uppercase tracking-widest mt-1">{selectedZone.type === 'flood' ? 'Flood' : 'Earthquake'} Risk Area</p>
              </div>
              <button 
                onClick={() => setSelectedZone(null)}
                className="p-2 rounded-full bg-soft-gray/10 text-soft-gray"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto pr-3 -mr-3 space-y-4 mb-6 custom-scrollbar overscroll-behavior-contain touch-pan-y">
              <div className="bg-alert-red/5 p-5 rounded-3xl border border-alert-red/10">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-alert-red" />
                  <h4 className="text-[10px] font-black text-alert-red uppercase tracking-widest">AI Impact Analysis</h4>
                </div>
                <p className="text-alert-red text-sm font-black italic mb-2">{selectedZone.impactAnalysis}</p>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-alert-red" />
                  <h4 className="text-[10px] font-black text-alert-red uppercase tracking-widest">Consequence</h4>
                </div>
                <p className="text-charcoal text-sm font-medium">{selectedZone.consequence}</p>
              </div>

              {selectedZone.healthRisk && (
                <div className="bg-alert-red/5 border border-alert-red/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3.5 h-3.5 text-alert-red" />
                    <p className="text-[10px] font-black text-alert-red uppercase tracking-widest">Health Related Risks</p>
                  </div>
                  <p className="text-sm font-medium text-charcoal leading-tight">
                    {selectedZone.healthRisk}
                  </p>
                </div>
              )}

              <div className="bg-primary-green/5 p-4 rounded-2xl border border-primary-green/10">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-primary-green" />
                  <h4 className="text-[10px] font-black text-primary-green uppercase tracking-widest">What to do?</h4>
                </div>
                <p className="text-charcoal text-sm font-medium">{selectedZone.action}</p>
              </div>
            </div>

            <button 
              onClick={handleViewEvacuationPlan}
              className="w-full bg-primary-green text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg"
            >
              View Evacuation Plan
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Infrastructure Info Card */}
      <AnimatePresence>
        {selectedInfra && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-[2.5rem] p-8 sampaguita-shadow border-t border-accent-green/10"
          >
            <div className="w-12 h-1.5 bg-accent-green/20 rounded-full mx-auto mb-6" />
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-primary-green tracking-tight">{selectedInfra.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black text-white uppercase tracking-widest ${selectedInfra.status === 'WEAK' ? 'bg-alert-red' : 'bg-primary-green'}`}>
                    {selectedInfra.status === 'WEAK' ? 'DANGER' : 'SAFE'}
                  </span>
                  {selectedInfra.usherVerified && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-blue-600 text-white uppercase tracking-widest flex items-center gap-1">
                      <Activity className="w-2 h-2" />
                      USHER Verified
                    </span>
                  )}
                  <p className="text-soft-gray text-xs font-bold uppercase tracking-widest">{selectedInfra.type}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInfra(null)}
                className="p-2 rounded-full bg-soft-gray/10 text-soft-gray"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto pr-3 -mr-3 mb-6 custom-scrollbar overscroll-behavior-contain touch-pan-y">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-soft-gray uppercase tracking-widest mb-1">Structural Health</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-2xl font-black ${selectedInfra.healthIndex < 50 ? 'text-alert-red' : 'text-primary-green'}`}>
                      {selectedInfra.healthIndex}%
                    </span>
                    <span className="text-[10px] font-bold text-soft-gray mb-1">Index</span>
                  </div>
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${selectedInfra.healthIndex < 50 ? 'bg-alert-red' : 'bg-primary-green'}`}
                      style={{ width: `${selectedInfra.healthIndex}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-soft-gray uppercase tracking-widest mb-1">Risk Level</p>
                  <p className={`text-sm font-black uppercase ${selectedInfra.status === 'WEAK' ? 'text-alert-red' : 'text-primary-green'}`}>
                    {selectedInfra.status === 'WEAK' ? 'High Hazard' : 'Low Risk'}
                  </p>
                  <p className="text-[9px] font-bold text-soft-gray mt-1 leading-tight">
                    {selectedInfra.status === 'WEAK' ? 'Structural integrity compromised' : 'Structure is stable'}
                  </p>
                </div>
              </div>

              <p className="text-charcoal text-sm leading-relaxed font-medium">
                {selectedInfra.description}
              </p>
            </div>

            <button 
              onClick={() => setIsReporting(true)}
              className="w-full border-2 border-primary-green text-primary-green font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-primary-green/5 transition-colors"
            >
              Report a Problem
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Problem Modal */}
      <AnimatePresence>
        {isReporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] flex items-center justify-center p-6 bg-charcoal/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 sampaguita-shadow relative overflow-hidden"
            >
              {reportSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-primary-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-10 h-10 text-primary-green" />
                  </div>
                  <h3 className="text-2xl font-black text-primary-green mb-2 tracking-tight">Report Sent!</h3>
                  <p className="text-soft-gray text-sm font-medium leading-relaxed">
                    Maraming salamat! Ang iyong ulat ay natanggap na at kasalukuyang sinusuri ng mga awtoridad.
                  </p>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsReporting(false)}
                    className="absolute top-6 right-6 p-2 rounded-full bg-soft-gray/10 text-soft-gray"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-alert-red/10 rounded-2xl">
                      <AlertTriangle className="w-6 h-6 text-alert-red" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-primary-green tracking-tight">Report Problem</h3>
                      <p className="text-soft-gray text-xs font-bold uppercase tracking-widest">{selectedInfra?.name}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-soft-gray uppercase tracking-widest mb-2 block">
                        Describe the issue
                      </label>
                      <textarea 
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Halimbawa: May nakitang malaking bitak sa pundasyon..."
                        className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-green/20 resize-none"
                      />
                    </div>

                    <button 
                      onClick={handleReportProblem}
                      disabled={!reportDescription.trim()}
                      className="w-full bg-primary-green text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-green/90 transition-colors"
                    >
                      Proceed to Report
                    </button>
                    
                    <p className="text-[10px] text-center text-soft-gray font-bold uppercase tracking-widest">
                      Your report will be reviewed by CDRRMO
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
