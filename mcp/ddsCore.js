// ddsCore.js �?loads the same double-dummy engine (public/out.js + public/dds.js)
// that the web app uses, but inside Node, so MCP clients can call it.
//
// The bundle was compiled for the browser (gui runtime) but inlines the wasm, so
// it runs fine under Node's `vm` with a dds-wrapper attached.

import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const OUT_JS = path.join(PUBLIC_DIR, "out.js");
const DDS_JS = path.join(PUBLIC_DIR, "dds.js");

let cachedHandle = null;

function loadEngine() {
  if (cachedHandle) return cachedHandle;

  if (!fs.existsSync(OUT_JS) || !fs.existsSync(DDS_JS)) {
    throw new Error(
      `DDS bundle not found in ${PUBLIC_DIR}. ` +
      `Expected out.js and dds.js (the same files the web app serves).`
    );
  }

  const outJs = fs.readFileSync(OUT_JS, "utf8");
  const ddsJs = fs.readFileSync(DDS_JS, "utf8");

  const requireNode = createRequire(import.meta.url);
  const quietConsole = {
    log: (...a) => process.stderr.write(a.join(" ") + "\n"),
    error: (...a) => process.stderr.write(a.join(" ") + "\n"),
    warn: (...a) => process.stderr.write(a.join(" ") + "\n"),
    info: (...a) => process.stderr.write(a.join(" ") + "\n"),
    // dds.js uses console.time/timeEnd during solve; that would pollute the
    // MCP stdio channel (stdout must carry JSON-RPC frames only).
    time: (_label) => {},
    timeEnd: (_label) => {},
  };
  const sandbox = {
    // Emscripten copies every runtime export onto this object.
    Module: { onRuntimeInitialized: () => {} },
    console: quietConsole,
    setTimeout,
    clearTimeout,
    performance,
    process: {
      stdout: { write: (s) => process.stdout.write(s) },
      stderr: { write: (s) => process.stderr.write(s) },
      argv: ["node"],
      on: () => {},
    },
    module: { exports: {} },
    exports: {},
    window: {},
    WebAssembly,
    Uint8Array,
    TextDecoder,
    require: requireNode,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  vm.runInContext(outJs, sandbox, { filename: "out.js" });
  vm.runInContext(ddsJs, sandbox, { filename: "dds.js" });

  const mod = sandbox.Module;
  if (typeof mod.cwrap !== "function") {
    throw new Error("DDS engine loaded but cwrap is missing");
  }

  const generateDDTable = mod.cwrap("generateDDTable", "string", ["string"]);

  // dds.js exposes nextPlays (with its own solves + argument packing + cache).
  // We reuse it instead of calling solve() ourselves: it validates and packs
  // the played cards into the C ABI correctly.
  const nextPlays = sandbox.window && typeof sandbox.window.nextPlays === "function"
    ? sandbox.window.nextPlays
    : null;

  cachedHandle = { generateDDTable, nextPlays };
  return cachedHandle;
}

/**
 * Full double-dummy score table for a complete deal.
 *
 * @param {string} pbn PBN deal string, e.g. "N:SK. H. ..." (leader prefix + 4 hands).
 * @returns {Promise<object>} {"N": {"N":12,...}, "S": {...}, ...}
 *   Keys: strain -> declarer -> makeable tricks.
 */
export function calculateDoubleDummyTable(pbn) {
  const engine = loadEngine();
  const raw = engine.generateDDTable(pbn);
  const parsed = JSON.parse(raw);
  if (parsed.error) {
    throw new Error(`DDS error ${parsed.error} in ${parsed.function}: ${parsed.message}`);
  }
  return parsed;
}

/**
 * Best plays for one trick in the middle of a hand.
 *
 * @param {string} pbn PBN deal, e.g. "N:...". Only the leader's hand + trump are used.
 * @param {string} trump Trump suit: "S" | "H" | "D" | "C" | "N" (notrump).
 * @param {string[]} plays cards already played this trick, e.g. ["5D", "2D", "QD"].
 * @returns {Promise<object>} parsed JSON from the engine (tricks per option).
 * @see https://github.com/taopeng181/DDS/blob/master/README.md
 */
export function getNextPlays(pbn, trump, plays) {
  const engine = loadEngine();
  if (!engine.nextPlays) {
    throw new Error("DDS nextPlays wrapper not available");
  }
  if (!Array.isArray(plays) || plays.some((p) => typeof p !== "string" || p.length < 2 || p.length > 3)) {
    throw new Error("plays must be an array of 2-3 char card codes like '5D', '2D', 'QD'");
  }
  if (!/^[SHDCN]$/.test(trump)) {
    throw new Error("trump must be one of S, H, D, C, N");
  }
  const parsed = engine.nextPlays(pbn, trump, plays);
  if (parsed && parsed.error) {
    throw new Error(`DDS error ${parsed.error} in ${parsed.function}: ${parsed.message}`);
  }
  return parsed;
}