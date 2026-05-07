import { useState } from 'react';
import { MapPin, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LocationPicker({ onLocationSelect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
            {
              headers: {
                'User-Agent': 'DigitalLostFound/1.0',
              },
            }
          );
          
          const data = await response.json();
          const address = data.display_name || 'Unknown location';
          
          const locationData = {
            lat: latitude,
            lng: longitude,
            address: address.split(',').slice(0, 3).join(','), // Shortened address
          };
          
          setLocation(locationData);
          onLocationSelect(locationData);
        } catch (err) {
          setError('Failed to get address');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Unable to retrieve your location');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3">
      <motion.button
        type="button"
        onClick={getCurrentLocation}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/30 transition disabled:opacity-50"
      >
        <Crosshair size={18} />
        {loading ? 'Getting location...' : 'Use My Current Location'}
      </motion.button>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {location && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-400/30 text-sm"
        >
          <MapPin size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-300 font-medium">Location captured</p>
            <p className="text-white/60 text-xs mt-1">{location.address}</p>
            <p className="text-white/40 text-xs mt-1">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
