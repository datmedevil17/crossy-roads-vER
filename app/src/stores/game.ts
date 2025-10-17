import { create } from 'zustand';
import useMapStore from "./map";
import { reset as resetPlayerStore } from "./player";

interface GameState {
  score: number;
  status: "running" | "over";
  updateScore: () => void;
  endGame: () => void;
  incrementScore: () => void;
  resetScore: () => void;
  reset: () => void;
}

const useStore = create<GameState>((set) => ({
  score: 0,
  status: "running",

  updateScore: () => {
    set((state) => ({ score: state.score + 1 }));
  },
  
  endGame: () => {
    set({ status: "over" });
  },
  
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  
  resetScore: () => set({ score: 0 }),
  
  reset: () => {
    const mapState = useMapStore.getState() as { reset: () => void };
    mapState.reset();
    resetPlayerStore();
    set({ status: "running", score: 0 });
  },
}));

export default useStore;