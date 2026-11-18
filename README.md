# Solid 2.0: early clicks are not replayed when hydrating into a shadow root

The same counter is server-rendered twice and hydrated twice with `solid-js` / `@solidjs/web` 2.0.1:

- `#light`: hydrated into a light DOM element (the control)
- `#host`: rendered inside `<template shadowrootmode="open">` (Declarative Shadow DOM) and hydrated into `host.shadowRoot`

`server.js` delays `/client.js` by 3 seconds, so you can click both buttons before hydration starts. The `_$HY` bootstrap from `generateHydrationScript()` queues both clicks. After hydration, only the light DOM click has been replayed.

## Run it

```sh
npm install
npx playwright install chromium
npm test              # FAIL: light "clicks: 1", shadow "clicks: 0"
```

To try it by hand, run `npm run build && npm start`, open http://localhost:3000 and click both buttons within 3 seconds.

`PW_CHANNEL=chrome npm test` uses an installed Chrome instead.

## Candidate fixes

`npm test` first runs `patch-web.js`, which writes patched copies of `@solidjs/web/dist/web.js` to `node_modules/.patched-web/`. `FIX=<name> npm test` bundles one of them, and `APP=nested npm test` uses `src/NestedApp.jsx`:

| `FIX`    | change                                                                                     | `App.jsx` | `APP=nested` |
| -------- | ------------------------------------------------------------------------------------------ | --------- | ------------ |
| (none)   | 2.0.1 as published                                                                         | FAIL      | FAIL         |
| `owner`  | `runHydrationEvents`: `findOwner(el, state)` instead of `findOwner(e.target, state)`       | FAIL      | FAIL         |
| `target` | `runHydrationEvents`: replay with `target` set to the recorded `_hk` element               | PASS      | FAIL         |
| `full`   | bootstrap also queues `composedPath()[0]`; replay restores it as `target` (see `test.js`)  | PASS      | PASS         |

`APP=nested` puts the handler on a child of the element that carries `_hk`. Only `click` was tested.
