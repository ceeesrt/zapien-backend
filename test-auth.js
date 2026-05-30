import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json'
  }
});

async function test() {
  try {
    const res = await instance.post('/api/auth/login', {
      email: 'test1779512260@example.com',
      password: 'Password123'
    });

    console.log('Auth Response:');
    console.log(JSON.stringify(res.data, null, 2));

  } catch (error) {
    console.error('ERROR:', error.response?.data || error.message);
  }
}

test();
