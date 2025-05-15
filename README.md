# CredCall: A Trustless Token Call Platform

CredCall is a decentralized platform built on Solana that holds Key Opinion Leaders (KOLs) accountable for their token calls through on-chain verification, staking, and performance tracking.

## Problem Statement

The cryptocurrency space is filled with influencers and "experts" making token calls without accountability. Many of these calls lead to pump-and-dump schemes where retail investors are left holding the bag. There's no reliable way to:

1. Verify an influencer's track record
2. Ensure they have "skin in the game"
3. Hold them accountable for failed calls

## Description

CredCall solves these problems by creating a trustless platform where:

- KOLs must stake SOL to make token calls public
- All calls are tracked and verified on-chain
- Stake is slashed for failed calls and redistributed to followers
- Successful callers build reputation and earn rewards

The platform uses Solana's smart contract capabilities to create a transparent, immutable record of all calls, their performance, and the distribution of rewards or penalties.

## User Flow

### For Token Callers (KOLs)

1. Connect your Solana wallet
2. Create a user vault and deposit SOL
3. Make a token call by:
   - Specifying the token address
   - Staking SOL (higher stakes = higher visibility)
4. If the call is successful (>10% pump), gain reputation and retrieve your stake
5. If the call fails badly (>50% dump), your stake is slashed and distributed to followers

### For Followers

1. Connect your Solana wallet
2. Browse active token calls
3. Follow calls that interest you (a small fee is reserved)
4. If a call is successful, the caller earns rewards
5. If a call fails, you can claim a share of the slashed stake

## Tech Stack

### Frontend
- Next.js 15.3 - React framework
- React 19.0
- TailwindCSS 4.0 - UI styling
- TypeScript - Type safety

### Blockchain Integration
- Solana Web3.js - Core Solana interaction
- @project-serum/anchor - Solana program framework
- Solana Wallet Adapter - Wallet connection

### APIs
- Moralis API - Token price tracking

### Smart Contract (Solana Program)
- Written in Rust (Anchor framework)
- Deployed on Solana Devnet at `DeTE4KgCH6uZnu7XxcsR62z4ke7Z4LTRxMFZZPd488GY`

## Program Accounts Structure

1. **PlatformState** - Stores platform admin and configuration
2. **IDCounter** - Maintains sequential IDs for trade calls
3. **UserVault** - Stores user deposits and reserved fees
4. **TradeCall** - Contains all data about a specific token call:
   - Token address
   - Staked amount
   - Caller's address
   - Timestamp
   - Followers
   - Status (Active/Successful/Failed)
   - Payout information



## License

[MIT](LICENSE)
