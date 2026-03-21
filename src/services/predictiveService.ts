import { GoogleGenAI, Type } from "@google/genai";

const OPENWEATHER_API_KEY = 
  import.meta.env.VITE_OPENWEATHER_API_KEY || 
  process.env.VITE_OPENWEATHER_API_KEY || 
  process.env.OPENWEATHER_API_KEY ||
  process.env.VITE_OPENWEATHER_;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface WeatherForecast {
  location: string;
  condition: string;
  temp_c: number;
  precip_mm: number;
  chance_of_rain: number;
  humidity: number;
  wind_speed: number;
  pressure: number;
  visibility: number;
  forecast_days: {
    date: string;
    max_temp: number;
    min_temp: number;
    condition: string;
    total_precip: number;
    daily_chance_of_rain: number;
  }[];
}

export interface PredictionResult {
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  summary: string;
  impactAnalysis: string;
  recommendations: string[];
  lastUpdated: string;
}

// San Pedro, Laguna Barangays
export const SAN_PEDRO_LOCATIONS = [
  { name: "Bagong Silang", lat: 14.3506, lon: 121.0536 },
  { name: "Calendola", lat: 14.3516, lon: 121.0546 },
  { name: "Chrysanthemum", lat: 14.3526, lon: 121.0556 },
  { name: "Ciudad Real", lat: 14.3536, lon: 121.0566 },
  { name: "Cuyab", lat: 14.3546, lon: 121.0576 },
  { name: "Fatima", lat: 14.3556, lon: 121.0586 },
  { name: "G.S.I.S.", lat: 14.3566, lon: 121.0596 },
  { name: "Landayan", lat: 14.3576, lon: 121.0606 },
  { name: "Langgam", lat: 14.3586, lon: 121.0616 },
  { name: "Laram", lat: 14.3596, lon: 121.0626 },
  { name: "Maharlika", lat: 14.3606, lon: 121.0636 },
  { name: "Magsaysay", lat: 14.3616, lon: 121.0646 },
  { name: "Narra", lat: 14.3626, lon: 121.0656 },
  { name: "Nueva", lat: 14.3636, lon: 121.0666 },
  { name: "Pacita Complex I", lat: 14.3646, lon: 121.0676 },
  { name: "Pacita Complex II", lat: 14.3656, lon: 121.0686 },
  { name: "Poblacion", lat: 14.3666, lon: 121.0696 },
  { name: "Riverside", lat: 14.3676, lon: 121.0706 },
  { name: "Rosario", lat: 14.3686, lon: 121.0716 },
  { name: "Sacred Heart", lat: 14.3696, lon: 121.0726 },
  { name: "Sampaguita Village", lat: 14.3706, lon: 121.0736 },
  { name: "San Antonio", lat: 14.3716, lon: 121.0746 },
  { name: "San Lorenzo Ruiz", lat: 14.3726, lon: 121.0756 },
  { name: "San Roque", lat: 14.3736, lon: 121.0766 },
  { name: "San Vicente", lat: 14.3746, lon: 121.0776 },
  { name: "Santo Niño", lat: 14.3756, lon: 121.0786 },
  { name: "United Bayanihan", lat: 14.3766, lon: 121.0796 },
  { name: "United Better Living", lat: 14.3776, lon: 121.0806 },
];

