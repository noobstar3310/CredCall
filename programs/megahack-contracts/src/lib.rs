use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("4SBb22ZVVGbocVSiadxDoGbNV4u67y4r44okZjVPB7Q3");

#[program]
pub mod trade_call_platform {
    use super::*;

    pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()> {
        ctx.accounts.platform_state.admin = ctx.accounts.admin.key();
        Ok(())
    }

    pub fn initialize_id_counter(ctx: Context<InitializeIDCounter>) -> Result<()> {
        ctx.accounts.id_counter.value = 1;
        Ok(())
    }

    pub fn create_user_vault(ctx: Context<CreateUserVault>) -> Result<()> {
        let vault = &mut ctx.accounts.user_vault;
        vault.user = ctx.accounts.user.key();
        vault.deposited_amount = 0;
        vault.reserved_fee = 0;
        Ok(())
    }

    pub fn deposit_to_vault(ctx: Context<DepositToVault>, amount: u64) -> Result<()> {
        let ix = system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.user_vault.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.user_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        ctx.accounts.user_vault.deposited_amount += amount;
        Ok(())
    }

    pub fn create_trade_call(
        ctx: Context<CreateTradeCall>,
        token_address: Pubkey,
        stake_amount: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let id_counter = &mut ctx.accounts.id_counter;
        let trade_call = &mut ctx.accounts.trade_call;

        trade_call.id = id_counter.value;
        trade_call.token_address = token_address;
        trade_call.staked_amount = stake_amount;
        trade_call.caller = ctx.accounts.authority.key();
        trade_call.timestamp = clock.unix_timestamp;
        trade_call.followers = Vec::new();
        trade_call.status = 0;
        trade_call.is_distributed = false;
        trade_call.payout_per_follower = 0;
        trade_call.claimed_followers = Vec::new();

        id_counter.value += 1;

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

        Ok(())
    }

    pub fn follow_trade(ctx: Context<FollowTrade>) -> Result<()> {
        let user_vault = &mut ctx.accounts.user_vault;
        let trade_call = &mut ctx.accounts.trade_call;
        let follower = ctx.accounts.follower.key();

        require!(user_vault.deposited_amount > 0, TradeCallError::NoDeposit);
        require!(trade_call.caller != follower, TradeCallError::CannotFollowOwnTrade);
        require!(trade_call.status == 0, TradeCallError::TradeCallNotActive);

        for existing_follower in &trade_call.followers {
            require!(*existing_follower != follower, TradeCallError::AlreadyFollowing);
        }

        let reserved_fee = 1_000_000;
        require!(user_vault.deposited_amount >= reserved_fee, TradeCallError::InsufficientDeposit);

        user_vault.deposited_amount -= reserved_fee;
        user_vault.reserved_fee += reserved_fee;

        trade_call.followers.push(follower);

        Ok(())
    }

    pub fn resolve_trade_call_success(ctx: Context<AdminResolveTradeCall>) -> Result<()> {
        let trade_call = &mut ctx.accounts.trade_call;
        let user_vault = &mut ctx.accounts.user_vault;

        require!(ctx.accounts.platform_state.admin == ctx.accounts.admin.key(), TradeCallError::NotAuthorized);
        require!(trade_call.status == 0, TradeCallError::TradeCallAlreadyResolved);

        let staked_amount = trade_call.staked_amount;
        require!(**trade_call.to_account_info().lamports.borrow() >= staked_amount, TradeCallError::InsufficientFunds);

        trade_call.status = 1;

        let half_fee = user_vault.reserved_fee / 2;
        **user_vault.to_account_info().try_borrow_mut_lamports()? -= half_fee;
        **ctx.accounts.caller.try_borrow_mut_lamports()? += half_fee;

        user_vault.reserved_fee = 0;

        **trade_call.to_account_info().try_borrow_mut_lamports()? -= staked_amount;
        **ctx.accounts.caller.try_borrow_mut_lamports()? += staked_amount;

        Ok(())
    }

    pub fn resolve_trade_call_failure_all(ctx: Context<AdminResolveTradeCallAll>) -> Result<()> {
        let trade_call = &mut ctx.accounts.trade_call;
        let user_vault = &mut ctx.accounts.user_vault;

        require!(ctx.accounts.platform_state.admin == ctx.accounts.admin.key(), TradeCallError::NotAuthorized);
        require!(trade_call.status == 0, TradeCallError::TradeCallAlreadyResolved);

        let staked_amount = trade_call.staked_amount;
        let followers = &trade_call.followers;
        let follower_count = followers.len();

        require!(follower_count > 0, TradeCallError::NoFollowers);

        let payout_per_follower = staked_amount / follower_count as u64;

        trade_call.status = 2;
        trade_call.payout_per_follower = payout_per_follower;
        trade_call.is_distributed = true;

        user_vault.deposited_amount += user_vault.reserved_fee;
        user_vault.reserved_fee = 0;

        Ok(())
    }

