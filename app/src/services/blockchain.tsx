import { AnchorProvider, Program, Wallet} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  type TransactionSignature,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { type CrossyRoads } from "./crossy_roads";
import idl from "./crossy_roads.json";
import { getClusterURL } from "../utilities/helpers";

const CLUSTER: string = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
const RPC_URL: string = getClusterURL(CLUSTER);
import { MAGICBLOCK_RPC } from "../utilities/helpers";
import type { GameSession, GameStateData, SessionInfo, DelegationInfo } from "./interface";

const OWNER_PROGRAM = new PublicKey("HJqX4nHWvDjBjpsrmuvVtoWhHJiebbDv5y9UMtrkNbAS");
const DELEGATION_PROGRAM = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");

// Type definitions


export const getProvider = (
  publicKey: PublicKey | null,
  signTransaction: unknown,
  sendTransaction: unknown
): Program<CrossyRoads> | null => {
  if (!publicKey || !signTransaction) {
    console.log("Wallet not connected or missing signTransaction");
    return null;
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(
    connection,
    { publicKey, signTransaction, sendTransaction } as unknown as Wallet,
    { commitment: "processed" }
  );

  return new Program<CrossyRoads>(idl as CrossyRoads, provider);
};

export const getProviderReadonly = (): Program<CrossyRoads> => {
  const connection = new Connection(RPC_URL, "confirmed");

  const wallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error("Read-only provider cannot sign transactions.");
    },
    signAllTransaction: async () => {
      throw new Error("Read-only provider cannot sign transactions.");
    },
  };

  const provider = new AnchorProvider(
    connection,
    wallet as unknown as Wallet,
    { commitment: "processed" }
  );

  return new Program<CrossyRoads>(idl as CrossyRoads, provider);
};


export const getSessionPda = (
  programId: PublicKey,
  player: PublicKey
): [PublicKey, number] =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("game_session"), player.toBuffer()],
    programId
  );

/**
 * startGame: Initialize a new game session
 */
