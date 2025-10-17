import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { state as player } from "../stores/player";
import useGameStore from "../stores/game";

export default function useHitDetection(vehicle: { current: THREE.Object3D<THREE.Object3DEventMap>|null; }, rowIndex: number) {
  const endGame = useGameStore((state) => state.endGame);
  const gameStatus = useGameStore((state) => state.status);

  useFrame(() => {
    if (!vehicle.current) return;
    if (!player.ref) return;
    if (gameStatus !== "running") return;

    if (
      rowIndex === player.currentRow ||
      rowIndex === player.currentRow + 1 ||
      rowIndex === player.currentRow - 1
    ) {
      const vehicleBoundingBox = new THREE.Box3();
      vehicleBoundingBox.setFromObject(vehicle.current);

      const playerBoundingBox = new THREE.Box3();
      playerBoundingBox.setFromObject(player.ref);

      if (playerBoundingBox.intersectsBox(vehicleBoundingBox)) {
        endGame();
      }
    }
  });
}