import { chromium } from "playwright";
import { spawn } from "node:child_process";

const PORT = 3123;
const server = spawn("node", ["server.js"], { env: { ...process.env, PORT: String(PORT) }, stdio: "inherit" });
await new Promise(r => setTimeout(r, 500));

// PW_CHANNEL=chrome uses an installed Chrome instead of Playwright's Chromium.
let browser;
try {
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL });
  const page = await browser.newPage();
  if (process.env.FIX === "full") {
    // Matching bootstrap change for the "full" candidate fix: also record the
    // event's original target, which is lost after dispatch in a shadow tree.
    await page.route("**/", async route => {
      const res = await route.fetch();
      const html = await res.text();
      const from = "e.events.push([s,o])";
      if (!html.includes(from)) throw new Error("bootstrap not found");
      await route.fulfill({
        response: res,
        body: html.replace(from, "e.events.push([s,o,o.composedPath&&o.composedPath()[0]||o.target])")
      });
    });
  }
  page.on("console", m => console.log("[browser]", m.type(), m.text()));
  page.on("pageerror", e => console.log("[pageerror]", e.message));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "commit" });

  // Both clicks happen while /client.js is still delayed, i.e. before hydration.
  const light = page.locator("#light button");
  const shadow = page.locator("#host button"); // Playwright pierces open shadow roots
  await light.click();
  await shadow.click();
  console.log("before hydration:", await page.evaluate(() => ({
    clientLoaded: "_$$click" in document.querySelector("#light button"),
    // What the bootstrap queued, as runHydrationEvents will later see it.
    queued: _$HY.events.map(([el, e]) => ({
      recordedElement: el.nodeName,
      inShadowRoot: el.getRootNode() instanceof ShadowRoot,
      targetAfterDispatch: e.target && (e.target.id ? `#${e.target.id}` : e.target.nodeName),
      composedPathLength: e.composedPath().length
    }))
  })));

  await page.waitForLoadState("load"); // fires after the delayed /client.js ran
  await page.waitForTimeout(300);
  const result = { light: await light.textContent(), shadow: await shadow.textContent() };
  console.log("after hydration:", result);

  // Live clicks after hydration, to show the shadow root itself is wired up.
  await light.click();
  await shadow.click();
  console.log("after one more live click each:", {
    light: await light.textContent(),
    shadow: await shadow.textContent()
  });

  const ok = result.light.trim() === "clicks: 1" && result.shadow.trim() === "clicks: 1";
  console.log(ok ? "PASS: both early clicks replayed" : "FAIL: early click not replayed in shadow root");
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser?.close();
  server.kill();
}