export const startGame = async (
  program: Program<CrossyRoads>,
  player: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, player);

  // Check if session already exists
  try {
    const existingSession = (await program.account.gameSession.fetch(
      sessionPda
    )) as unknown as GameSession;
    if (existingSession.isActive) {
      throw new Error("Player already has an active session");
    }
  } catch (err: unknown) {
    if (
      !String(err).includes("Account does not exist") &&
      !String(err).includes("AccountNotFound")
    ) {
      throw err;
    }
  }

  const balance = await program.provider.connection.getBalance(player);
  if (balance < 0.01 * 1e9) throw new Error("Insufficient SOL balance");

  const tx = await program.methods
    .startGame()
    .accountsPartial({
      session: sessionPda,
      player,
      payer: player,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Game started:", tx);
  return tx;
};

/**
 * delegateGameSession: Delegate the session to ephemeral rollup
 */
export const delegateGameSession = async (
  program: Program<CrossyRoads>,
  player: PublicKey
): Promise<TransactionSignature> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, player);

  // Ensure session exists and is active
  const sessionInfo = await program.provider.connection.getAccountInfo(sessionPda);
  if (!sessionInfo) throw new Error("Session not initialized");
  
  const session = await program.account.gameSession.fetch(sessionPda);
  if (!session.isActive) throw new Error("Session is not active");

  // Derive delegation PDAs
  const [bufferSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("buffer"), sessionPda.toBuffer()],
    OWNER_PROGRAM
  );
  const [delegationRecordSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegation"), sessionPda.toBuffer()],
    DELEGATION_PROGRAM
  );
  const [delegationMetadataSessionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegation-metadata"), sessionPda.toBuffer()],
    DELEGATION_PROGRAM
  );

  console.log("Delegating session PDAs:", {
    sessionPda: sessionPda.toBase58(),
    bufferSessionPda: bufferSessionPda.toBase58(),
    delegationRecordSessionPda: delegationRecordSessionPda.toBase58(),
    delegationMetadataSessionPda: delegationMetadataSessionPda.toBase58(),
  });

  const tx = await program.methods
    .delegateGameSession()
    .accountsPartial({
      payer: player,
      bufferSession: bufferSessionPda,
      delegationRecordSession: delegationRecordSessionPda,
      delegationMetadataSession: delegationMetadataSessionPda,
      session: sessionPda,
      ownerProgram: OWNER_PROGRAM,
      delegationProgram: DELEGATION_PROGRAM,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log("✅ Session delegated:", tx);
  return tx;
};

/**
 * takeStep: Execute a game step (move forward)
 */
export const takeStep = async (
  program: Program<CrossyRoads>,
  playerPublicKey: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, playerPublicKey);

  // Ensure session exists and is active
  try {
    const session = await program.account.gameSession.fetch(sessionPda);
    if (!session.isActive) throw new Error("Game session is not active");
  } catch (err) {
    throw new Error("No active game session found");
  }

  // Check if session is delegated
  const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
  const delegated = !!accountInfo && !accountInfo.owner.equals(program.programId);

  if (delegated) {
    // UNSAFE: derive temp keypair for ephemeral transactions
    const tempSeed = playerPublicKey.toBytes();
    const tempKeypair = Keypair.fromSeed(tempSeed);

    const ephemeralConnection = new Connection(MAGICBLOCK_RPC, {
      commitment: "confirmed",
    });

    const tx: Transaction = await program.methods
      .takeStep()
      .accounts({
        session: sessionPda,
        player: playerPublicKey,
      })
      .transaction();

    const {
      value: { blockhash, lastValidBlockHeight },
    } = await ephemeralConnection.getLatestBlockhashAndContext();

    tx.recentBlockhash = blockhash;
    tx.feePayer = tempKeypair.publicKey;
    tx.sign(tempKeypair);

    const raw = tx.serialize();
    const signature = await ephemeralConnection.sendRawTransaction(raw, {
      skipPreflight: true,
    });
    await ephemeralConnection.confirmTransaction(
      { blockhash, lastValidBlockHeight, signature },
      "confirmed"
    );

    console.log("✅ Step taken (ephemeral):", signature);
    return signature;
  } else {
    // Wallet-signed transaction
    const signature = await program.methods
      .takeStep()
      .accountsPartial({
        session: sessionPda,
        player: playerPublicKey,
      })
      .rpc({ commitment: "confirmed" });

    console.log("✅ Step taken (wallet):", signature);
    return signature;
  }
};

/**
 * checkpointGame: Create a checkpoint during gameplay
 */
export const checkpointGame = async (
  program: Program<CrossyRoads>,
  playerPublicKey: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, playerPublicKey);

  // Check if session is delegated
  const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
  const delegated = !!accountInfo && !accountInfo.owner.equals(program.programId);

  if (delegated) {
    const tempSeed = playerPublicKey.toBytes();
    const tempKeypair = Keypair.fromSeed(tempSeed);
    const ephemeralConnection = new Connection(MAGICBLOCK_RPC, {
      commitment: "confirmed",
    });

    const magicContext = tempKeypair.publicKey;
    const magicProgram = new PublicKey("Magic11111111111111111111111111111111111111");

    const tx: Transaction = await program.methods
      .checkpointGame()
      .accountsPartial({
        session: sessionPda,
        magicContext,
        magicProgram,
        payer: tempKeypair.publicKey,
      })
      .transaction();

    const { blockhash } = await ephemeralConnection.getLatestBlockhash("finalized");
    tx.recentBlockhash = blockhash;
    tx.feePayer = tempKeypair.publicKey;
    tx.sign(tempKeypair);

    const signature = await sendAndConfirmTransaction(
      ephemeralConnection,
      tx,
      [tempKeypair],
      { commitment: "confirmed" }
    );

    console.log("✅ Game checkpointed (ephemeral):", signature);
    return signature;
  } else {
    const magicContext = PublicKey.default;
    const magicProgram = new PublicKey("Magic11111111111111111111111111111111111111");

    const signature = await program.methods
      .checkpointGame()
      .accountsPartial({
        session: sessionPda,
        magicContext,
        magicProgram,
        payer: program.provider.publicKey,
      })
      .rpc({ commitment: "confirmed" });

    console.log("✅ Game checkpointed (wallet):", signature);
    return signature;
  }
};

