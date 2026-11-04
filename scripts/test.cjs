// Run the TypeScript node:test suites without a bundler or database credentials.
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
if (process.argv.includes("--health")) require("../src/lib/project-health.test.ts");
else {
  require("../src/lib/project-health.test.ts");
  require("../tests/security.test.cjs");
}
