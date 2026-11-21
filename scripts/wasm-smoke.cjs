'use strict';
const assert = require('node:assert/strict');
const wasm = require('../artifacts/wasm-node/foreverbots_wasm.js');
const identity = JSON.parse(wasm.engine_info_json());
assert.equal(identity.engine, 'forever-engine');
assert.equal(identity.package_version, '0.1.0');
assert.equal(identity.client_build, '1.60.1.70425');
function rejects(input, pattern) {
  let rejected = false;
  try {
    wasm.simulate_prepared_json(input);
  } catch (error) {
    rejected = true;
    if (pattern) assert.match(String(error), pattern);
  }
  assert.equal(rejected, true, 'Expected WASM input rejection');
}
rejects('{');
rejects('{}', /invalid_iterations/);
rejects(JSON.stringify({ sim: { iterations: 0 } }), /iteration_limit/);
rejects(JSON.stringify({ sim: { iterations: 10001 } }), /iteration_limit/);
rejects(JSON.stringify({ sim: { iterations: 1.5 } }), /invalid_iterations/);
rejects(JSON.stringify({ sim: { iterations: 1 } }));
rejects('x'.repeat(2097153), /input_too_large/);
console.log('WASM initialized; identity and seven rejection smoke checks passed. No fight simulation or browser parity was tested.');