/**
 * endGame: End the game session and commit final state
 */
export const endGame = async (
  program: Program<CrossyRoads>,
  playerPublicKey: PublicKey
): Promise<string> => {
  if (!program.provider.publicKey) throw new Error("Wallet not connected");

  const [sessionPda] = getSessionPda(program.programId, playerPublicKey);

  const sessionInfo = await program.provider.connection.getAccountInfo(sessionPda);
  if (!sessionInfo) throw new Error("Session not initialized");

  const delegated = !sessionInfo.owner.equals(program.programId);

  // If delegated, undelegate first via ephemeral connection
  if (delegated) {
    console.log("Session is delegated. Undelegating via ephemeral connection...");

    const tempSeed = playerPublicKey.toBytes();
    const tempKeypair = Keypair.fromSeed(tempSeed);
    const ephemeralConnection = new Connection(MAGICBLOCK_RPC, {
      commitment: "confirmed",
    });

    interface EphemeralWallet {
      publicKey: PublicKey;
      signTransaction: (tx: Transaction) => Promise<Transaction>;
      signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
    }

    const ephemeralWallet: EphemeralWallet = {
      publicKey: tempKeypair.publicKey,
      signTransaction: async (tx: Transaction) => {
        tx.sign(tempKeypair);
        return tx;
      },
      signAllTransactions: async (txs: Transaction[]) => {
        txs.forEach((tx) => tx.sign(tempKeypair));
        return txs;
      },
    };

    const ephemeralProvider = new AnchorProvider(
      ephemeralConnection,
      ephemeralWallet as unknown as AnchorProvider["wallet"],
      AnchorProvider.defaultOptions()
    );

    const ephemeralProgram = new Program<CrossyRoads>(
      program.idl as CrossyRoads,
      ephemeralProvider
    );

    const magicContext = new PublicKey("MagicContext1111111111111111111111111111111");
    const magicProgram = new PublicKey("Magic11111111111111111111111111111111111111");

    // End game via ephemeral connection (this handles undelegation)
    const endSignature = await ephemeralProgram.methods
      .endGame()
      .accountsPartial({
        session: sessionPda,
        player: playerPublicKey,
        magicContext,
        magicProgram,
        payer: tempKeypair.publicKey,
      })
      .rpc({ commitment: "confirmed" });

    console.log("✅ Game ended (ephemeral):", endSignature);

    // Wait for undelegation to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    return endSignature;
  } else {
    // Direct end game via wallet
    const magicContext = PublicKey.default;
    const magicProgram = new PublicKey("Magic11111111111111111111111111111111111111");

    const signature = await program.methods
      .endGame()
      .accountsPartial({
        session: sessionPda,
        player: program.provider.publicKey,
        magicContext,
        magicProgram,
        payer: program.provider.publicKey,
      })
      .rpc({ commitment: "confirmed" });

    console.log("✅ Game ended (wallet):", signature);
    return signature;
  }
};

/**
 * getGameState: Fetch current game state
 */
export const getGameState = async (
  program: Program<CrossyRoads>,
  playerPublicKey: PublicKey
): Promise<GameStateData | null> => {
  try {
    const [sessionPda] = getSessionPda(program.programId, playerPublicKey);

    const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
    if (!accountInfo) return null;

    const session = (await program.account.gameSession.fetch(
      sessionPda
    )) as unknown as GameSession;

    return {
      score: session.score.toNumber(),
      steps: session.steps.toNumber(),
      isActive: session.isActive,
    };
  } catch (err: unknown) {
    if (
      String(err).includes("Account does not exist") ||
      String(err).includes("AccountNotFound")
    ) {
      return null;
    }
    throw err;
  }
};

/**
 * fetchGameSession: Retrieve full game session data
 */
