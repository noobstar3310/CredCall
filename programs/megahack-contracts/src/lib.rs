use anchor_lang::prelude::*;

declare_id!("9MZcapquuog5Bh9wbdv72uaLqirAEqgSZf3LRFZEgREs");

#[program]
pub mod credcalls {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let call_counter = &mut ctx.accounts.call_counter;
        call_counter.counter = 1; // Start from 1
        Ok(())
    }

    pub fn create_trade_call(
        ctx: Context<CreateTradeCall>,
        token_address: Pubkey,
        stake_amount: u64,
    ) -> Result<()> {
        let trade_call = &mut ctx.accounts.trade_call;
        let call_counter = &mut ctx.accounts.call_counter;

        trade_call.call_id = call_counter.counter;
        trade_call.caller = ctx.accounts.authority.key();
        trade_call.token_address = token_address;
        trade_call.stake_amount = stake_amount;
        trade_call.follower_addresses = Vec::new();

        // Increment the call counter for the next call
        call_counter.counter += 1;

        Ok(())
    }

    pub fn follow_trade(ctx: Context<FollowTrade>, call_id: u64) -> Result<()> {
        let trade_call = &mut ctx.accounts.trade_call;

        // Verify this is the correct call ID
        require!(trade_call.call_id == call_id, ErrorCode::InvalidCallId);

        // Check if the follower is not the caller
        require!(
            ctx.accounts.authority.key() != trade_call.caller,
            ErrorCode::SelfFollow
        );

        // Check if the follower is not already in the followers list
        for addr in &trade_call.follower_addresses {
            require!(
                *addr != ctx.accounts.authority.key(),
                ErrorCode::AlreadyFollowing
            );
        }

        // Add the follower to the trade call
        trade_call
            .follower_addresses
            .push(ctx.accounts.authority.key());

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 // discriminator + counter
    )]
    pub call_counter: Account<'info, CallCounter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(token_address: Pubkey, stake_amount: u64)]
pub struct CreateTradeCall<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 32 + 32 + 8 + 4 + 32 * 50 // Allow up to 50 followers
    )]
    pub trade_call: Account<'info, TradeCall>,
    #[account(mut)]
    pub call_counter: Account<'info, CallCounter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(call_id: u64)]
pub struct FollowTrade<'info> {
    #[account(mut)]
    pub trade_call: Account<'info, TradeCall>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct CallCounter {
    pub counter: u64,
}

#[account]
pub struct TradeCall {
    pub call_id: u64,
    pub caller: Pubkey,
    pub token_address: Pubkey,
    pub stake_amount: u64,
    pub follower_addresses: Vec<Pubkey>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid call ID")]
    InvalidCallId,
    #[msg("Cannot follow your own trade call")]
    SelfFollow,
    #[msg("Already following this trade call")]
    AlreadyFollowing,
}
