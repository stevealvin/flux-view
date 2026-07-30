import { app } from '../src/index.js';

async function runTests() {
  console.log('--- Testing health check ---');
  let res = await app.request('/api');
  console.log('GET /api Status:', res.status);
  console.log('GET /api Body:', await res.text());

  console.log('\n--- Testing GET /api/rules ---');
  res = await app.request('/api/rules');
  console.log('GET /api/rules Status:', res.status);
  const rulesData = await res.json() as any;
  console.log('GET /api/rules Count:', rulesData.total);
  console.log('GET /api/rules first rule:', rulesData.data?.[0]?.name);

  console.log('\n--- Testing GET /api/rules/:id ---');
  if (rulesData.data?.length > 0) {
    const firstId = rulesData.data[0].id;
    res = await app.request(`/api/rules/${firstId}`);
    console.log(`GET /api/rules/${firstId} Status:`, res.status);
    console.log(`GET /api/rules/${firstId} Name:`, (await res.json() as any).name);
  }

  console.log('\n--- Testing POST /api/rules/run (Sandbox) ---');
  res = await app.request('/api/rules/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: `
        import axios from 'axios';
        export default async function() {
          return 'Sandbox run successful! Axios is available: ' + (typeof axios === 'function');
        }
      `
    })
  });
  console.log('POST /api/rules/run Status:', res.status);
  console.log('POST /api/rules/run Result:', await res.json());

  console.log('\n--- Testing POST /api/rules/run with context and arrow function ---');
  res = await app.request('/api/rules/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context: {
        val: 'TEST_CONTEXT_VALUE'
      },
      code: `
        async (ctx) => {
          return 'Context received: ' + ctx.val;
        }
      `
    })
  });
  console.log('POST /api/rules/run (context) Status:', res.status);
  console.log('POST /api/rules/run (context) Result:', await res.json());

  console.log('\n--- Testing POST /api/rules/run with user-reported ESM import wrapping ---');
  res = await app.request('/api/rules/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: `
        import axios from 'axios'
        import cheerio from 'cheerio'

        (async () => {
          return 'Success: axios is ' + (typeof axios === 'function') + ' and cheerio is ' + (typeof cheerio === 'object');
        })
      `
    })
  });
  console.log('POST /api/rules/run (ESM import wrapping) Status:', res.status);
  console.log('POST /api/rules/run (ESM import wrapping) Result:', await res.json());
}

runTests().catch(console.error);
