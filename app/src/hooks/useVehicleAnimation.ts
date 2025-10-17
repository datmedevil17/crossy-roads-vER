import { useFrame } from "@react-three/fiber";
import { tileSize, minTileIndex, maxTileIndex } from "../constants";
import useGameStore from "../stores/game";

export default function useVehicleAnimation(ref: { current: any; }, direction: any, speed: number) {
  useFrame((_state, delta) => {
    if (!ref.current) return;
    
    // Only animate vehicles when the game is running
    const gameStatus = useGameStore.getState().status;
    if (gameStatus !== "running") return;
    
    const vehicle = ref.current;

    const beginningOfRow = (minTileIndex - 2) * tileSize;
    const endOfRow = (maxTileIndex + 2) * tileSize;

    if (direction) {
      vehicle.position.x =
        vehicle.position.x > endOfRow
          ? beginningOfRow
          : vehicle.position.x + speed * delta;
    } else {
      vehicle.position.x =
        vehicle.position.x < beginningOfRow
          ? endOfRow
          : vehicle.position.x - speed * delta;
    }
  });
}