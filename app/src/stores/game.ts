import { create } from 'zustand';
import useMapStore from "./map";
import { reset as resetPlayerStore } from "./player";

interface GameState {
  score: number;
  status: "waiting" | "running" | "over";
  updateScore: () => void;
  endGame: () => void;
  incrementScore: () => void;
  resetScore: () => void;
  reset: () => void;
  startGame: () => void;
}

const useStore = create<GameState>((set) => ({
  score: 0,
  status: "waiting",

  updateScore: () => {
    set((state) => ({ score: state.score + 1 }));
  },
  
  endGame: () => {
    set({ status: "over" });
  },
  
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  
  resetScore: () => set({ score: 0 }),
  
  startGame: () => {
    set({ status: "running" });
  },
  
  reset: () => {
    const mapState = useMapStore.getState() as { reset: () => void };
    mapState.reset();
    resetPlayerStore();
    set({ status: "waiting", score: 0 });
  },
}));

export default useStore;