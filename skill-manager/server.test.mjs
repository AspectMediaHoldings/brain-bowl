import test from 'node:test';
import assert from 'node:assert';
import http from 'http';

const originalFetch = global.fetch;

async function makeRequest(query) {
  return new Promise((resolve) => {
    const reqData = JSON.stringify({ query });
    const req = http.request('http://127.0.0.1:3333/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    req.on('response', async (res) => {
      let data = '';
      for await (const chunk of res) {
        data += chunk;
      }
      resolve(JSON.parse(data));
    });
    req.write(reqData);
    req.end();
  });
}

test('getRecommendation error paths', async (t) => {
  process.env.ANTHROPIC_API_KEY = 'test_key';

  // Start server
  await import('./server.mjs');
  await new Promise(resolve => setTimeout(resolve, 500));

  await t.test('handles network errors from fetch', async () => {
    global.fetch = async () => {
      throw new Error('Connection refused');
    };

    const result = await makeRequest('test network error');
    assert.strictEqual(result.error, 'Could not reach Claude API: Connection refused');
  });

  await t.test('handles HTTP errors (non-200)', async () => {
    global.fetch = async () => {
      return {
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      };
    };

    const result = await makeRequest('test http error');
    assert.strictEqual(result.error, 'Anthropic API error 500: Internal Server Error');
  });

  await t.test('handles HTTP errors when text() fails', async () => {
    global.fetch = async () => {
      return {
        ok: false,
        status: 401,
        text: async () => { throw new Error('Cannot read text'); }
      };
    };

    const result = await makeRequest('test http error text failure');
    assert.strictEqual(result.error, 'Anthropic API error 401: ');
  });

  await t.test('handles invalid JSON returned by Claude', async () => {
    global.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          content: [{ text: 'This is not valid JSON' }]
        })
      };
    };

    const result = await makeRequest('test invalid json');
    assert.strictEqual(result.error, 'Claude returned invalid JSON. Try rephrasing your query.');
  });

  await t.test('handles empty response from Claude', async () => {
    global.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          content: []
        })
      };
    };

    const result = await makeRequest('test empty text');
    assert.strictEqual(result.error, 'Claude returned invalid JSON. Try rephrasing your query.');
  });

  await t.test('handles successful response', async () => {
    global.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          content: [{ text: JSON.stringify([{ rank: 1, name: 'skill', reason: 'reason', invoke: '/skill' }]) }]
        })
      };
    };

    const result = await makeRequest('test success');
    assert.deepStrictEqual(result.results, [{ rank: 1, name: 'skill', reason: 'reason', invoke: '/skill' }]);
  });

  // Cleanup
  global.fetch = originalFetch;
  setTimeout(() => process.exit(0), 100);
});
