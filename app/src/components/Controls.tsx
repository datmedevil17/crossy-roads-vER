import { queueMove } from "../stores/player";
import useEventListeners from "../hooks/useEventListeners";
import "./Controls.css";

export function Controls() {
  useEventListeners();

  return (
    <div id="controls">
      <div>
        <button onClick={() => queueMove("forward")}>▲</button>
        <button onClick={() => queueMove("left")}>◀</button>
        <button onClick={() => queueMove("backward")}>▼</button>
        <button onClick={() => queueMove("right")}>▶</button>
      </div>
    </div>
  );
}