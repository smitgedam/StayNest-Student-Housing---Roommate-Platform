import { Router, Request, Response } from 'express';

export const geocodeRouter = Router();

const USER_AGENT = 'StudentMessFinderApp/1.0 (contact@campusmess.org)';

// Reverse geocoding endpoint: coordinates -> address
geocodeRouter.get('/reverse', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Valid lat and lng query parameters required' });
  }

  // 1. Try Nominatim with compliant User-Agent header
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.street || addr.footway || addr.path || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.district || '';
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        const state = addr.state || addr.province || addr.state_district || '';
        const country = addr.country || '';

        const parts = [road, suburb, city, state, country].filter((p, idx, arr) => Boolean(p) && arr.indexOf(p) === idx);
        const formatted = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 4).join(', ');

        return res.json({
          address: formatted,
          full_address: data.display_name,
          country: country,
          city: city,
          lat,
          lng,
        });
      }
    }
  } catch (err) {
    // Fall through to backup
  }

  // 2. Fallback to Photon Komoot API
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const pRes = await fetch(photonUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (pRes.ok) {
      const pData = await pRes.json();
      if (pData && pData.features && pData.features.length > 0) {
        const props = pData.features[0].properties || {};
        const name = props.name || '';
        const street = props.street || '';
        const district = props.district || '';
        const city = props.city || props.county || '';
        const state = props.state || '';
        const country = props.country || '';

        const parts = [name, street, district, city, state, country].filter(
          (p, idx, arr) => Boolean(p) && arr.indexOf(p) === idx
        );
        const formatted = parts.length > 0 ? parts.join(', ') : `Location near [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;

        return res.json({
          address: formatted,
          country: country,
          city: city,
          lat,
          lng,
        });
      }
    }
  } catch (err) {
    // Fall through
  }

  // 3. Fallback based on coordinates (neutral, never assuming Delhi)
  let generalRegion = '';
  // Sri Lanka rough bounds: lat 5.8 to 9.9, lon 79.5 to 82.0
  if (lat >= 5.8 && lat <= 9.9 && lng >= 79.5 && lng <= 82.0) {
    generalRegion = 'Sri Lanka';
  } else if (lat >= 8.0 && lat <= 37.0 && lng >= 68.0 && lng <= 97.5) {
    generalRegion = 'India';
  }

  const fallbackAddress = generalRegion
    ? `Location near [${lat.toFixed(4)}, ${lng.toFixed(4)}], ${generalRegion}`
    : `Pinned Location [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;

  return res.json({
    address: fallbackAddress,
    lat,
    lng,
  });
});

// Search endpoint: query -> coordinates + label
geocodeRouter.get('/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Search query required' });
  }

  // 1. Try Nominatim
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return res.json({
            coords: [lat, lon],
            label: item.display_name?.split(',').slice(0, 4).join(', ') || query,
          });
        }
      }
    }
  } catch (err) {
    // Fall through
  }

  // 2. Try Photon Komoot
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
    const pRes = await fetch(photonUrl);
    if (pRes.ok) {
      const pData = await pRes.json();
      if (pData && pData.features && pData.features.length > 0) {
        const feat = pData.features[0];
        const [lon, lat] = feat.geometry?.coordinates || [];
        const numLat = parseFloat(lat);
        const numLon = parseFloat(lon);
        if (!isNaN(numLat) && !isNaN(numLon) && isFinite(numLat) && isFinite(numLon)) {
          const props = feat.properties || {};
          const label = [props.name, props.city, props.state, props.country].filter(Boolean).join(', ') || query;
          return res.json({
            coords: [numLat, numLon],
            label,
          });
        }
      }
    }
  } catch (err) {
    // Fall through
  }

  return res.status(404).json({ error: 'Location not found' });
});
