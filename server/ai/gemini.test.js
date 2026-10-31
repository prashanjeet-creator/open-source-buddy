import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { config } from '../config.js';
import { GeminiProvider } from './gemini.js';

const provider = new GeminiProvider();
const issue = {
  title: 'Fix the issue',
  body: 'The application crashes.',
  labels: ['bug'],
  repo: 'sample-org/sample-repo',
  language: 'JavaScript',
  topics: ['web'],
};

let originalApiKey;
let originalFetch;

beforeEach(() => {
  originalApiKey = config.geminiApiKey;
  originalFetch = globalThis.fetch;
  config.geminiApiKey = 'test-key';
});

afterEach(() => {
  config.geminiApiKey = originalApiKey;
  globalThis.fetch = originalFetch;
});

test('returns the mock-compatible explanation shape using server-side credentials', async () => {
  globalThis.fetch = async (url, options) => {
    assert.match(url, /generativelanguage\.googleapis\.com/);
    assert.equal(url.includes('test-key'), false);
    assert.equal(options.headers['x-goog-api-key'], 'test-key');
    const request = JSON.parse(options.body);
    assert.match(request.contents[0].parts[0].text, /Fix the issue/);
    assert.match(request.contents[0].parts[0].text, /Repository notes/);

    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ markdown: '# Explanation', plan: ['Inspect the code'] }) }],
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const result = await provider.explain(issue, { context: 'Repository notes' });

  assert.deepEqual(result, {
    issueTitle: 'Fix the issue',
    markdown: '# Explanation',
    plan: ['Inspect the code'],
  });
});

test('reports missing Gemini configuration clearly', async () => {
  config.geminiApiKey = '';
  globalThis.fetch = async () => {
    throw new Error('fetch should not be called without a key');
  };

  await assert.rejects(provider.explain(issue), {
    code: 'AI_CONFIGURATION_ERROR',
    status: 503,
    message: /GEMINI_API_KEY/,
  });
});

test('reports upstream failures with a useful message', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  await assert.rejects(provider.explain(issue), {
    status: 502,
    message: /Gemini request failed \(HTTP 400\): Invalid API key/,
  });
});

test('rejects responses that do not match the explanation contract', async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ markdown: '', plan: [] }) }] } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  await assert.rejects(provider.explain(issue), {
    status: 502,
    message: /incomplete explanation/,
  });
});

test('reports malformed successful API responses clearly', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify(null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  await assert.rejects(provider.explain(issue), {
    status: 502,
    message: /did not return an explanation/,
  });
});
