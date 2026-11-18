import { createSignal } from "solid-js";

// Same counter, but the handler sits on a child of the element that carries
// the hydration key (`_hk` is on the <div>, not the <button>).
export default function App() {
  const [count, setCount] = createSignal(0);
  return (
    <div>
      <span>nested</span>
      <button type="button" onClick={() => setCount(c => c + 1)}>
        clicks: {count()}
      </button>
    </div>
  );
}
