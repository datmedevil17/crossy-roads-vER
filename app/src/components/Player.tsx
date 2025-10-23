import { Bounds } from "@react-three/drei"
import { useEffect, useRef } from "react";
import { Group, DirectionalLight as ThreeDirectionalLight } from "three";
import usePlayerAnimation from "../hooks/usePlayerAnimation";
import { useThree } from "@react-three/fiber";
import { DirectionalLight } from "./DirectionalLight";
import { setRef } from "../stores/player";

const Player = () => {
  const player = useRef<Group | null>(null);
  const lightRef = useRef<ThreeDirectionalLight | null>(null);

  const camera = useThree((state) => state.camera);

  usePlayerAnimation(player);

  useEffect(() => {
    if (!player.current) return;
    if (!lightRef.current) return;

    // Attach the camera to the player
    player.current.add(camera);
    lightRef.current.target = player.current;
    setRef(player.current);
  });

  return (
    <Bounds fit clip observe margin={10}>
      <group ref={player}>
        <group>
          <mesh position={[0, 0, 10]} castShadow receiveShadow>
            <boxGeometry args={[15, 15, 20]} />
            <meshStandardMaterial color="orange" flatShading />
          </mesh>
          <mesh position={[0, 0, 21]} castShadow receiveShadow>
            <boxGeometry args={[2, 4, 2]} />
            <meshLambertMaterial color={0xf0619a} flatShading />
          </mesh>
        </group>
        <DirectionalLight lightRef={lightRef} />
      </group>
    </Bounds>
  )
}

export default Player
