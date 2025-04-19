tailwind.config = {
             darkMode: 'class',
             theme: {
                 extend: {
                     animation: {
                         float: 'float 3s ease-in-out infinite',
                         gradient: 'gradient 15s ease infinite',
                         spin: 'spin 1s linear infinite'
                     },
                     keyframes: {
                         float: {
                             '0%, 100%': { transform: 'translateY(0)' },
                             '50%': { transform: 'translateY(-10px)' }
                         },
                         gradient: {
                             '0%, 100%': { backgroundPosition: '0% 50%' },
                             '50%': { backgroundPosition: '100% 50%' }
                         }
                     }
                 }
             }
         }
 document.addEventListener('DOMContentLoaded', function () {
     // Replace with your actual API key 
     const apiKey = '';
     const weatherContainer = document.getElementById('weatherContainer');
     const loadingElement = document.getElementById('loading');
     const errorElement = document.getElementById('error');
     const locationInput = document.getElementById('locationInput');
     const searchBtn = document.getElementById('searchBtn');
     const currentLocationBtn = document.getElementById('currentLocationBtn');
     const unitCelsius = document.getElementById('unitCelsius');
     const unitFahrenheit = document.getElementById('unitFahrenheit');
     const searchHistory = document.getElementById('searchHistory');
     const recentSearches = document.getElementById('recentSearches');
 
     let currentUnit = 'metric';
     let currentLocation = '';
 
     // Initialize with default location and load recent searches
     fetchWeather('London');
     loadSearchHistory();
 
     // Event listeners
     searchBtn.addEventListener('click', searchWeather);
     currentLocationBtn.addEventListener('click', getCurrentLocationWeather);
     unitCelsius.addEventListener('click', () => setTemperatureUnit('metric'));
     unitFahrenheit.addEventListener('click', () => setTemperatureUnit('imperial'));
     locationInput.addEventListener('keypress', (e) => {
         if (e.key === 'Enter') searchWeather();
     });
 
     function searchWeather() {
         const location = sanitizeInput(locationInput.value.trim());
         if (location) {
             fetchWeather(location);
             saveToHistory(location);
         }
     }
 
     function fetchWeather(location, isCoord = false) {
         showLoading();
         currentLocation = location;
         let apiUrl;
 
         if (isCoord) {
             const [lat, lon] = location.split(',');
             apiUrl = https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit};
         } else {
             const encodedLocation = encodeURIComponent(location);
             apiUrl = https://api.openweathermap.org/data/2.5/weather?q=${encodedLocation}&appid=${apiKey}&units=${currentUnit};
         }
 
         fetch(apiUrl)
             .then(response => {
                 if (!response.ok) throw new Error('Location not found');
                 return response.json();
             })
             .then(data => {
                 displayWeather(data);
                 return fetchForecast(data.coord.lat, data.coord.lon);
             })
             .then(forecastData => {
                 displayHourlyForecast(forecastData);
                 hideLoading();
             })
             .catch(error => {
                 showError(error.message || 'An error occurred. Try again.');
                 hideLoading();
             });
     }
 
     function fetchForecast(lat, lon) {
         return fetch(https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}&cnt=5)
             .then(response => {
                 if (!response.ok) throw new Error('Forecast data not available');
                 return response.json();
             });
     }
 
     function getCurrentLocationWeather() {
         if (navigator.geolocation) {
             showLoading();
             navigator.geolocation.getCurrentPosition(
                 position => {
                     const location = ${position.coords.latitude},${position.coords.longitude};
                     fetchWeather(location, true);
                 },
                 error => {
                     showError('Geolocation failed. Please enable location services or try manual search.');
                     hideLoading();
                 },
                 { timeout: 10000 } // 10 second timeout
             );
         } else {
             showError('Geolocation is not supported by your browser.');
         }
     }
 
     function displayWeather(data) {
         const date = new Date();
         const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
 
         document.getElementById('location').textContent = ${data.name}, ${data.sys.country || ''};
         document.getElementById('date').textContent = date.toLocaleDateString('en-US', options);
         updateTemperatureDisplay(data.main.temp, 'currentTemp');
         document.getElementById('weatherDescription').textContent = data.weather[0].description;
         updateTemperatureDisplay(data.main.feels_like, 'feelsLike');
         document.getElementById('humidity').textContent = ${data.main.humidity}%;
         document.getElementById('windSpeed').textContent = currentUnit === 'metric' 
             ? ${(data.wind.speed * 3.6).toFixed(1)} km/h 
             : ${(data.wind.speed * 2.237).toFixed(1)} mph;
         document.getElementById('pressure').textContent = ${data.main.pressure} hPa;
 
         const weatherIcon = document.getElementById('weatherIcon');
         const weatherCode = data.weather[0].id;
         const isDay = date.getHours() >= 6 && date.getHours() < 18;
 
         // Clear previous icon
         weatherIcon.innerHTML = '';
         
         if (weatherCode >= 200 && weatherCode < 300) {
             weatherIcon.innerHTML = '<i class="fas fa-bolt"></i>';
         } else if (weatherCode >= 300 && weatherCode < 400) {
             weatherIcon.innerHTML = '<i class="fas fa-cloud-rain"></i>';
         } else if (weatherCode >= 500 && weatherCode < 600) {
             weatherIcon.innerHTML = '<i class="fas fa-umbrella"></i>';
         } else if (weatherCode >= 600 && weatherCode < 700) {
             weatherIcon.innerHTML = '<i class="fas fa-snowflake"></i>';
         } else if (weatherCode >= 700 && weatherCode < 800) {
             weatherIcon.innerHTML = '<i class="fas fa-smog"></i>';
         } else if (weatherCode === 800) {
             weatherIcon.innerHTML = isDay ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
         } else if (weatherCode > 800) {
             weatherIcon.innerHTML = '<i class="fas fa-cloud"></i>';
         }
 
         weatherContainer.classList.remove('hidden');
         errorElement.classList.add('hidden');
     }
 
     function displayHourlyForecast(data) {
         const hourlyForecast = document.getElementById('hourlyForecast');
         hourlyForecast.innerHTML = '';
 
         // Ensure we have forecast data
         if (!data || !data.list) {
             hourlyForecast.innerHTML = '<p class="text-sm opacity-80">Hourly forecast not available</p>';
             return;
         }
 
         // Show next 5 hours of forecast
         const now = new Date();
         const upcomingForecasts = data.list.filter(forecast => {
             const forecastTime = new Date(forecast.dt * 1000);
             return forecastTime > now;
         }).slice(0, 5);
 
         if (upcomingForecasts.length === 0) {
             hourlyForecast.innerHTML = '<p class="text-sm opacity-80">No upcoming forecast data</p>';
             return;
         }
 
         upcomingForecasts.forEach(forecast => {
             const date = new Date(forecast.dt * 1000);
             const hour = date.getHours();
             const ampm = hour >= 12 ? 'PM' : 'AM';
             const displayHour = hour % 12 || 12;
 
             const forecastItem = document.createElement('div');
             forecastItem.className = 'flex flex-col items-center bg-white bg-opacity-10 p-2 rounded-lg min-w-[60px]';
             forecastItem.innerHTML = 
                 `<p class="text-sm">${displayHour}${ampm}</p>
                 <i class="text-2xl my-1 ${getWeatherIconClass(forecast.weather[0].id)}"></i>
                 <p class="font-medium">${Math.round(forecast.main.temp)}°</p>`;
             hourlyForecast.appendChild(forecastItem);
         });
     }
 
     function setTemperatureUnit(unit) {
         if (currentUnit !== unit) {
             currentUnit = unit;
             // Update button styles
             if (unit === 'metric') {
                 unitCelsius.classList.add('bg-blue-500');
                 unitCelsius.classList.remove('bg-gray-500');
                 unitFahrenheit.classList.add('bg-gray-500');
                 unitFahrenheit.classList.remove('bg-blue-500');
             } else {
                 unitFahrenheit.classList.add('bg-blue-500');
                 unitFahrenheit.classList.remove('bg-gray-500');
                 unitCelsius.classList.add('bg-gray-500');
                 unitCelsius.classList.remove('bg-blue-500');
             }
             // Refresh weather data with new unit
             if (currentLocation) {
                 fetchWeather(currentLocation, currentLocation.includes(','));
             }
         }
     }
 
     function updateTemperatureDisplay(temp, elementId) {
         const temperature = currentUnit === 'metric' ? Math.round(temp) : Math.round((temp * 9/5) + 32);
         document.getElementById(elementId).textContent = ${temperature}°${currentUnit === 'metric' ? 'C' : 'F'};
     }
 
     function getWeatherIconClass(weatherCode) {
         if (weatherCode >= 200 && weatherCode < 300) return 'fas fa-bolt';
         if (weatherCode >= 300 && weatherCode < 400) return 'fas fa-cloud-rain';
         if (weatherCode >= 500 && weatherCode < 600) return 'fas fa-umbrella';
         if (weatherCode >= 600 && weatherCode < 700) return 'fas fa-snowflake';
         if (weatherCode >= 700 && weatherCode < 800) return 'fas fa-smog';
         if (weatherCode === 800) return 'fas fa-sun';
         if (weatherCode > 800) return 'fas fa-cloud';
         return 'fas fa-question';
     }
 
     function saveToHistory(location) {
         const history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
         if (!history.includes(location)) {
             history.unshift(location);
             localStorage.setItem('weatherHistory', JSON.stringify(history.slice(0, 5)));
             loadSearchHistory();
         }
     }
 
     function loadSearchHistory() {
         const history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
         if (history.length > 0) {
             searchHistory.innerHTML = '';
             history.forEach(location => {
                 const item = document.createElement('button');
                 item.className = 'bg-white bg-opacity-10 hover:bg-opacity-20 px-3 py-1 rounded-full text-sm transition';
                 item.textContent = location;
                 item.addEventListener('click', () => {
                     locationInput.value = location;
                     fetchWeather(location);
                 });
                 searchHistory.appendChild(item);
             });
             recentSearches.classList.remove('hidden');
         } else {
             recentSearches.classList.add('hidden');
         }
     }
 
     function sanitizeInput(input) {
         return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
     }
 
     function showLoading() {
         weatherContainer.classList.add('hidden');
         errorElement.classList.add('hidden');
         loadingElement.classList.remove('hidden');
     }
 
     function hideLoading() {
         loadingElement.classList.add('hidden');
     }
 
     function showError(message) {
         weatherContainer.classList.add('hidden');
         document.getElementById('errorMessage').textContent = message;
         errorElement.classList.remove('hidden');
     }
 });
