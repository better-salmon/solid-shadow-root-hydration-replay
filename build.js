import { build } from "esbuild";
import { transformAsync } from "@babel/core";
import { readFile } from "node:fs/promises";

const solid = generate => ({
  name: "solid",
  setup(b) {
    b.onLoad({ filter: /\.jsx$/ }, async ({ path }) => {
      const { code } = await transformAsync(await readFile(path, "utf8"), {
        filename: path,
        babelrc: false,
        configFile: false,
        plugins: [["@solidjs/babel-plugin", { generate, hydratable: true }]]
      });
      return { contents: code, loader: "js" };
    });
  }
});

// APP=nested swaps in src/NestedApp.jsx for both builds.
const app = {
  name: "app",
  setup(b) {
    if (process.env.APP === "nested")
      b.onResolve({ filter: /^\.\/App\.jsx$/ }, () => ({ path: new URL("./src/NestedApp.jsx", import.meta.url).pathname }));
  }
};

await build({
  entryPoints: ["src/entry-server.jsx"],
  outfile: "dist/server.js",
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  plugins: [app, solid("ssr")]
});
await build({
  entryPoints: ["src/entry-client.jsx"],
  outfile: "dist/client.js",
  bundle: true,
  platform: "browser",
  format: "esm",
  conditions: ["browser"],
  // FIX=owner|target|full bundles a patched client runtime written by patch-web.js.
  alias: process.env.FIX ? { "@solidjs/web": `./node_modules/.patched-web/${process.env.FIX}.js` } : {},
  plugins: [app, solid("dom")]
});
