// Geocoding and Reverse-Geocoding utility: instant local campus matching + OpenStreetMap Nominatim

export interface KnownLocation {
  keywords: string[];
  coords: [number, number]; // [lat, lng]
  label: string;
}

export const KNOWN_CAMPUS_LOCATIONS: KnownLocation[] = [
  {
    keywords: ['dtu', 'delhi technological university', 'shahbad', 'daulatpur', 'main campus'],
    coords: [28.7495, 77.1175],
    label: 'Delhi Technological University (DTU) Main Campus, Delhi',
  },
  {
    keywords: ['gate 1', 'dtu gate 1', 'bawana road gate 1'],
    coords: [28.7520, 77.1180],
    label: 'DTU Gate 1, Bawana Road, Rohini',
  },
  {
    keywords: ['gate 2', 'dtu gate 2', 'sunrise pg', 'main market gate 2'],
    coords: [28.7512, 77.1190],
    label: 'DTU Gate 2, Main Student Market, Bawana Road',
  },
  {
    keywords: ['gate 3', 'dtu gate 3'],
    coords: [28.7480, 77.1160],
    label: 'DTU Gate 3, Sports Complex Road',
  },
  {
    keywords: ['bawana', 'bawana road'],
    coords: [28.7535, 77.1150],
    label: 'Bawana Road, Shahbad Daulatpur, Rohini',
  },
  {
    keywords: ['sector 17', 'rohini sector 17', 'sec 17', 'shop 15'],
    coords: [28.7420, 77.1260],
    label: 'Sector 17, Rohini, North West Delhi',
  },
  {
    keywords: ['sector 16', 'rohini sector 16', 'sec 16', 'block c'],
    coords: [28.7360, 77.1240],
    label: 'Sector 16, Rohini, North West Delhi',
  },
  {
    keywords: ['sector 11', 'rohini sector 11', 'sec 11'],
    coords: [28.7280, 77.1180],
    label: 'Sector 11, Rohini, North West Delhi',
  },
  {
    keywords: ['sector 15', 'rohini sector 15', 'sec 15', 'metro pillar'],
    coords: [28.7320, 77.1290],
    label: 'Sector 15, Rohini, North West Delhi',
  },
  {
    keywords: ['sector 18', 'rohini sector 18', 'badli metro', 'samaypur badli'],
    coords: [28.7460, 77.1420],
    label: 'Samaypur Badli Metro Station / Sector 18 Rohini',
  },
  {
    keywords: ['rithala', 'rithala metro', 'red line'],
    coords: [28.7208, 77.1070],
    label: 'Rithala Metro Station, Red Line, Delhi',
  },
  {
    keywords: ['pitampura', 'nsp', 'netaji subhash place', 'kohat'],
    coords: [28.6980, 77.1480],
    label: 'Netaji Subhash Place (NSP), Pitampura, Delhi',
  },
  {
    keywords: ['north campus', 'delhi university', 'du', 'vishwavidyalaya', 'kamla nagar', 'hudson lane'],
    coords: [28.6890, 77.2100],
    label: 'Delhi University North Campus, Vishwavidyalaya',
  },
  {
    keywords: ['south campus', 'satya niketan', 'benito juarez'],
    coords: [28.5860, 77.1650],
    label: 'Delhi University South Campus, Satya Niketan',
  },
  {
    keywords: ['janakpuri', 'janakpuri east', 'janakpuri west'],
    coords: [28.6219, 77.0878],
    label: 'Janakpuri District Centre, West Delhi',
  },
  {
    keywords: ['dwarka', 'nsut', 'netaji subhas university of technology', 'sector 3 dwarka'],
    coords: [28.5921, 77.0460],
    label: 'NSUT Campus, Sector 3, Dwarka, New Delhi',
  },
  {
    keywords: ['connaught place', 'cp', 'rajiv chowk'],
    coords: [28.6315, 77.2167],
    label: 'Connaught Place (CP), Rajiv Chowk, New Delhi',
  },
];

export interface LandmarkItem {
  name: string;
  coords: [number, number]; // [lat, lng]
  description: string;
  city: string;
}

export const CITIES_LIST = [
  'Delhi / NCR',
  'Bengaluru',
  'Mumbai',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Jaipur',
  'Ahmedabad',
  'Chandigarh',
  'Lucknow',
  'Indore',
  'Dehradun',
  'Kochi',
];

