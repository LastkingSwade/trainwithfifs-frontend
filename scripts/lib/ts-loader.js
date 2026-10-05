/**
 * Minimal TypeScript loader for the offline test suites.
 * - Transpiles .ts files on require() with the project's installed TypeScript.
 * - Resolves the "@/..." path alias to ./src (mirrors tsconfig.json "paths").
 * - Replaces global fetch so no test can reach a real network service.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const SRC_DIR = path.resolve(__dirname, '../../src');

if (!Module.__fifsTsLoaderInstalled) {
  Module.__fifsTsLoaderInstalled = true;

  const originalResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, ...rest) {
    if (typeof request === 'string' && request.startsWith('@/')) {
      request = path.join(SRC_DIR, request.slice(2));
    }
    return originalResolve.call(this, request, parent, ...rest);
  };

  Module._extensions['.ts'] = function (module, filename) {
    const source = fs.readFileSync(filename, 'utf-8');
    const output = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true
      }
    }).outputText;
    module._compile(output, filename);
  };
}

/** Records every outbound fetch and answers locally; nothing leaves the machine. */
function installFetchStub() {
  const calls = [];
  global.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      status: 200,
      statusText: 'OK (stubbed)',
      json: async () => ({ id: 'stubbed' }),
      text: async () => ''
    };
  };
  return calls;
}

module.exports = { installFetchStub, SRC_DIR };
