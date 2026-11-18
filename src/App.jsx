import { createSignal } from "solid-js";

export default function App() {
  const [count, setCount] = createSignal(0);
  return (
    <button type="button" onClick={() => setCount(c => c + 1)}>
      clicks: {count()}
    </button>
  );
}