export const CITY_DEFAULT_COORDS: Record<string, [number, number]> = {
  'Delhi / NCR': [28.7495, 77.1175],
  'Bengaluru': [12.9352, 77.6245],
  'Mumbai': [19.1254, 72.9160],
  'Pune': [18.5293, 73.8565],
  'Hyderabad': [17.4447, 78.3498],
  'Chennai': [13.0110, 80.2355],
  'Kolkata': [22.4988, 88.3713],
  'Jaipur': [26.9124, 75.7873],
  'Ahmedabad': [23.0225, 72.5714],
  'Chandigarh': [30.7333, 76.7794],
  'Lucknow': [26.8467, 80.9462],
  'Indore': [22.7196, 75.8577],
  'Dehradun': [30.3165, 78.0322],
  'Kochi': [9.9312, 76.2673],
};

export const CITY_FAMOUS_LANDMARKS: Record<string, LandmarkItem[]> = {
  'Delhi / NCR': [
    { name: 'DTU Gate 2 (Main Student Market)', coords: [28.7512, 77.1190], description: 'Near Sunrise PG, student eateries, stationery shops', city: 'Delhi / NCR' },
    { name: 'DTU Gate 1 (Bawana Road)', coords: [28.7520, 77.1180], description: 'Main arterial entry facing DTC bus stand', city: 'Delhi / NCR' },
    { name: 'Sector 17 Rohini Central Market', coords: [28.7420, 77.1260], description: 'Main commercial market & student PG hub', city: 'Delhi / NCR' },
    { name: 'Sector 16 Rohini DDA Flats', coords: [28.7360, 77.1240], description: 'Pocket B/C student rentals', city: 'Delhi / NCR' },
    { name: 'Samaypur Badli Metro Station (Yellow Line)', coords: [28.7460, 77.1420], description: 'Nearest Yellow Line metro hub to DTU', city: 'Delhi / NCR' },
    { name: 'Rithala Metro Station (Red Line Terminal)', coords: [28.7208, 77.1070], description: 'Major transit terminal in Rohini', city: 'Delhi / NCR' },
    { name: 'DU North Campus (Vishwavidyalaya)', coords: [28.6890, 77.2100], description: 'Kamla Nagar & Hudson Lane student colony', city: 'Delhi / NCR' },
    { name: 'NSUT Main Campus (Dwarka Sector 3)', coords: [28.5921, 77.0460], description: 'South West Delhi engineering campus', city: 'Delhi / NCR' },
    { name: 'Netaji Subhash Place (NSP) Pitampura', coords: [28.6980, 77.1480], description: 'Metro interchange, business & food hub', city: 'Delhi / NCR' },
    { name: 'Connaught Place (Rajiv Chowk)', coords: [28.6315, 77.2167], description: 'Central Delhi heritage & metro junction', city: 'Delhi / NCR' },
    { name: 'Noida Sector 62 (Electronic City)', coords: [28.6280, 77.3649], description: 'IT tech parks & engineering colleges hub', city: 'Delhi / NCR' },
    { name: 'Cyber Hub DLF Phase 3 (Gurugram)', coords: [28.4986, 77.0878], description: 'Corporate tech towers & modern apartments', city: 'Delhi / NCR' },
  ],
  'Bengaluru': [
    { name: 'Koramangala 5th Block (Sony World)', coords: [12.9352, 77.6245], description: 'Startup district, cafes & student rentals', city: 'Bengaluru' },
    { name: 'Indiranagar (100 Feet Road)', coords: [12.9784, 77.6408], description: 'Vibrant food hub & metro corridor', city: 'Bengaluru' },
    { name: 'HSR Layout Sector 1 (Agara Lake)', coords: [12.9121, 77.6446], description: 'Prime student and tech worker residence', city: 'Bengaluru' },
    { name: 'Electronic City Phase 1 (Infosys Gate)', coords: [12.8452, 77.6602], description: 'Major IT tech park & affordable housing', city: 'Bengaluru' },
    { name: 'Whitefield (ITPL Main Gate)', coords: [12.9863, 77.7383], description: 'Tech parks, metro line & modern apartments', city: 'Bengaluru' },
    { name: 'BTM Layout 2nd Stage (Udupi Garden)', coords: [12.9166, 77.6101], description: 'Student coaching & PG capital of South Bengaluru', city: 'Bengaluru' },
    { name: 'IISc Bangalore (Yeshwanthpur Gate)', coords: [13.0219, 77.5671], description: 'Premier research institute & Malleshwaram', city: 'Bengaluru' },
    { name: 'Marathahalli Junction (Outer Ring Road)', coords: [12.9592, 77.6974], description: 'Major transit connector to tech corridors', city: 'Bengaluru' },
    { name: 'MG Road Metro Station', coords: [12.9756, 77.6066], description: 'Central business district & metro interchange', city: 'Bengaluru' },
  ],
  'Mumbai': [
    { name: 'Powai (IIT Bombay Main Gate)', coords: [19.1254, 72.9160], description: 'IIT campus, Hiranandani gardens & startups', city: 'Mumbai' },
    { name: 'Bandra West (Hill Road / Linking Road)', coords: [19.0596, 72.8295], description: 'Cultural heart, colleges & sea-facing promenades', city: 'Mumbai' },
    { name: 'Andheri West (Lokhandwala Complex)', coords: [19.1416, 72.8277], description: 'Media hub, restaurants & active nightlife', city: 'Mumbai' },
    { name: 'Andheri East (Chakala Metro Station)', coords: [19.1114, 72.8617], description: 'MIDC commercial offices & metro corridor', city: 'Mumbai' },
    { name: 'Vile Parle West (NMIMS / Mithibai College)', coords: [19.1026, 72.8376], description: 'Top student campus hub & student hostels', city: 'Mumbai' },
    { name: 'Dadar TT Circle (Central Mumbai)', coords: [19.0178, 72.8478], description: 'Key central transit hub & colleges', city: 'Mumbai' },
    { name: 'Ghatkopar Metro Station', coords: [19.0860, 72.9090], description: 'Metro line 1 terminus & lively markets', city: 'Mumbai' },
    { name: 'Vashi Sector 17 (Navi Mumbai)', coords: [19.0748, 72.9978], description: 'Commercial heart of Navi Mumbai', city: 'Mumbai' },
  ],
  'Pune': [
    { name: 'Shivajinagar / COEP Tech University', coords: [18.5293, 73.8565], description: 'College of Engineering Pune & central transit', city: 'Pune' },
    { name: 'Viman Nagar (Symbiosis Campus)', coords: [18.5679, 73.9143], description: 'Premier student town, cafes & Phoenix Mall', city: 'Pune' },
    { name: 'Kothrud (MIT World Peace University)', coords: [18.5074, 73.8077], description: 'Major student college district & Paud Road', city: 'Pune' },
    { name: 'Hinjewadi Phase 1 (Rajiv Gandhi Infotech Park)', coords: [18.5913, 73.7389], description: 'IT mega-hub & modern gated communities', city: 'Pune' },
    { name: 'Baner High Street', coords: [18.5590, 73.7868], description: 'Cosmopolitan food street & student residences', city: 'Pune' },
    { name: 'FC Road (Fergusson College Road)', coords: [18.5236, 73.8415], description: 'Historic college avenue & lively youth market', city: 'Pune' },
    { name: 'Koregaon Park (North Main Road)', coords: [18.5362, 73.8940], description: 'Green leafy avenues, cafes & creative studios', city: 'Pune' },
    { name: 'Wakad (Choudhary Park)', coords: [18.5987, 73.7634], description: 'Convenient rental hub for students and techies', city: 'Pune' },
  ],
  'Hyderabad': [
    { name: 'Gachibowli (IIIT Hyderabad / Stadium)', coords: [17.4447, 78.3498], description: 'IIIT campus, University of Hyderabad & stadiums', city: 'Hyderabad' },
    { name: 'HITEC City (Cyber Towers)', coords: [17.4504, 78.3808], description: 'Heart of Hyderabad tech industry & student PGs', city: 'Hyderabad' },
    { name: 'Madhapur (Durgam Cheruvu Metro)', coords: [17.4399, 78.3908], description: 'Food streets, metro connectivity & student flats', city: 'Hyderabad' },
    { name: 'Kondapur (Botanical Garden Road)', coords: [17.4646, 78.3582], description: 'Fast-growing rental corridor near tech parks', city: 'Hyderabad' },
    { name: 'Ameerpet Metro Station', coords: [17.4375, 78.4482], description: 'Education & software training institute capital', city: 'Hyderabad' },
    { name: 'Osmania University Campus', coords: [17.4138, 78.5286], description: 'Historic university campus in Eastern Hyderabad', city: 'Hyderabad' },
    { name: 'Kukatpally (JNTU Campus)', coords: [17.4986, 78.3908], description: 'Jawaharlal Nehru Tech University hub', city: 'Hyderabad' },
    { name: 'Financial District (Nanakramguda)', coords: [17.4156, 78.3425], description: 'Global tech companies & modern towers', city: 'Hyderabad' },
  ],
  'Chennai': [
    { name: 'Guindy (Anna University Main Gate)', coords: [13.0110, 80.2355], description: 'Anna University, Raj Bhavan & metro station', city: 'Chennai' },
    { name: 'Adyar (IIT Madras Main Gate)', coords: [12.9915, 80.2337], description: 'IIT Madras campus, green avenues & cafes', city: 'Chennai' },
    { name: 'OMR Thoraipakkam (Tidel Park)', coords: [12.9698, 80.2452], description: 'IT Expressway, student residences & colleges', city: 'Chennai' },
    { name: 'Nungambakkam (Loyola College)', coords: [13.0626, 80.2341], description: 'Central education zone, libraries & cafes', city: 'Chennai' },
    { name: 'T. Nagar (Panagal Park)', coords: [13.0418, 80.2341], description: 'Commercial heart & transit connectivity', city: 'Chennai' },
    { name: 'Velachery (Phoenix Marketcity)', coords: [12.9754, 80.2207], description: 'Well-connected southern residential & student hub', city: 'Chennai' },
    { name: 'Porur Junction (SRMC Campus)', coords: [13.0382, 80.1565], description: 'Sri Ramachandra Medical College & IT parks', city: 'Chennai' },
  ],
  'Kolkata': [
    { name: 'Jadavpur University Campus', coords: [22.4988, 88.3713], description: 'Premier university campus & 8B bus stand hub', city: 'Kolkata' },
    { name: 'Salt Lake Sector 5 (Webel / RDB)', coords: [22.5804, 88.4378], description: 'IT district, student colleges & metro line', city: 'Kolkata' },
    { name: 'New Town (Eco Space / Amity)', coords: [22.5867, 88.4816], description: 'Amity, St. Xaviers University & IT parks', city: 'Kolkata' },
    { name: 'College Street (Calcutta University)', coords: [22.5744, 88.3639], description: 'Historic academic heart & Presidency University', city: 'Kolkata' },
    { name: 'Park Street Metro Station', coords: [22.5535, 88.3516], description: 'Central cultural & food avenue', city: 'Kolkata' },
  ],
};

