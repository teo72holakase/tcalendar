const test = require('node:test');
const assert = require('node:assert/strict');
const cors = require('cors');
const express = require('express');
const { once } = require('node:events');
const createCorsConfig = require('../src/config/cors');

test('preflight permits the production frontend and normalizes CLIENT_URL', async (t) => {
  const { allowedOrigins, corsOptions } = createCorsConfig('https://other.example/app/');
  assert.ok(allowedOrigins.has('https://other.example'));

  const app = express();
  app.options('*', cors(corsOptions));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/auth/login`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://tcalendar.devs.surf',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type'
    }
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://tcalendar.devs.surf');
  assert.match(response.headers.get('access-control-allow-methods'), /POST/);
  assert.match(response.headers.get('access-control-allow-headers'), /Content-Type/i);
});

test('preflight rejects unlisted origins', () => {
  const { corsOptions } = createCorsConfig();
  let actualError;

  corsOptions.origin('https://unlisted.example', (error) => {
    actualError = error;
  });

  assert.equal(actualError?.message, 'CORS no permitido');
});
