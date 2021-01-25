const child_process = require('child_process');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Generate the WebAssembly module
child_process.execFileSync('go', [
  'build',
  '-o', path.join(__dirname, '..', 'npm', 'esbuild-wasm', 'esbuild.wasm'),
  path.join(__dirname, '..', 'cmd', 'esbuild'),
], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env, GOOS: 'js', GOARCH: 'wasm' },
});

// Copy the JavaScript companion code for the WebAssembly module
const GOROOT = child_process.execFileSync('go', ['env', 'GOROOT']).toString().trim();
fs.copyFileSync(
  path.join(GOROOT, 'misc', 'wasm', 'wasm_exec.js'),
  path.join(__dirname, '..', 'npm', 'esbuild-wasm', 'wasm_exec.js'),
);

// Generate the JavaScript API code for the WebAssembly module
child_process.execFileSync('node', [
  path.join(__dirname, 'esbuild.js'),
  path.join(__dirname, '..', process.platform === 'win32' ? 'esbuild.exe' : 'esbuild'),
  '--wasm',
], {
  stdio: 'inherit',
  cwd: __dirname,
});

// Bundle something that will fail on Windows if Windows paths aren't handled correctly
const outfile = path.join(__dirname, '.wasm-tests-out.js');
const packageJSON = path.join('..', 'npm', 'esbuild-wasm', 'package.json');
child_process.execFileSync('node', [
  path.join(__dirname, '..', 'npm', 'esbuild-wasm', 'bin', 'esbuild'),
  '--bundle',
  '--platform=node',
  '--outfile=' + outfile,
], {
  stdio: ['pipe', 'inherit', 'inherit'],
  cwd: __dirname,
  input: `
    export {default} from ${JSON.stringify(packageJSON)}
  `,
});

// Check that the bundle is valid
const result = require(outfile);
assert.deepStrictEqual(result.default, require(packageJSON));
fs.unlinkSync(outfile);
console.log(`✅ wasm node tests passed`)
