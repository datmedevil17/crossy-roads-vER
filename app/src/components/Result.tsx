import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";
import useStore from "../stores/game";
import { getProvider, endGame as endGameBlockchain } from "../services/blockchain";
import "./Result.css";

export function Result() {
  const status = useStore((state) => state.status);
  const score = useStore((state) => state.score);
  const reset = useStore((state) => state.reset);
  const [isEnding, setIsEnding] = useState(false);
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const handleRetry = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet!");
      return;
    }

    setIsEnding(true);
    
    try {
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) {
        toast.error("Failed to initialize blockchain program");
        return;
      }

      console.log("🔚 Ending game session on blockchain...");
      
      // End the game on blockchain
      toast.info("Ending game session...");
      const endTx = await endGameBlockchain(program, publicKey);
      console.log("✅ Game ended on blockchain:", endTx);
      toast.success(`Game session ended! TX: ${endTx.slice(0, 8)}...`);

      // Reset the local game state
      reset();
      
    } catch (error) {
      console.error("❌ Failed to end game:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to end game: ${errorMessage}`);
      
      // Still reset the local game even if blockchain call fails
      reset();
    } finally {
      setIsEnding(false);
    }
  };

  if (status !== "over") return null;

  return (
    <div id="result-container">
      <div id="result">
        <h1>Game Over</h1>
        <p>Your score: {score}</p>
        <button 
          onClick={handleRetry}
          disabled={isEnding}
        >
          {isEnding ? "Ending..." : "Retry"}
        </button>
      </div>
    </div>
  );
}