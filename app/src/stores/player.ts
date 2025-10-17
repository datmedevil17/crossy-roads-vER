import { endsUpInValidPosition } from "../utilities/endsUpInValidPosition";
import useMapStore from "./map";
import useGameStore from "./game";

export type Direction = "forward" | "backward" | "left" | "right";

export interface PlayerState {
    currentRow: number;
    currentTile: number;
    movesQueue: Direction[];
    ref: any;
}

export const state: PlayerState = {
  currentRow: 0,
  currentTile: 0,
  movesQueue: [],
  ref: null
};

export function queueMove(direction: Direction): void {
  const isValidMove = endsUpInValidPosition(
    { rowIndex: state.currentRow, tileIndex: state.currentTile },
    [...state.movesQueue, direction]
  );

  if (!isValidMove) return;
  state.movesQueue.push(direction);
}

export function stepCompleted() {
  const direction = state.movesQueue.shift();

  if (direction === "forward") state.currentRow += 1;
  if (direction === "backward") state.currentRow -= 1;
  if (direction === "left") state.currentTile -= 1;
  if (direction === "right") state.currentTile += 1;

  // Add a batch of new rows if the player is running out of them; rows are infinite
  const mapState = useMapStore.getState() as { rows: unknown[]; addRows: () => void };
  if (state.currentRow === mapState.rows.length - 10) {
    mapState.addRows();
  }

  useGameStore.getState().updateScore();
}

export function setRef(ref: any) {
  state.ref = ref;
}

export function reset() {
  state.currentRow = 0;
  state.currentTile = 0;
  state.movesQueue = [];

  if (!state.ref) return;
  state.ref.position.x = 0;
  state.ref.position.y = 0;
  if (state.ref.children[0]) {
    state.ref.children[0].rotation.z = 0;
  }
}