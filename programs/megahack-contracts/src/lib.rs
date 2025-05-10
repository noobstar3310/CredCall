use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

// Replace with your actual program ID if you have one, or leave as is for Playground to generate one
declare_id!("5TjA3JAi62fy2K5nU9Cfjqe1Zf2VbV7q3p6FUWgSXtKf");

#[program]
pub mod trade_call_platform {
    use super::*;

    // Initialize the platform with admin
    pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()> {
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.admin = ctx.accounts.admin.key();

        msg!("Platform initialized with admin: {}", platform_state.admin);
        Ok(())
    }

    // Initialize the global ID counter
    pub fn initialize_id_counter(ctx: Context<InitializeIDCounter>) -> Result<()> {
        let id_counter = &mut ctx.accounts.id_counter;
        id_counter.value = 1; // Start IDs at 1
        msg!("ID counter initialized with value: {}", id_counter.value);
        Ok(())
    }

    // Reset the ID counter (can be called even if already initialized)
    pub fn reset_id_counter(ctx: Context<ResetIDCounter>) -> Result<()> {
        // Verify the caller is the admin if platform_state is provided
        if let Some(platform_state) = &ctx.accounts.platform_state {
            require!(
                platform_state.admin == ctx.accounts.authority.key(),
                TradeCallError::NotAuthorized
            );
        }

        let id_counter = &mut ctx.accounts.id_counter;
        id_counter.value = 1; // Reset to 1
        msg!("ID counter reset to value: {}", id_counter.value);
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
        trade_call.status = 0; // Active status

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

        // Check if trade call is still active
        require!(
            trade_call.status == 0, // Active status
            TradeCallError::TradeCallNotActive
        );

        // Add follower to the list
        trade_call.followers.push(follower);

        Ok(())
    }

    // Mark a trade call as successful and return funds to the caller (admin only)
    pub fn resolve_trade_call_success(ctx: Context<AdminResolveTradeCall>) -> Result<()> {
        let trade_call = &mut ctx.accounts.trade_call;
        let platform_state = &ctx.accounts.platform_state;

        // Ensure only the admin can resolve the trade call
        require!(
            platform_state.admin == ctx.accounts.admin.key(),
            TradeCallError::NotAuthorized
        );

        // Ensure the trade call is still active
        require!(
            trade_call.status == 0, // Active status
            TradeCallError::TradeCallAlreadyResolved
        );

        // Get staked amount and caller
        let staked_amount = trade_call.staked_amount;
        let caller = trade_call.caller;

        // Check if trade call account has enough balance
        require!(
            **trade_call.to_account_info().lamports.borrow() >= staked_amount,
            TradeCallError::InsufficientFunds
        );

        // Mark trade call as successful
        trade_call.status = 1; // Successful status

        // Transfer SOL back to the caller
        **trade_call.to_account_info().try_borrow_mut_lamports()? -= staked_amount;
        **ctx
            .accounts
            .caller
            .to_account_info()
            .try_borrow_mut_lamports()? += staked_amount;

        msg!(
            "Trade Call #{} marked as successful by admin. {} SOL returned to caller {}",
            trade_call.id,
            staked_amount,
            caller
        );

        Ok(())
    }

    // Distribute funds to all followers in one shot
    pub fn resolve_trade_call_failure_all(ctx: Context<AdminResolveTradeCallAll>) -> Result<()> {
        let trade_call = &mut ctx.accounts.trade_call;
        let platform_state = &ctx.accounts.platform_state;

        // Ensure only the admin can resolve the trade call
        require!(
            platform_state.admin == ctx.accounts.admin.key(),
            TradeCallError::NotAuthorized
        );

        // Ensure the trade call is still active
        require!(
            trade_call.status == 0, // Active status
            TradeCallError::TradeCallAlreadyResolved
        );

        // Get staked amount
        let staked_amount = trade_call.staked_amount;

        // Ensure there are followers to distribute to
        let followers = &trade_call.followers;
        let follower_count = followers.len();

        require!(follower_count > 0, TradeCallError::NoFollowers);

        // Mark trade call as failed
        trade_call.status = 2; // Failed status

        // Individual payout amount (equal split among followers)
        let payout_per_follower = staked_amount / follower_count as u64;
        
        // Set the remaining transaction size based on number of followers
        // For a single transaction, we'll calculate this in the program account directly
        // This might not be possible for large numbers of followers due to computation limits
        let mut remaining_payout = staked_amount;

        // Here we store how much SOL each follower will receive when they claim it
        // We don't actually transfer the SOL here since that would require passing all follower accounts
        trade_call.payout_per_follower = payout_per_follower;
        
        // Set the status to "paid" but funds remain in the account for claiming
        trade_call.is_distributed = true;
        
        msg!(
            "Trade Call #{} marked as failed by admin. Set distribution amount of {} SOL for each of {} followers. Total staked: {} SOL.",
            trade_call.id,
            payout_per_follower,
            follower_count,
            staked_amount
        );

        Ok(())
    }
    
