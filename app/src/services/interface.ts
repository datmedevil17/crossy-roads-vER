import type { PublicKey } from "@solana/web3.js";
import  BN  from "bn.js";

export interface GameSession {
  player: PublicKey;
  score: BN;
  steps: BN;
  isActive: boolean;
  startTime: BN;
  lastCheckpoint: BN;
  sessionPda?: string;
  isDelegated?: boolean;
}

export interface GameStateData {
  score: number;
  steps: number;
  isActive: boolean;
}

export interface SessionInfo {
  hasActiveSession: boolean;
  isDelegated: boolean;
  sessionData: GameSession | null;
  delegationInfo: DelegationInfo;
}

export interface DelegationInfo {
  accountExists: boolean;
  accountOwner?: string;
  programId?: string;
  isDelegated?: boolean;
  sessionPda?: string;
  bufferAccount?: {
    pda: string;
    exists: boolean;
  };
  error?: string;
}