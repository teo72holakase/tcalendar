const test = require('node:test');
const assert = require('node:assert/strict');
const { validUrl } = require('../src/controllers/groupContentController');

test('los recursos aceptan solo enlaces web sin credenciales embebidas', () => {
  assert.equal(validUrl('https://drive.google.com/file/d/abc'), true);
  assert.equal(validUrl('http://files.example.org/doc.pdf'), true);
  assert.equal(validUrl('javascript:alert(1)'), false);
  assert.equal(validUrl('https://user:pass@example.org/file'), false);
  assert.equal(validUrl('not a url'), false);
});
