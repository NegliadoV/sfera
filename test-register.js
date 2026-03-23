async function testRegistration() {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const userTag = `user_${randomSuffix}`;
  const email = `testuser${randomSuffix}@gmail.com`;
  const name = "Test Tester";
  const password = "password123!";

  console.log('Testing Registration for:', email, userTag);

  try {
    const res = await fetch('http://192.168.0.210:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, userTag, password })
    });
    const data = await res.json();
    console.log('Register Response:', res.status, data);
    
    // Now test login callback
    const lRes = await fetch('http://192.168.0.210:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, redirect: false })
    });
    const lData = await lRes.json();
    console.log('Login Response:', lRes.status, await lData);
    
    const setCookie = lRes.headers.get('set-cookie');
    console.log('Cookies received:', setCookie ? 'YES' : 'NO');
    if (setCookie) {
        console.log(setCookie);
    }
  } catch (e) {
    console.log('Network Error:', e.message);
  }
}

testRegistration();