export const fetchGameSession = async (
  program: Program<CrossyRoads>,
  playerPublicKey: PublicKey
): Promise<GameSession | null> => {
  try {
    const [sessionPda] = getSessionPda(program.programId, playerPublicKey);

    const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
    if (!accountInfo) return null;

    const session = (await program.account.gameSession.fetch(
      sessionPda
    )) as unknown as GameSession;

    return {
      ...session,
      sessionPda: sessionPda.toBase58(),
      isDelegated: !accountInfo.owner.equals(program.programId),
    };
  } catch (err: unknown) {
    if (
      String(err).includes("Account does not exist") ||
      String(err).includes("AccountNotFound")
    ) {
      return null;
    }
    throw err;
  }
};

/**
 * checkActiveSession: Check if player has an active session
 */
export const checkActiveSession = async (
  program: Program<CrossyRoads>,
  playerPublicKey: PublicKey
): Promise<boolean> => {
  try {
    const session = await fetchGameSession(program, playerPublicKey);
    return session !== null && session.isActive;
  } catch (err: unknown) {
    console.warn("Error checking active session:", err);
    return false;
  }
};

/**
 * getActiveSessionInfo: Get comprehensive session information
 */
export const getActiveSessionInfo = async (
  program: Program<CrossyRoads>,
  playerPublicKey: PublicKey
): Promise<SessionInfo> => {
  try {
    const [sessionPda] = getSessionPda(program.programId, playerPublicKey);

    const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
    if (!accountInfo) {
      return {
        hasActiveSession: false,
        isDelegated: false,
        sessionData: null,
        delegationInfo: { accountExists: false },
      };
    }

    const sessionData = (await program.account.gameSession.fetch(
      sessionPda
    )) as unknown as GameSession;
    const isDelegated = !accountInfo.owner.equals(program.programId);

    const delegationInfo: DelegationInfo = {
      accountExists: true,
      accountOwner: accountInfo.owner.toBase58(),
      programId: program.programId.toBase58(),
      isDelegated,
      sessionPda: sessionPda.toBase58(),
    };

    if (isDelegated) {
      try {
        const [bufferSessionPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("buffer"), sessionPda.toBuffer()],
          OWNER_PROGRAM
        );

        const bufferAccount = await program.provider.connection.getAccountInfo(
          bufferSessionPda
        );
        delegationInfo.bufferAccount = {
          pda: bufferSessionPda.toBase58(),
          exists: bufferAccount !== null,
        };
      } catch (error) {
        console.warn("Error checking buffer account:", error);
      }
    }

    console.log("📊 Active Session Info:", {
      player: playerPublicKey.toBase58(),
      hasActiveSession: sessionData.isActive,
      isDelegated,
      sessionData: {
        score: sessionData.score?.toString(),
        steps: sessionData.steps?.toString(),
        isActive: sessionData.isActive,
      },
      delegationInfo,
    });

    return {
      hasActiveSession: sessionData.isActive,
      isDelegated,
      sessionData,
      delegationInfo,
    };
  } catch (error) {
    console.error("Error getting session info:", error);
    return {
      hasActiveSession: false,
      isDelegated: false,
      sessionData: null,
      delegationInfo: { accountExists: false, error: String(error) },
    };
  }
};

/**
 * checkSessionDelegated: Check if session is delegated
 */
export const checkSessionDelegated = async (
  program: Program<CrossyRoads>,
  playerPublicKey: PublicKey
): Promise<boolean> => {
  try {
    const [sessionPda] = getSessionPda(program.programId, playerPublicKey);

    const accountInfo = await program.provider.connection.getAccountInfo(sessionPda);
    if (!accountInfo) {
      console.log("❌ No session found for player:", playerPublicKey.toBase58());
      return false;
    }

    const isDelegated = !accountInfo.owner.equals(program.programId);

    console.log("🔍 Session delegation check:", {
      player: playerPublicKey.toBase58(),
      sessionPda: sessionPda.toBase58(),
      accountOwner: accountInfo.owner.toBase58(),
      programId: program.programId.toBase58(),
      isDelegated,
    });

    return isDelegated;
  } catch (error) {
    console.error("Error checking session delegation:", error);
    return false;
  }
};