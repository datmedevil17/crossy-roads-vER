import type { ReactNode } from "react";
import { tilesPerRow, tileSize } from "../constants";

export function Road({ rowIndex, children }: { rowIndex: number; children?: ReactNode }) {
  return (
    <group position-y={rowIndex * tileSize}>
      <mesh receiveShadow>
        <planeGeometry args={[tilesPerRow * tileSize, tileSize]} />
        <meshLambertMaterial color={0x454a59} flatShading />
      </mesh>
      {children}
    </group>
  );
}