// Fuzz coordinates by adding random 20-50 meter offset for privacy
function fuzzCoordinates(lat, lng) {
  // 1 degree ≈ 111km, so 0.0001 degree ≈ 11 meters
  const offsetMeters = 20 + Math.random() * 30; // 20-50 meters
  const offsetDegrees = offsetMeters / 111000;
  
  const randomAngle = Math.random() * 2 * Math.PI;
  const latOffset = offsetDegrees * Math.cos(randomAngle);
  const lngOffset = offsetDegrees * Math.sin(randomAngle);
  
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset,
  };
}

// Reverse geocode using OpenStreetMap Nominatim API
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DigitalLostFound/1.0',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    // Extract meaningful address
    const address = data.display_name || 
                   `${data.address?.building || data.address?.amenity || 'Unknown Location'}`;
    
    return address;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Location unavailable';
  }
}

module.exports = {
  fuzzCoordinates,
  reverseGeocode,
};
