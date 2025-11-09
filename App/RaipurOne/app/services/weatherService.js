const OWM_API_KEY = '40912be1499980a4e22d60c80e398463'; // Get from openweathermap.org
const OWM_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPEN_METEO_ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';

export const weatherService = {
  // Get current weather for Raipur
  async getCurrentWeather(city = 'Raipur') {
    try {
      const response = await fetch(
        `${OWM_BASE_URL}/weather?q=${city},IN&appid=${OWM_API_KEY}&units=metric`
      );
      const data = await response.json();
      
      if (data.cod !== 200) throw new Error(data.message);
      
      return {
        success: true,
        data: {
          temp: data.main.temp,
          feelsLike: data.main.feels_like,
          humidity: data.main.humidity,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          aqi: data.main.aqi || 'N/A',
        },
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return { success: false, error: error.message };
    }
  },

  // Get air quality index
  async getAQI(lat = 21.2514, lon = 81.6296) { // Raipur coordinates
    try {
      const response = await fetch(
        `${OWM_BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}`
      );
      const data = await response.json();
      
      const aqiValue = data.list[0].main.aqi;
      const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
      
      return {
        success: true,
        data: {
          value: aqiValue,
          label: aqiLabels[aqiValue - 1],
          components: data.list[0].components,
        },
      };
    } catch (error) {
      console.error('Error fetching AQI:', error);
      return { success: false, error: error.message };
    }
  },

  // Get past 7 days daily summary for Raipur (no API key required)
  async getPast7Days(lat = 21.2514, lon = 81.6296) {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6); // inclusive range of 7 days

      const format = (d) => d.toISOString().slice(0, 10);
      const url = `${OPEN_METEO_ARCHIVE}?latitude=${lat}&longitude=${lon}&start_date=${format(start)}&end_date=${format(end)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data.daily) throw new Error('No archive data');

      const days = data.daily.time.map((date, idx) => ({
        date,
        tmax: data.daily.temperature_2m_max[idx],
        tmin: data.daily.temperature_2m_min[idx],
        precipitation: data.daily.precipitation_sum[idx],
        code: data.daily.weathercode[idx],
      }));

      return { success: true, data: days };
    } catch (error) {
      console.error('Error fetching past 7 days:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Optional: next 7 days forecast
  async getNext7Days(lat = 21.2514, lon = 81.6296) {
    try {
      const url = `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data || !data.daily) throw new Error('No forecast data');

      const days = data.daily.time.map((date, idx) => ({
        date,
        tmax: data.daily.temperature_2m_max[idx],
        tmin: data.daily.temperature_2m_min[idx],
        precipitation: data.daily.precipitation_sum[idx],
        code: data.daily.weathercode[idx],
      }));
      return { success: true, data: days };
    } catch (error) {
      console.error('Error fetching next 7 days:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
};
