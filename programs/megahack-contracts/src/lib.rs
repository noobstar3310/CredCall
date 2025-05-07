use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

// Replace with your actual program ID if you have one, or leave as is for Playground to generate one
declare_id!("BfT8VnqCmZfE5FKdiuxCqNQQmv4dzZonAV8WUQ3U2Gmq");

#[program]
pub mod trade_call_platform {
    use super::*;

    // Initialize the global ID counter
    pub fn initialize_id_counter(ctx: Context<InitializeIDCounter>) -> Result<()> {
        let id_counter = &mut ctx.accounts.id_counter;
        id_counter.value = 1; // Start IDs at 1
        msg!("ID counter initialized with value: {}", id_counter.value);
        Ok(())
    }

    // Create a new trade call with the current ID and stake SOL
    pub fn create_trade_call(
        ctx: Context<CreateTradeCall>,
        token_address: Pubkey,
        stake_amount: u64,
    ) -> Result<()> {
        // Transfer SOL from caller to trade call account
        let ix = system_instruction::transfer(
            &ctx.accounts.authority.key(),
            &ctx.accounts.trade_call.key(),
            stake_amount,
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.trade_call.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Get the current timestamp
        let clock = Clock::get()?;

        // Set the trade call data
        let id_counter = &mut ctx.accounts.id_counter;
        let trade_call = &mut ctx.accounts.trade_call;

        trade_call.id = id_counter.value;
        trade_call.token_address = token_address;
        trade_call.staked_amount = stake_amount;
        trade_call.caller = ctx.accounts.authority.key();
        trade_call.timestamp = clock.unix_timestamp;
        trade_call.followers = Vec::new();

        msg!(
            "Created Trade Call #{} for token {}",
            trade_call.id,
            token_address
        );

        // Increment the ID counter for the next trade call
        id_counter.value += 1;

        Ok(())
    }

    // Allow users to follow a trade call
    pub fn follow_trade(ctx: Context<FollowTrade>) -> Result<()> {
        let trade_call = &mut ctx.accounts.trade_call;
        let follower = ctx.accounts.follower.key();

        // Check if already following
        for existing_follower in &trade_call.followers {
            require!(
                *existing_follower != follower,
                TradeCallError::AlreadyFollowing
            );
        }

        // Check if follower is the caller
        require!(
            trade_call.caller != follower,
            TradeCallError::CannotFollowOwnTrade
        );

        // Add follower to the list
        trade_call.followers.push(follower);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeIDCounter<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8, // discriminator + u64 value
        seeds = [b"id_counter"],
        bump
    )]
    pub id_counter: Account<'info, IDCounter>,

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
        space = 8 + 8 + 32 + 8 + 32 + 8 + 4 + (32 * 10), // Allow up to 10 followers to reduce size
        seeds = [b"trade_call", id_counter.value.to_le_bytes().as_ref()],
        bump
    )]
    pub trade_call: Account<'info, TradeCall>,

    #[account(
        mut,
        seeds = [b"id_counter"],
        bump
    )]
    pub id_counter: Account<'info, IDCounter>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FollowTrade<'info> {
    #[account(mut)]
    pub trade_call: Account<'info, TradeCall>,

    #[account(mut)]
    pub follower: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct IDCounter {
    pub value: u64,
}

#[account]
pub struct TradeCall {
    pub id: u64,                // Unique ID for the trade call
    pub token_address: Pubkey,  // Token being called
    pub staked_amount: u64,     // Amount of SOL staked
    pub caller: Pubkey,         // Wallet address of the caller
    pub timestamp: i64,         // When the trade call was created
    pub followers: Vec<Pubkey>, // List of wallets following this call
}

#[error_code]
pub enum TradeCallError {
    #[msg("Already following this trade call")]
    AlreadyFollowing,

    #[msg("Cannot follow your own trade call")]
    CannotFollowOwnTrade,
}
