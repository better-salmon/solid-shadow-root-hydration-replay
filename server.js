import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { renderPage } from "./dist/server.js";

// The client bundle is served after a delay, so you can click both buttons
// before hydration starts.
const CLIENT_DELAY_MS = 3000;
const port = Number(process.env.PORT) || 3000;

createServer(async (req, res) => {
  if (req.url === "/client.js") {
    await new Promise(r => setTimeout(r, CLIENT_DELAY_MS));
    res.writeHead(200, { "content-type": "text/javascript" });
    return res.end(await readFile(new URL("./dist/client.js", import.meta.url)));
  }
  if (req.url === "/favicon.ico") return res.writeHead(204).end();
  if (req.url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(renderPage());
  }
  res.writeHead(404).end();
}).listen(port, () => console.log(`http://localhost:${port}`));
