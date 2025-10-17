import useStore from "../stores/game";
import "./Score.css";

export function Score() {
  const score = useStore((state) => state.score);

  return <div id="score">{score}</div>;
}