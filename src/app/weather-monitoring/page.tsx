'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CloudSun, Thermometer, Droplets, Wind, MapPin, RefreshCw } from 'lucide-react';
import { useUserProfile } from '@/contexts/user-profile-context';

interface WeatherData {
  location: string;
  current: {
    temp: string;
    description: string;
    humidity: string;
    wind: string;
  };
  forecast: Array<{
    day: string;
    temp: string;
    description: string;
  }>;
}

// Mock weather data function
const getMockWeatherData = (location: string): WeatherData => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return {
    location: location || "Your Location",
    current: {
      temp: `${Math.floor(Math.random() * 15 + 15)}°C`, // 15-30°C
      description: ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"][Math.floor(Math.random() * 4)],
      humidity: `${Math.floor(Math.random() * 50 + 40)}%`, // 40-90%
      wind: `${Math.floor(Math.random() * 15 + 5)} km/h`, // 5-20 km/h
    },
    forecast: days.map(day => ({
      day,
      temp: `${Math.floor(Math.random() * 10 + 18)}°C / ${Math.floor(Math.random() * 5 + 10)}°C`, // High/Low
      description: ["Sunny", "Mostly Sunny", "Scattered Showers", "Cloudy"][Math.floor(Math.random() * 4)],
    })),
  };
};


export default function WeatherMonitoringPage() {
  const { userProfile } = useUserProfile();
  const [locationInput, setLocationInput] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedLocation = localStorage.getItem('weatherLocation');
    if (storedLocation) {
        setLocationInput(storedLocation);
    }
  }, []);

  const fetchWeatherData = (loc: string) => {
    if (!loc) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setWeatherData(getMockWeatherData(loc));
      if (isMounted) {
        localStorage.setItem('weatherLocation', loc);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleLocationChange = () => {
    if (locationInput) {
      fetchWeatherData(locationInput);
    }
  };
  
  if (!isMounted) {
    return null; // or a loading skeleton
  }

  return (
    <div>
      <PageHeader
        title="Weather Monitoring"
        icon={CloudSun}
        description="Get weather forecasts for any location. Data shown is for demonstration purposes."
      />

      <Card className="mb-6 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow">
              <Label htmlFor="location" className="font-semibold">Enter a Location</Label>
              <Input
                id="location"
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="e.g., Accra, Ghana"
                className="mt-1"
                onKeyDown={(e) => { if (e.key === 'Enter') handleLocationChange(); }}
              />
            </div>
            <Button onClick={handleLocationChange} disabled={isLoading || !locationInput} className="w-full sm:w-auto">
              {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              {isLoading ? 'Loading...' : 'Get Weather'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
         <div className="text-center py-10">
            <RefreshCw className="mx-auto h-12 w-12 text-primary animate-spin" />
            <p className="mt-2 text-muted-foreground">Loading weather data...</p>
        </div>
      )}

      {!isLoading && weatherData && (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Current Weather: {weatherData.location}</CardTitle>
              <CardDescription>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <Thermometer className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="text-lg font-semibold">{weatherData.current.temp}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <CloudSun className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <p className="text-lg font-semibold">{weatherData.current.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <Droplets className="h-8 w-8 text-sky-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Humidity</p>
                  <p className="text-lg font-semibold">{weatherData.current.humidity}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <Wind className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Wind</p>
                  <p className="text-lg font-semibold">{weatherData.current.wind}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">5-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {weatherData.forecast.map((dayForecast, index) => (
                  <Card key={index} className="text-center bg-background p-4 shadow-sm hover:shadow-md transition-shadow">
                    <CardTitle className="text-md font-semibold">{dayForecast.day}</CardTitle>
                    <CloudSun className="h-10 w-10 text-primary mx-auto my-2" />
                    <p className="text-lg">{dayForecast.temp}</p>
                    <p className="text-xs text-muted-foreground">{dayForecast.description}</p>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !weatherData && (
        <div className="text-center py-10">
            <CloudSun className="mx-auto h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">Enter a location above to see the weather forecast.</p>
        </div>
      )}

    </div>
  );
}