export async function fetchWeatherData(locationIndex: number = 0): Promise<WeatherForecast | null> {
  const loc = SAN_PEDRO_LOCATIONS[locationIndex] || SAN_PEDRO_LOCATIONS[0];
  
  console.log(`Checking API Key for ${loc.name}:`, OPENWEATHER_API_KEY ? `Found (starts with ${OPENWEATHER_API_KEY.substring(0, 4)}...)` : "Not Found");
  if (!OPENWEATHER_API_KEY) {
    console.warn("OpenWeather API key is missing.");
    return null;
  }

  try {
    // Switching to 2.5 Forecast API as it's more commonly available on the free tier than One Call 3.0
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${loc.lat}&lon=${loc.lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`OpenWeather API error (${response.status}): ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Current weather is the first item in the list
    const current = data.list[0];
    
    // Group by day to get 3-day forecast
    const dailyMap: { [key: string]: any[] } = {};
    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap[date]) dailyMap[date] = [];
      dailyMap[date].push(item);
    });

    const forecastDays = Object.keys(dailyMap).slice(0, 3).map(date => {
      const dayItems = dailyMap[date];
      const maxTemp = Math.max(...dayItems.map(i => i.main.temp_max));
      const minTemp = Math.min(...dayItems.map(i => i.main.temp_min));
      const totalPrecip = dayItems.reduce((sum, i) => sum + (i.rain ? i.rain['3h'] || 0 : 0), 0);
      const avgPop = dayItems.reduce((sum, i) => sum + (i.pop || 0), 0) / dayItems.length;

      return {
        date,
        max_temp: maxTemp,
        min_temp: minTemp,
        condition: dayItems[0].weather[0].description,
        total_precip: totalPrecip,
        daily_chance_of_rain: avgPop * 100,
      };
    });

    return {
      location: "San Pedro, Laguna",
      condition: current.weather[0].description,
      temp_c: current.main.temp,
      precip_mm: current.rain ? current.rain['3h'] || 0 : 0,
      chance_of_rain: current.pop * 100,
      humidity: current.main.humidity,
      wind_speed: current.wind.speed * 3.6, // Convert m/s to km/h
      pressure: current.main.pressure,
      visibility: current.visibility / 1000, // Convert m to km
      forecast_days: forecastDays,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

export async function getPredictiveAnalysis(weatherData: WeatherForecast): Promise<PredictionResult> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = `
    Analyze the following weather forecast for ${weatherData.location} and provide a disaster risk assessment.
    
    CRITICAL: Emphasize the IMPACT ANALYSIS. Don't just list weather data. Show how the combination of weather inputs leads to specific local impacts.
    Example: "27°C + 85% Humidity + 10mm Rain = Potential Flashflood in low-lying areas like Cuyab."
    
    Current Weather Inputs:
    - Condition: ${weatherData.condition}
    - Temperature: ${weatherData.temp_c}°C
    - Humidity: ${weatherData.humidity}%
    - Wind Speed: ${weatherData.wind_speed} km/h
    - Precipitation: ${weatherData.precip_mm}mm
    
    3-Day Forecast:
    ${weatherData.forecast_days.map(d => `- ${d.date}: ${d.condition}, Max ${d.max_temp}°C, Total Precip ${d.total_precip}mm, Chance of Rain ${d.daily_chance_of_rain}%`).join('\n')}
    
    Identify potential risks (e.g., flood risk if precipitation is high, heat wave if temp is high).
    Provide:
    1. riskLevel: 'low', 'medium', 'high', or 'extreme'
    2. summary: A high-level overview of the situation.
    3. impactAnalysis: A detailed mapping of weather inputs to specific local impacts (e.g., "High Temp + High Humidity = Extreme Heat Index risk for elderly").
    4. recommendations: A list of actionable steps.
    
    Respond in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ['low', 'medium', 'high', 'extreme'] },
            summary: { type: Type.STRING },
            impactAnalysis: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['riskLevel', 'summary', 'impactAnalysis', 'recommendations']
        }
      }
    });

    const result = JSON.parse(response.text);
    return {
      ...result,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error in predictive analysis:", error);
    return {
      riskLevel: 'low',
      summary: "Unable to generate analysis at this time.",
      impactAnalysis: "Weather data is stable, but real-time impact mapping is currently unavailable.",
      recommendations: ["Monitor local news for updates.", "Stay prepared for weather changes."],
      lastUpdated: new Date().toISOString()
    };
  }
}
