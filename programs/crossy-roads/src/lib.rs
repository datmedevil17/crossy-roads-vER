#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

// Ephemeral Rollups SDK imports
use ephemeral_rollups_sdk::anchor::{delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};

declare_id!("HJqX4nHWvDjBjpsrmuvVtoWhHJiebbDv5y9UMtrkNbAS");

#[ephemeral]
#[program]
pub mod crossy_roads {
    use super::*;

    /// Initialize a new game session and delegate it
    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let clock = Clock::get()?;
        
        session.player = ctx.accounts.player.key();
        session.step_count = 0;
        session.is_active = true;
        session.started_at = clock.unix_timestamp;
        session.ended_at = None;
        session.bump = ctx.bumps.session;

        msg!("Game session started for player: {}", session.player);
        msg!("Take steps to progress through the game!");

        emit!(GameStarted {
            player: session.player,
            timestamp: session.started_at,
        });

        Ok(())
    }

    /// Delegate the session PDA to an ER validator
    pub fn delegate_game_session(ctx: Context<DelegateGameSession>) -> Result<()> {
        let session = &ctx.accounts.session;
        require!(session.is_active, ErrorCode::SessionNotActive);

        ctx.accounts.delegate_session(
            &ctx.accounts.payer,
            &[SESSION_SEED, session.player.as_ref()],
            DelegateConfig {
                commit_frequency_ms: 30_000, // 30 seconds
                validator: Some(
                    "MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57"
                        .parse::<Pubkey>()
                        .unwrap(),
                ),
                ..Default::default()
            },
        )?;

        msg!("Game session delegated to Ephemeral Rollup validator");
        Ok(())
    }

    /// Increment step counter - each step is a transaction during gameplay
    pub fn take_step(ctx: Context<TakeStep>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        require!(session.is_active, ErrorCode::SessionNotActive);

        session.step_count = session.step_count.saturating_add(1);

        msg!("Step #{} taken by player: {}", session.step_count, session.player);

        emit!(StepTaken {
            player: session.player,
            step_count: session.step_count,
        });

        Ok(())
    }

    /// Periodic checkpoint during gameplay
    pub fn checkpoint_game(ctx: Context<CheckpointGame>) -> Result<()> {
        let session = &ctx.accounts.session;
        require!(session.is_active, ErrorCode::SessionNotActive);

        commit_accounts(
            &ctx.accounts.magic_context,
            vec![&session.to_account_info()],
            &ctx.accounts.magic_program,
            &ctx.accounts.payer.to_account_info(),
        )?;

        msg!(
            "Checkpoint: Player {} | Steps taken: {} | Status: {}",
            session.player,
            session.step_count,
            if session.is_active { "Active" } else { "Ended" }
        );

        emit!(GameCheckpoint {
            player: session.player,
            step_count: session.step_count,
        });

        Ok(())
    }

    /// End game, undelegate, commit, and close session account
    pub fn end_game(ctx: Context<EndGame>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let session_info = session.to_account_info();
        let clock = Clock::get()?;
        
        require!(session.is_active, ErrorCode::SessionNotActive);

        session.is_active = false;
        session.ended_at = Some(clock.unix_timestamp);

        let duration = session.ended_at.unwrap_or(clock.unix_timestamp) - session.started_at;

        msg!("Game ended for player: {}", session.player);
        msg!("Total steps taken: {}", session.step_count);
        msg!("Duration: {} seconds", duration);

        // Undelegate and commit final state
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&session_info],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;

        msg!("Session successfully undelegated and committed");

        emit!(GameEnded {
            player: session.player,
            step_count: session.step_count,
            duration,
        });

        // Close the session account and return lamports to player
        let session_lamports = session_info.lamports();
        **session_info.try_borrow_mut_lamports()? = 0;
        **ctx.accounts.player.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .player
            .to_account_info()
            .lamports()
            .checked_add(session_lamports)
            .unwrap();

        msg!("Session account closed, lamports returned to player");

        Ok(())
    }

    /// View-only: Get current game state
    pub fn get_game_state(ctx: Context<GetGameState>) -> Result<GameStateData> {
        let session = &ctx.accounts.session;
        Ok(GameStateData {
            player: session.player,
            step_count: session.step_count,
            is_active: session.is_active,
            started_at: session.started_at,
            ended_at: session.ended_at,
        })
    }
}

// =================== Constants ===================

pub const SESSION_SEED: &[u8] = b"game_session";

// =================== Account Types ===================

#[account]
pub struct GameSession {
    pub player: Pubkey,           // 32 bytes
    pub step_count: u32,          // 4 bytes
    pub is_active: bool,          // 1 byte
    pub started_at: i64,          // 8 bytes
    pub ended_at: Option<i64>,    // 9 bytes (1 + 8)
    pub bump: u8,                 // 1 byte
}

impl GameSession {
    pub const LEN: usize = 8 + 32 + 4 + 1 + 8 + 9 + 1; // 63 bytes
}

// =================== Account Contexts ===================

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(
        init,
        payer = payer,
        space = GameSession::LEN,
        seeds = [SESSION_SEED, player.key().as_ref()],
        bump
    )]
    pub session: Account<'info, GameSession>,

    pub player: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateGameSession<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        del, // Marks this as the delegatable PDA
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, GameSession>,
}

#[derive(Accounts)]
pub struct TakeStep<'info> {
    #[account(
        mut,
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump,
        has_one = player
    )]
    pub session: Account<'info, GameSession>,

    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct CheckpointGame<'info> {
    #[account(
        mut,
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, GameSession>,

    /// CHECK: Magic context account required by Ephemeral Rollups SDK
    #[account(mut)]
    pub magic_context: AccountInfo<'info>,

    /// CHECK: Ephemeral Rollups validator program account
    pub magic_program: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct EndGame<'info> {
    #[account(
        mut,
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump,
        has_one = player,
        close = player // Close account and return rent to player
    )]
    pub session: Account<'info, GameSession>,

    #[account(mut)]
    pub player: Signer<'info>,

    /// CHECK: Magic context account required by Ephemeral Rollups SDK
    #[account(mut)]
    pub magic_context: AccountInfo<'info>,

    /// CHECK: Ephemeral Rollups validator program account
    pub magic_program: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetGameState<'info> {
    #[account(
        seeds = [SESSION_SEED, session.player.as_ref()],
        bump = session.bump
    )]
    pub session: Account<'info, GameSession>,
}

// =================== Return Types ===================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct GameStateData {
    pub player: Pubkey,
    pub step_count: u32,
    pub is_active: bool,
    pub started_at: i64,
    pub ended_at: Option<i64>,
}

// =================== Errors ===================

#[error_code]
pub enum ErrorCode {
    #[msg("Session is not active")]
    SessionNotActive,

    #[msg("Session already ended")]
    SessionAlreadyEnded,
}

// =================== Events ===================

#[event]
pub struct GameStarted {
    pub player: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct StepTaken {
    pub player: Pubkey,
    pub step_count: u32,
}

#[event]
pub struct GameCheckpoint {
    pub player: Pubkey,
    pub step_count: u32,
}

#[event]
pub struct GameEnded {
    pub player: Pubkey,
    pub step_count: u32,
    pub duration: i64,
}