    // Allow a follower to claim their share after resolveTradeCallFailureAll was called
    pub fn claim_follower_share(ctx: Context<ClaimFollowerShare>) -> Result<()> {
        let trade_call = &mut ctx.accounts.trade_call;
        let follower = ctx.accounts.follower.key();
        
        // Trade call must be in failed state and distributed flag must be set
        require!(
            trade_call.status == 2 && trade_call.is_distributed,
            TradeCallError::FundsNotDistributed
        );
        
        // Verify the follower is in the list
        let mut is_follower = false;
        for existing_follower in &trade_call.followers {
            if *existing_follower == follower {
                is_follower = true;
                break;
            }
        }
        require!(is_follower, TradeCallError::NotAFollower);
        
        // Check if the follower has already claimed (scope the mutable borrow)
        {
            let claimed_followers = &mut trade_call.claimed_followers;
            for claimed_follower in claimed_followers.iter() {
                require!(
                    *claimed_follower != follower,
                    TradeCallError::AlreadyClaimed
                );
            }
        } // mutable borrow ends here
        
        // Now you can safely access other fields/methods on trade_call
        let payout_amount = trade_call.payout_per_follower;
        require!(
            **trade_call.to_account_info().lamports.borrow() >= payout_amount,
            TradeCallError::InsufficientFunds
        );
        
        // Transfer funds to the follower
        **trade_call.to_account_info().try_borrow_mut_lamports()? -= payout_amount;
        **ctx
            .accounts
            .follower
            .to_account_info()
            .try_borrow_mut_lamports()? += payout_amount;
            
        // Mark this follower as having claimed
        trade_call.claimed_followers.push(follower);
        
        msg!(
            "Follower {} claimed {} SOL from Trade Call #{}.",
            follower,
            payout_amount,
            trade_call.id
        );
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32, // discriminator + admin pubkey
        seeds = [b"platform"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
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

    // Make platform_state optional for testing in Playground
    #[account(
        seeds = [b"platform"],
        bump,
    )]
    pub platform_state: Option<Account<'info, PlatformState>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResetIDCounter<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 8, // discriminator + u64 value
        seeds = [b"id_counter"],
        bump
    )]
    pub id_counter: Account<'info, IDCounter>,

    #[account(
        seeds = [b"platform"],
        bump,
    )]
    pub platform_state: Option<Account<'info, PlatformState>>,

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
        space = 8 + 8 + 32 + 8 + 32 + 8 + 4 + (32 * 10) + 1, // Added 1 for status field
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

#[derive(Accounts)]
pub struct AdminResolveTradeCall<'info> {
    #[account(mut)]
    pub trade_call: Account<'info, TradeCall>,

    #[account(
        seeds = [b"platform"],
        bump,
    )]
    pub platform_state: Account<'info, PlatformState>,

    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: This account will receive funds and doesn't need to sign
    #[account(mut, 
        constraint = caller.key() == trade_call.caller
    )]
    pub caller: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminResolveTradeCallAll<'info> {
    #[account(mut)]
    pub trade_call: Account<'info, TradeCall>,

    #[account(
        seeds = [b"platform"],
        bump,
    )]
    pub platform_state: Account<'info, PlatformState>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimFollowerShare<'info> {
    #[account(mut)]
    pub trade_call: Account<'info, TradeCall>,

    #[account(mut)]
    pub follower: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct PlatformState {
    pub admin: Pubkey,
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
    pub status: u8,             // Status: 0=Active, 1=Successful, 2=Failed
    pub is_distributed: bool,   // Flag to indicate if the payout has been distributed globally
    pub payout_per_follower: u64, // Amount each follower receives
    pub claimed_followers: Vec<Pubkey>, // List of followers who have already claimed
}

#[error_code]
pub enum TradeCallError {
    #[msg("Already following this trade call")]
    AlreadyFollowing,

    #[msg("Cannot follow your own trade call")]
    CannotFollowOwnTrade,

    #[msg("Numeric overflow")]
    NumericOverflow,

    #[msg("Only the admin can perform this action")]
    NotAuthorized,

    #[msg("Trade call has already been resolved")]
    TradeCallAlreadyResolved,

    #[msg("Trade call is not active")]
    TradeCallNotActive,

    #[msg("Insufficient funds in the trade call account")]
    InsufficientFunds,

    #[msg("No followers to distribute funds to")]
    NoFollowers,

    #[msg("Invalid follower index provided")]
    InvalidFollowerIndex,

    #[msg("Provided follower account doesn't match the follower at the given index")]
    FollowerMismatch,
    
    #[msg("You are not a follower of this trade call")]
    NotAFollower,
    
    #[msg("Funds have not been distributed for claiming yet")]
    FundsNotDistributed,
    
    #[msg("You have already claimed your share")]
    AlreadyClaimed,
}