// Default export for backward compatibility
export const FAMOUS_CAMPUS_LANDMARKS = CITY_FAMOUS_LANDMARKS['Delhi / NCR'];


export async function geocodeAddress(query: string): Promise<{ coords: [number, number]; label: string } | null> {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return null;

  // 1. Instant local dictionary match
  for (const loc of KNOWN_CAMPUS_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (clean.includes(kw) || kw.includes(clean)) {
        return { coords: loc.coords, label: loc.label };
      }
    }
  }

  // Check all city famous landmarks
  for (const cityList of Object.values(CITY_FAMOUS_LANDMARKS)) {
    for (const lm of cityList) {
      const lmClean = lm.name.toLowerCase();
      if (clean.includes(lmClean) || lmClean.includes(clean)) {
        return { coords: lm.coords, label: `${lm.name}, ${lm.city}` };
      }
    }
  }

  // 2. Call backend proxy endpoint with server-side User-Agent
  try {
    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.coords && Array.isArray(data.coords) && data.coords.length >= 2) {
        const numLat = Number(data.coords[0]);
        const numLng = Number(data.coords[1]);
        if (isFinite(numLat) && isFinite(numLng) && !isNaN(numLat) && !isNaN(numLng)) {
          return {
            coords: [numLat, numLng],
            label: data.label || query,
          };
        }
      }
    }
  } catch {
    // Continue to direct fallbacks
  }

  // 3. Photon Komoot geocoding API fallback (CORS friendly)
  try {
    const photonEndpoint = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(photonEndpoint);
    if (res.ok) {
      const pData = await res.json();
      if (pData && pData.features && pData.features.length > 0) {
        const feat = pData.features[0];
        const [lon, lat] = feat.geometry?.coordinates || [];
        const numLat = Number(lat);
        const numLon = Number(lon);
        if (isFinite(numLat) && isFinite(numLon) && !isNaN(numLat) && !isNaN(numLon)) {
          const props = feat.properties || {};
          const labelParts = [props.name, props.city, props.state, props.country].filter(Boolean);
          return {
            coords: [numLat, numLon],
            label: labelParts.join(', ') || query,
          };
        }
      }
    }
  } catch {
    // Continue
  }

  // 4. OpenStreetMap Nominatim geocoding API fallback
  try {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            coords: [lat, lon],
            label: item.display_name?.split(',').slice(0, 3).join(', ') || query,
          };
        }
      }
    }
  } catch {
    // If offline or network error, return null
  }

  return null;
}

