import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";
import useStore from "../stores/game";
import { 
  getProvider, 
  startGame as startGameBlockchain, 
  delegateGameSession,
  getActiveSessionInfo
} from "../services/blockchain";
import "./StartModal.css";

export function StartModal() {
  const status = useStore((state) => state.status);
  const startGame = useStore((state) => state.startGame);
  const [isStarting, setIsStarting] = useState(false);
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const handleStartGame = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet first!");
      return;
    }

    setIsStarting(true);
    
    try {
      const program = getProvider(publicKey, signTransaction, sendTransaction);
      if (!program) {
        toast.error("Failed to initialize blockchain program");
        return;
      }

      console.log("🎮 Checking for existing game sessions...");
      
      // Step 1: Check for active session
      toast.info("Checking for existing sessions...");
      const sessionInfo = await getActiveSessionInfo(program, publicKey);
      
      console.log("📋 Session Check Results:", sessionInfo);
      
      if (sessionInfo.hasActiveSession) {
        console.log("✅ Active session found!");
        console.log("📊 Session Details:", {
          player: publicKey.toBase58(),
          score: sessionInfo.sessionData?.score?.toString() || "0",
          steps: sessionInfo.sessionData?.steps?.toString() || "0",
          startTime: sessionInfo.sessionData?.startTime?.toString(),
          lastCheckpoint: sessionInfo.sessionData?.lastCheckpoint?.toString(),
          isDelegated: sessionInfo.isDelegated,
          delegationInfo: sessionInfo.delegationInfo
        });
        
        toast.success("Found existing game session!");
        
        // Check if session is already delegated
        if (sessionInfo.isDelegated) {
          console.log("🔄 Session is already delegated, proceeding to game...");
          toast.success("Session already delegated! Starting game...");
        } else {
          console.log("🚀 Session exists but not delegated, delegating now...");
          toast.info("Delegating existing session...");
          
          // Delegate the existing session
          const delegateTx = await delegateGameSession(program, publicKey);
          console.log("✅ Existing session delegated:", delegateTx);
          toast.success(`Session delegated! TX: ${delegateTx.slice(0, 8)}...`);
        }
      } else {
        console.log("🆕 No active session found, creating new session...");
        
        // Step 2: Start new game session
        toast.info("Starting new game session...");
        const startTx = await startGameBlockchain(program, publicKey);
        console.log("✅ New game started on blockchain:", startTx);
        toast.success(`Game session started! TX: ${startTx.slice(0, 8)}...`);

        // Step 3: Delegate the new session
        toast.info("Delegating new game session...");
        const delegateTx = await delegateGameSession(program, publicKey);
        console.log("✅ New game session delegated:", delegateTx);
        toast.success(`Session delegated! TX: ${delegateTx.slice(0, 8)}...`);
      }

      // Step 4: Start the local game
      startGame();
      toast.success("Game started! Use arrow keys to move.");
      
    } catch (error) {
      console.error("❌ Failed to start game:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to start game: ${errorMessage}`);
    } finally {
      setIsStarting(false);
    }
  };

  if (status !== "waiting") return null;

  return (
    <div id="start-modal-container">
      <div id="start-modal">
        <h1>Crossy Roads</h1>
        <p>Get ready to cross the roads and avoid the traffic!</p>
        <p>Connect your wallet and start playing on the blockchain.</p>
        <button 
          onClick={handleStartGame}
          disabled={isStarting || !publicKey}
        >
          {isStarting ? "Starting..." : !publicKey ? "Connect Wallet First" : "Start Game"}
        </button>
      </div>
    </div>
  );
}
