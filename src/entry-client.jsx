import { hydrate } from "@solidjs/web";
import App from "./App.jsx";

hydrate(() => <App />, document.getElementById("light"), { renderId: "light" });
hydrate(() => <App />, document.getElementById("host").shadowRoot, { renderId: "shadow" });
