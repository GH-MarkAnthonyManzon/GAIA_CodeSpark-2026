import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  Loader2,
  CloudRain,
  Wind,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Droplets,
  Sun,
  Eye,
  Navigation,
  MapPin,
  ChevronDown,
  Search,
  ArrowLeft,
  CloudLightning,
  CloudSun,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchWeatherData, getPredictiveAnalysis, WeatherForecast, PredictionResult, SAN_PEDRO_LOCATIONS } from '../services/predictiveService';

export default function Alert() {
  // Predictive Analysis State
  const [weatherData, setWeatherData] = useState<WeatherForecast | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(11);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [view, setView] = useState<'main' | 'summary'>('main');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAnalyze = useCallback(async (index: number = selectedLocationIndex) => {
    setIsLoadingAnalysis(true);
    setError(null);
    try {
      const data = await fetchWeatherData(index);
      if (!data) {
        setError("OpenWeather API key is missing. Please add VITE_OPENWEATHER_API_KEY, OPENWEATHER_API_KEY, or VITE_OPENWEATHER_ to your Secrets.");
        setIsLoadingAnalysis(false);
        return;
      }
      setWeatherData(data);
      const analysis = await getPredictiveAnalysis(data);
      setPrediction(analysis);
    } catch (err: any) {
      setError(err.message || "Failed to generate predictive analysis. Please try again later.");
      console.error(err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [selectedLocationIndex]);

  useEffect(() => {
    handleAnalyze();
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'extreme': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-primary-green bg-white border-gray-100';
    }
  };

  const filteredBarangays = SAN_PEDRO_LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock data for summary view
  const getMockWeather = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const temps = [20, 22, 25, 28, 30];
    const conditions = ['Rainy', 'Sunny', 'Cloudy', 'Thunderstorm', 'Partly Cloudy'];
    const icons = [CloudRain, Sun, Cloud, CloudLightning, CloudSun];
    
    return {
      temp: temps[hash % temps.length],
      condition: conditions[hash % conditions.length],
      Icon: icons[hash % icons.length],
      high: temps[hash % temps.length] + 2,
      low: temps[hash % temps.length] - 4
    };
  };

  if (view === 'summary') {
    return (
      <div className="min-h-screen pb-24 -mx-6 -mt-6 px-6 pt-6 bg-white text-primary-green">
        <header className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setView('main')}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black tracking-tight">Weather Summary</h1>
        </header>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-soft-gray" />
          <input 
            type="text" 
            placeholder="Search for a barangay"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-green/20 transition-all"
          />
        </div>

        <div className="space-y-4">
          {filteredBarangays.map((loc) => {
            const weather = getMockWeather(loc.name);
            return (
              <motion.div 
                key={loc.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary-green text-white rounded-[2rem] p-8 flex items-center justify-between shadow-lg overflow-hidden relative min-h-[140px]"
              >
                <div className="relative z-10 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{loc.name}, San Pedro</p>
                  <div className="flex items-center gap-3">
                    <weather.Icon className="w-6 h-6 text-accent-green" />
                    <span className="text-lg font-black">{weather.condition}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    <span>H: {weather.high}°</span>
                    <span>L: {weather.low}°</span>
                  </div>
                </div>
                
                <div className="relative z-10 text-right">
                  <h2 className="text-6xl font-black tracking-tighter text-white">{weather.temp}°</h2>
                </div>

                <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 opacity-10">
                  <weather.Icon className="w-40 h-40" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 -mx-6 -mt-6 px-6 pt-6 bg-white text-primary-green">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="flex items-center gap-2 bg-primary-green/5 px-4 py-2 rounded-full border border-primary-green/10 hover:bg-primary-green/10 transition-all"
            >
              <MapPin className="w-4 h-4 text-primary-green" />
              <span className="text-sm font-bold tracking-tight text-primary-green">{SAN_PEDRO_LOCATIONS[selectedLocationIndex].name}</span>
              <ChevronDown className={`w-4 h-4 text-primary-green transition-transform ${showLocationPicker ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showLocationPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                >
                  <div className="max-h-64 overflow-y-auto">
                    {SAN_PEDRO_LOCATIONS.map((loc, idx) => (
                      <button
                        key={loc.name}
                        onClick={() => {
                          setSelectedLocationIndex(idx);
                          setShowLocationPicker(false);
                          handleAnalyze(idx);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-bold transition-all ${
                          selectedLocationIndex === idx ? 'bg-primary-green text-white' : 'text-primary-green hover:bg-primary-green/5'
                        }`}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setView('summary')}
            className="p-2 bg-primary-green/5 rounded-full border border-primary-green/10 hover:bg-primary-green/10 transition-all"
            title="Summarized Weather"
          >
            <Search className="w-4 h-4 text-primary-green" />
          </button>
        </div>

        <button 
          onClick={() => handleAnalyze()}
          disabled={isLoadingAnalysis}
          className="p-3 bg-primary-green/5 rounded-full border border-primary-green/10 hover:bg-primary-green/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-primary-green ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {error && (
        <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-3xl p-6 mb-8 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-200 flex-shrink-0" />
          <p className="text-sm font-bold text-red-500 leading-relaxed">{error}</p>
        </div>
      )}

      {isLoadingAnalysis && !weatherData && (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-16 h-16 animate-spin mb-6 opacity-60" />
          <p className="text-sm font-black uppercase tracking-[0.3em] opacity-60">Initializing AI Analysis</p>
        </div>
      )}

      {weatherData && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Main Weather Display - Optimized for Balance */}
          <div className="bg-primary-green text-white rounded-[3rem] shadow-2xl relative overflow-hidden p-10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-green/10 rounded-full -ml-40 -mb-40 blur-3xl" />
            
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <p className="text-xs font-black uppercase tracking-[0.4em] opacity-60 mb-8">
                {SAN_PEDRO_LOCATIONS[selectedLocationIndex].name}, San Pedro
              </p>

              <div className="flex flex-col items-center gap-6 w-full">
                <div className="relative">
                  <h1 className="text-[12rem] font-black tracking-tighter leading-none drop-shadow-2xl text-white">
                    {Math.round(weatherData.temp_c)}°
                  </h1>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="p-8 bg-white/10 rounded-[3rem] backdrop-blur-md border border-white/10 shadow-inner">
                    <Sun className="w-24 h-24 text-yellow-300 drop-shadow-[0_0_30px_rgba(253,224,71,0.6)]" />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-4xl font-black capitalize tracking-tight">{weatherData.condition}</p>
                    <div className="flex justify-center gap-6 text-lg font-bold opacity-60 tracking-widest">
                      <span>H: {Math.round(weatherData.forecast_days[0].max_temp)}°</span>
                      <span>L: {Math.round(weatherData.forecast_days[0].min_temp)}°</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* AI Predictive Analysis Card */}
          {prediction && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`border rounded-[2.5rem] p-8 shadow-xl ${getRiskColor(prediction.riskLevel)}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-green/10 rounded-2xl flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-primary-green" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-primary-green">Predictive Analysis</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-soft-gray">AI Risk Assessment</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-soft-gray block">Last Updated</span>
                  <span className="text-xs font-bold text-primary-green">{new Date(prediction.lastUpdated).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 mb-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-black uppercase tracking-widest">Risk Level: {prediction.riskLevel}</span>
                </div>
                <p className="text-sm font-bold leading-relaxed text-charcoal mb-4">
                  {prediction.summary}
                </p>
                <div className="p-4 bg-primary-green/5 rounded-2xl border border-primary-green/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary-green mb-2">Impact Analysis</p>
                  <p className="text-xs font-bold leading-relaxed text-primary-green italic">
                    {prediction.impactAnalysis}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-soft-gray ml-2">Recommended Actions</h3>
                <div className="grid gap-3">
                  {prediction.recommendations.map((rec, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                    >
                      <div className="w-6 h-6 bg-primary-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-green" />
                      </div>
                      <p className="text-xs font-bold leading-relaxed text-charcoal">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Humidity', value: `${weatherData.humidity}%`, icon: Droplets },
              { label: 'Wind', value: `${Math.round(weatherData.wind_speed)} km/h`, icon: Wind },
              { label: 'Visibility', value: `${Math.round(weatherData.visibility)} km`, icon: Eye },
              { label: 'Pressure', value: `${weatherData.pressure} hPa`, icon: Navigation },
            ].map((detail) => (
              <div key={detail.label} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-soft-gray">
                  <detail.icon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{detail.label}</span>
                </div>
                <p className="text-2xl font-black text-primary-green">{detail.value}</p>
              </div>
            ))}
          </div>

          {/* 3-Day Forecast */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-soft-gray mb-6">3-Day Forecast</h3>
            <div className="space-y-6">
              {weatherData.forecast_days.map((day, idx) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm font-bold w-20 text-primary-green">
                    {idx === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <div className="flex items-center gap-3 flex-1 justify-center">
                    <CloudRain className="w-5 h-5 text-accent-green" />
                    <span className="text-[10px] font-bold text-soft-gray">{Math.round(day.daily_chance_of_rain)}%</span>
                  </div>
                  <div className="flex items-center gap-4 w-24 justify-end">
                    <span className="text-sm font-bold text-primary-green">{Math.round(day.max_temp)}°</span>
                    <span className="text-sm font-bold text-soft-gray">{Math.round(day.min_temp)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
