import type { ReactNode } from "react";
import { tilesPerRow, tileSize } from "../constants";

export function Grass({ rowIndex, children }: { rowIndex: number; children?: ReactNode }) {
  return (
    <group position-y={rowIndex * tileSize}>
      <mesh receiveShadow>
        <boxGeometry args={[tilesPerRow * tileSize, tileSize, 3]} />
        <meshLambertMaterial color={0xbaf455} flatShading />
      </mesh>
      {children}
    </group>
  );
}