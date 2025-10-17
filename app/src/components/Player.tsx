import { Bounds } from "@react-three/drei"
import { useEffect, useRef } from "react";
import { Group, DirectionalLight as ThreeDirectionalLight } from "three";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";
import usePlayerAnimation from "../hooks/usePlayerAnimation";
import { useThree } from "@react-three/fiber";
import { DirectionalLight } from "./DirectionalLight";
import { setRef, setStepCallback } from "../stores/player";
import { getProvider, takeStep as takeStepBlockchain } from "../services/blockchain";

const Player = () => {
  const player = useRef<Group | null>(null);
  const lightRef = useRef<ThreeDirectionalLight | null>(null);
  const { publicKey, signTransaction, sendTransaction } = useWallet();

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

  // Set up blockchain step callback
  useEffect(() => {
    const handleStep = async () => {
      if (!publicKey) {
        console.log("⚠️ No wallet connected, skipping blockchain step");
        return;
      }

      try {
        const program = getProvider(publicKey, signTransaction, sendTransaction);
        if (!program) {
          console.log("⚠️ No blockchain program available");
          return;
        }

        console.log("🚶 Taking step on blockchain...");
        const signature = await takeStepBlockchain(program, publicKey);
        console.log("✅ Step recorded on blockchain:", signature);
        toast.success(`Step recorded! TX: ${signature.slice(0, 8)}...`, {
          autoClose: 2000,
        });
      } catch (error) {
        console.error("❌ Failed to record step on blockchain:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Step failed: ${errorMessage}`, {
          autoClose: 3000,
        });
      }
    };

    setStepCallback(handleStep);

    // Cleanup callback on unmount
    return () => {
      setStepCallback(undefined);
    };
  }, [publicKey, signTransaction, sendTransaction]);

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
