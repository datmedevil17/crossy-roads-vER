use anchor_lang::prelude::*;

declare_id!("HJqX4nHWvDjBjpsrmuvVtoWhHJiebbDv5y9UMtrkNbAS");

#[program]
pub mod crossy_roads {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
