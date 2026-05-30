import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5001'
});

async function test() {
  try {
    // Login
    const loginRes = await instance.post('/api/auth/login', {
      email: 'test1779512260@example.com',
      password: 'Password123'
    });

    const token = loginRes.data.data.accessToken;
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Get OpenAI config
    const botId = '6a14bc19b9b34ac019fc8563';
    const wsId = '6a11ef44397e905f49156779';

    const res = await instance.get(`/api/workspaces/${wsId}/chatbots/${botId}/openai-config`);

    console.log('\n✅ Backend OpenAI Config Response:\n');
    console.log(JSON.stringify(res.data.data, null, 2));

  } catch (error) {
    console.error('ERROR:', error.response?.data || error.message);
  }
}

test();
