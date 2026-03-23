async function testLoginSecure() {
  const email = "testuser74297@gmail.com";
  const password = "password123!";

  try {
    const csrfRes = await fetch('http://192.168.0.210:3000/api/auth/csrf');
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    let cookies = csrfRes.headers.get('set-cookie') || '';
    const cookieArray = csrfRes.headers.getSetCookie ? csrfRes.headers.getSetCookie() : cookies.split(',');
    const csrfCookieLine = cookieArray.find(c => c.includes('csrf-token'));
    const csrfCookie = csrfCookieLine ? csrfCookieLine.split(';')[0] : '';

    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('csrfToken', csrfToken);
    formData.append('redirect', 'false');
    formData.append('json', 'true');

    const lRes = await fetch('http://192.168.0.210:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookie,
      },
      body: formData.toString(),
      redirect: 'manual'
    });
    
    console.log('Login Status:', lRes.status);
    const text = await lRes.text();
    console.log('Login Body:', text.substring(0, 100));
    
    const setCookies = lRes.headers.getSetCookie ? lRes.headers.getSetCookie() : lRes.headers.get('set-cookie');
    console.log('Final Cookies:', setCookies);
  } catch(e) { 
    console.log('Err:', e.message); 
  }
}
testLoginSecure();