    pub fn claim_follower_share(ctx: Context<ClaimFollowerShare>) -> Result<()> {
        let trade_call = &mut ctx.accounts.trade_call;
        let follower = ctx.accounts.follower.key();

        require!(trade_call.status == 2 && trade_call.is_distributed, TradeCallError::FundsNotDistributed);

        require!(trade_call.followers.contains(&follower), TradeCallError::NotAFollower);
        require!(!trade_call.claimed_followers.contains(&follower), TradeCallError::AlreadyClaimed);

        let payout_amount = trade_call.payout_per_follower;
        require!(**trade_call.to_account_info().lamports.borrow() >= payout_amount, TradeCallError::InsufficientFunds);

        **trade_call.to_account_info().try_borrow_mut_lamports()? -= payout_amount;
        **ctx.accounts.follower.to_account_info().try_borrow_mut_lamports()? += payout_amount;

        trade_call.claimed_followers.push(follower);

        Ok(())
    }

    pub fn withdraw_from_vault(ctx: Context<WithdrawFromVault>, amount: u64) -> Result<()> {
        let user_vault = &mut ctx.accounts.user_vault;
        let user = &mut ctx.accounts.user;

        require!(user_vault.deposited_amount >= amount, TradeCallError::InsufficientDeposit);

        **user_vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **user.to_account_info().try_borrow_mut_lamports()? += amount;

        user_vault.deposited_amount -= amount;

        Ok(())
    }
}

//
// Accounts
//

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(init, payer = admin, space = 8 + 32, seeds = [b"platform"], bump)]
    pub platform_state: Account<'info, PlatformState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeIDCounter<'info> {
    #[account(init, payer = authority, space = 8 + 8, seeds = [b"id_counter"], bump)]
    pub id_counter: Account<'info, IDCounter>,
    #[account(seeds = [b"platform"], bump)]
    pub platform_state: Option<Account<'info, PlatformState>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUserVault<'info> {
    #[account(init_if_needed, payer = user, space = 8 + 32 + 8 + 8, seeds = [b"user_vault", user.key().as_ref()], bump)]
    pub user_vault: Account<'info, UserVault>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositToVault<'info> {
    #[account(mut, seeds = [b"user_vault", user.key().as_ref()], bump)]
    pub user_vault: Account<'info, UserVault>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(token_address: Pubkey, stake_amount: u64)]
pub struct CreateTradeCall<'info> {
    #[account(init, payer = authority, space = 8 + 8 + 32 + 8 + 32 + 8 + 4 + (32 * 10) + 1 + 8 + 4 + (32 * 10) + 1, seeds = [b"trade_call", id_counter.value.to_le_bytes().as_ref()], bump)]
    pub trade_call: Account<'info, TradeCall>,
    #[account(mut, seeds = [b"id_counter"], bump)]
    pub id_counter: Account<'info, IDCounter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FollowTrade<'info> {
    #[account(mut)]
    pub trade_call: Account<'info, TradeCall>,
    #[account(mut, seeds = [b"user_vault", follower.key().as_ref()], bump)]
    pub user_vault: Account<'info, UserVault>,
    #[account(mut)]
    pub follower: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminResolveTradeCall<'info> {
    #[account(mut)]
    pub trade_call: Account<'info, TradeCall>,
    #[account(seeds = [b"platform"], bump)]
    pub platform_state: Account<'info, PlatformState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, constraint = caller.key() == trade_call.caller)]
    pub caller: AccountInfo<'info>,
    #[account(mut, seeds = [b"user_vault", caller.key().as_ref()], bump)]
    pub user_vault: Account<'info, UserVault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminResolveTradeCallAll<'info> {
    #[account(mut)]
    pub trade_call: Account<'info, TradeCall>,
    #[account(seeds = [b"platform"], bump)]
    pub platform_state: Account<'info, PlatformState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, seeds = [b"user_vault", admin.key().as_ref()], bump)]
    pub user_vault: Account<'info, UserVault>,
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

#[derive(Accounts)]
pub struct WithdrawFromVault<'info> {
    #[account(mut, seeds = [b"user_vault", user.key().as_ref()], bump)]
    pub user_vault: Account<'info, UserVault>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

//
// State Definitions
//

#[account]
pub struct PlatformState {
    pub admin: Pubkey,
}

#[account]
pub struct IDCounter {
    pub value: u64,
}

#[account]
pub struct UserVault {
    pub user: Pubkey,
    pub deposited_amount: u64,
    pub reserved_fee: u64,
}

#[account]
pub struct TradeCall {
    pub id: u64,
    pub token_address: Pubkey,
    pub staked_amount: u64,
    pub caller: Pubkey,
    pub timestamp: i64,
    pub followers: Vec<Pubkey>,
    pub status: u8,
    pub is_distributed: bool,
    pub payout_per_follower: u64,
    pub claimed_followers: Vec<Pubkey>,
}

//
// Error Codes
//

#[error_code]
pub enum TradeCallError {
    #[msg("Already following this trade call")]
    AlreadyFollowing,
    #[msg("Cannot follow your own trade call")]
    CannotFollowOwnTrade,
    #[msg("No deposit found in user vault")]
    NoDeposit,
    #[msg("Insufficient deposit to reserve fee")]
    InsufficientDeposit,
    #[msg("Trade call already resolved")]
    TradeCallAlreadyResolved,
    #[msg("Trade call is not active")]
    TradeCallNotActive,
    #[msg("Insufficient funds in trade call")]
    InsufficientFunds,
    #[msg("No followers to distribute funds to")]
    NoFollowers,
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Not a follower")]
    NotAFollower,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Funds not distributed")]
    FundsNotDistributed,
    #[msg("Insufficient deposit to withdraw")]
    InsufficientWithdraw,
}
