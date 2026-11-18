import { renderToString, generateHydrationScript } from "@solidjs/web";
import App from "./App.jsx";

export function renderPage() {
  const light = renderToString(() => <App />, { renderId: "light" });
  const shadow = renderToString(() => <App />, { renderId: "shadow" });
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    ${generateHydrationScript()}
  </head>
  <body>
    <p>Light DOM:</p>
    <div id="light">${light}</div>
    <p>Declarative Shadow DOM:</p>
    <div id="host"><template shadowrootmode="open">${shadow}</template></div>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
