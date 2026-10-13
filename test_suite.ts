import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(suite: string, test: string, passed: boolean, details?: string) {
  results.push({ suite, test, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${suite}] ${test} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log('=== STARTING HARDCORE TEST SUITE ===\n');

  let studentToken = '';
  let ownerToken = '';
  let messToken = '';
  let adminToken = '';

  // 1. AUTHENTICATION & ROLE ACCESS
  try {
    const studentRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@college.edu', password: 'password123' }),
    });
    const sData = await studentRes.json() as any;
    studentToken = sData.token;
    record('Auth', 'Student Login', studentRes.status === 200 && sData.user?.role === 'student');
  } catch (e: any) {
    record('Auth', 'Student Login', false, e.message);
  }

  try {
    const ownerRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vikram@staynest.com', password: 'password123' }),
    });
    const oData = await ownerRes.json() as any;
    ownerToken = oData.token;
    record('Auth', 'Owner Login', ownerRes.status === 200 && oData.user?.role === 'owner');
  } catch (e: any) {
    record('Auth', 'Owner Login', false, e.message);
  }

  try {
    const messRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'annapurna@staynest.com', password: 'password123' }),
    });
    const mData = await messRes.json() as any;
    messToken = mData.token;
    record('Auth', 'Mess Provider Login', messRes.status === 200 && mData.user?.role === 'mess_provider');
  } catch (e: any) {
    record('Auth', 'Mess Provider Login', false, e.message);
  }

  try {
    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@staynest.com', password: 'password123' }),
    });
    const aData = await adminRes.json() as any;
    adminToken = aData.token;
    record('Auth', 'Admin Login', adminRes.status === 200 && aData.user?.role === 'admin');
  } catch (e: any) {
    record('Auth', 'Admin Login', false, e.message);
  }

  // Invalid login validation
  try {
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake@email.com', password: 'wrongpassword' }),
    });
    record('Auth', 'Reject Invalid Credentials', badLoginRes.status === 401 || badLoginRes.status === 400);
  } catch (e: any) {
    record('Auth', 'Reject Invalid Credentials', false, e.message);
  }

  // 2. PROPERTIES API & FILTERING
  try {
    const propsRes = await fetch(`${BASE_URL}/api/properties?lat=28.7495&lng=77.1175&radiusKm=10`);
    const props = await propsRes.json() as any;
    record('Properties', 'Fetch properties in 10km radius', propsRes.status === 200 && Array.isArray(props) && props.length > 0, `found ${props.length}`);
  } catch (e: any) {
    record('Properties', 'Fetch properties in 10km radius', false, e.message);
  }

  try {
    const filterRes = await fetch(`${BASE_URL}/api/properties?propertyType=single_room&minRent=5000&maxRent=10000`);
    const filtered = await filterRes.json() as any;
    const allMatch = filtered.every((p: any) => p.propertyType === 'single_room' && p.rentPerMonth >= 5000 && p.rentPerMonth <= 10000);
    record('Properties', 'Filter by type and rent boundary', filterRes.status === 200 && allMatch, `${filtered.length} matches`);
  } catch (e: any) {
    record('Properties', 'Filter by type and rent boundary', false, e.message);
  }

  // 3. MESS DIRECTORY & VOTES
  try {
    const messListRes = await fetch(`${BASE_URL}/api/mess`);
    const messList = await messListRes.json() as any;
    record('Mess', 'Fetch Mess Listings', messListRes.status === 200 && Array.isArray(messList) && messList.length > 0, `${messList.length} providers`);
  } catch (e: any) {
    record('Mess', 'Fetch Mess Listings', false, e.message);
  }

  try {
    const voteRes = await fetch(`${BASE_URL}/api/mess/mess_1/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ vote: 'delicious' }),
    });
    record('Mess', 'Cast student daily meal vote', voteRes.status === 200);
  } catch (e: any) {
    record('Mess', 'Cast student daily meal vote', false, e.message);
  }

  // 4. BOOKING FLOW & PERMISSIONS
  let createdBookingId = '';
  try {
    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        propertyId: 'prop_1',
        moveInDate: '2026-11-01',
        durationMonths: 6,
        headcount: 1,
        message: 'Hardcore testing booking flow request',
      }),
    });
    const bData = await bookRes.json() as any;
    createdBookingId = bData.id;
    record('Bookings', 'Student creates booking request', bookRes.status === 201 || bookRes.status === 200);
  } catch (e: any) {
    record('Bookings', 'Student creates booking request', false, e.message);
  }

  // Unauthorized role cannot create booking (e.g. Owner account trying to book)
  try {
    const ownerBookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        propertyId: 'prop_1',
        moveInDate: '2026-11-01',
        durationMonths: 3,
        headcount: 1,
      }),
    });
    record('Bookings', 'Guard: Owner cannot book as student', ownerBookRes.status === 403 || ownerBookRes.status === 400);
  } catch (e: any) {
    record('Bookings', 'Guard: Owner cannot book as student', false, e.message);
  }

  // Owner responds to booking
  if (createdBookingId) {
    try {
      const acceptRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      record('Bookings', 'Owner accepts student booking', acceptRes.status === 200);
    } catch (e: any) {
      record('Bookings', 'Owner accepts student booking', false, e.message);
    }
  }

  // 5. LIVING SUITE: MAINTENANCE TICKETS
  try {
    const maintPost = await fetch(`${BASE_URL}/api/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        propertyId: 'prop_1',
        category: 'wifi',
        title: 'Router packet loss in study corner',
        description: 'WiFi dropping during late night lectures',
        urgency: 'high',
      }),
    });
    const ticketData = await maintPost.json() as any;
    record('Maintenance', 'Create maintenance ticket', maintPost.status === 201 || maintPost.status === 200);

    if (ticketData.id) {
      const maintGet = await fetch(`${BASE_URL}/api/maintenance?propertyId=prop_1`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const tickets = await maintGet.json() as any;
      record('Maintenance', 'Fetch property maintenance tickets', maintGet.status === 200 && Array.isArray(tickets) && tickets.some((t: any) => t.id === ticketData.id));
    }
  } catch (e: any) {
    record('Maintenance', 'Maintenance ticket flow', false, e.message);
  }

  // 6. LIVING SUITE: EXPENSE SPLITTER
  try {
    const expPost = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        propertyId: 'prop_1',
        title: 'Broadband Fiber Bill',
        totalAmount: 1200,
        paidByUserId: 'usr_student_1',
        splitWith: ['usr_student_2'],
      }),
    });
    record('Expenses', 'Create split expense with dynamic UPI ledger', expPost.status === 201 || expPost.status === 200);
  } catch (e: any) {
    record('Expenses', 'Create split expense', false, e.message);
  }

  // 7. GEOCODING ENDPOINTS
  try {
    const geoSearch = await fetch(`${BASE_URL}/api/geocode/search?q=Bengaluru`);
    const geoData = await geoSearch.json() as any;
    record('Geocoding', 'Search city coordinates (Bengaluru)', geoSearch.status === 200 && Array.isArray(geoData.coords));
  } catch (e: any) {
    record('Geocoding', 'Search city coordinates', false, e.message);
  }

  try {
    const revGeo = await fetch(`${BASE_URL}/api/geocode/reverse?lat=18.5204&lng=73.8567`);
    const revData = await revGeo.json() as any;
    record('Geocoding', 'Reverse geocode coordinates (Pune)', revGeo.status === 200 && Boolean(revData.address));
  } catch (e: any) {
    record('Geocoding', 'Reverse geocode coordinates', false, e.message);
  }

  // 8. ADMIN VERIFICATIONS & REPORTS
  try {
    const adminVRes = await fetch(`${BASE_URL}/api/admin/verifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const vList = await adminVRes.json() as any;
    record('Admin', 'Fetch Owner Verification Queue', adminVRes.status === 200 && Array.isArray(vList));
  } catch (e: any) {
    record('Admin', 'Fetch Owner Verification Queue', false, e.message);
  }

  // Non-admin blocked from admin endpoints
  try {
    const blockedRes = await fetch(`${BASE_URL}/api/admin/verifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    record('Admin', 'Guard: Student forbidden from admin routes', blockedRes.status === 403);
  } catch (e: any) {
    record('Admin', 'Guard: Student forbidden from admin routes', false, e.message);
  }

  // 9. CHAT THREADS
  try {
    const chatThreads = await fetch(`${BASE_URL}/api/chat/threads`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    record('Chat', 'Fetch user chat threads', chatThreads.status === 200 && Array.isArray(await chatThreads.json()));
  } catch (e: any) {
    record('Chat', 'Fetch user chat threads', false, e.message);
  }

  console.log('\n=== TEST SUITE SUMMARY ===');
  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
}

runTests();
