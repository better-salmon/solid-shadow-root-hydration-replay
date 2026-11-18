// Writes patched copies of @solidjs/web's client build to try candidate fixes.
// `npm test` runs it; `FIX=owner|target|full npm test` bundles one of them.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const src = await readFile("node_modules/@solidjs/web/dist/web.js", "utf8");
const replaceOnce = (s, from, to) => {
  if (s.split(from).length !== 2) throw new Error(`expected exactly one match for: ${from}`);
  return s.replace(from, to);
};

// "owner": only look the owner up from the recorded element.
const owner = replaceOnce(
  src,
  "const entry = findOwner(e.target, state);",
  "const entry = findOwner(el, state);"
);

// "target": the queued event's target was retargeted to the shadow host, so
// replay from the element the bootstrap recorded (owner lookup and walk).
const target = replaceOnce(
  src,
  "        events.shift();\n        let matchContainer",
  "        events.shift();\n        if (!el.contains(e.target)) Object.defineProperty(e, \"target\", { configurable: true, value: el });\n        let matchContainer"
);

// "full": the bootstrap also records the original target (composedPath()[0],
// see test.js), and replay restores it as the event's target.
const full = replaceOnce(
  replaceOnce(src, "const [el, e] = events[0];", "const [el, e, origin] = events[0];"),
  "        events.shift();\n        let matchContainer",
  "        events.shift();\n        if (origin && origin !== e.target) Object.defineProperty(e, \"target\", { configurable: true, value: origin });\n        let matchContainer"
);

await mkdir("node_modules/.patched-web", { recursive: true });
await writeFile("node_modules/.patched-web/owner.js", owner);
await writeFile("node_modules/.patched-web/target.js", target);
await writeFile("node_modules/.patched-web/full.js", full);