// Calculate approximate distance in km using haversine formula
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Reverse Geocoding: Converts [lat, lng] to human readable address anywhere globally
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  // 1. Check if near any known campus location (< 350 meters)
  for (const loc of KNOWN_CAMPUS_LOCATIONS) {
    const dist = getDistanceKm(lat, lng, loc.coords[0], loc.coords[1]);
    if (dist < 0.35) {
      return loc.label;
    }
  }

  // 2. Call local backend proxy (runs on server with compliant User-Agent)
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        return data.address;
      }
    }
  } catch {
    // Continue to browser-based fallbacks
  }

  // 3. Direct Photon Komoot reverse geocoding (CORS-enabled, open global OSM data)
  try {
    const photonEndpoint = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const res = await fetch(photonEndpoint);
    if (res.ok) {
      const pData = await res.json();
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
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    }
  } catch {
    // ignore
  }

  // 4. Direct OpenStreetMap Nominatim reverse geocoding
  try {
    const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`;
    const res = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',').map((s: string) => s.trim());
        return parts.slice(0, 4).join(', ');
      }
    }
  } catch {
    // ignore
  }

  // 5. Offline fallback: Check distance to known campuses or regional bounding boxes
  let nearest = KNOWN_CAMPUS_LOCATIONS[0];
  let minD = 99999;
  for (const loc of KNOWN_CAMPUS_LOCATIONS) {
    const d = getDistanceKm(lat, lng, loc.coords[0], loc.coords[1]);
    if (d < minD) {
      minD = d;
      nearest = loc;
    }
  }

  if (minD < 3.0) {
    return `${minD.toFixed(1)} km from ${nearest.label}`;
  }

  // Regional detection without false assumptions
  if (lat >= 5.8 && lat <= 9.9 && lng >= 79.5 && lng <= 82.0) {
    return `Location near [${lat.toFixed(4)}, ${lng.toFixed(4)}], Sri Lanka`;
  }
  if (lat >= 8.0 && lat <= 37.0 && lng >= 68.0 && lng <= 97.5) {
    return `Location near [${lat.toFixed(4)}, ${lng.toFixed(4)}], India`;
  }

  return `Pinned Location [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
}

export const POPULAR_CAMPUS_AREAS = [
  { name: 'DTU Main Campus', query: 'Delhi Technological University', coords: [28.7495, 77.1175] as [number, number] },
  { name: 'DTU Gate 2 / Market', query: 'DTU Gate 2', coords: [28.7512, 77.1190] as [number, number] },
  { name: 'Sector 17 Rohini', query: 'Rohini Sector 17', coords: [28.7420, 77.1260] as [number, number] },
  { name: 'Sector 16 Rohini', query: 'Rohini Sector 16', coords: [28.7360, 77.1240] as [number, number] },
  { name: 'Samaypur Badli', query: 'Samaypur Badli', coords: [28.7460, 77.1420] as [number, number] },
  { name: 'Rithala Metro', query: 'Rithala Metro', coords: [28.7208, 77.1070] as [number, number] },
  { name: 'DU North Campus', query: 'DU North Campus', coords: [28.6890, 77.2100] as [number, number] },
  { name: 'NSUT Dwarka', query: 'NSUT Dwarka', coords: [28.5921, 77.0460] as [number, number] },
];
