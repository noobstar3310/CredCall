import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';

// This is a simplified account parser for Anchor accounts
// In a production app, you would use Anchor's proper account deserialization
// This is mainly to extract the trade call account data for display purposes

// Account discriminator is the first 8 bytes of the account data
const ACCOUNT_DISCRIMINATOR_SIZE = 8;

// Parse a TradeCall account from raw account data
export function parseTradeCallAccount(accountData: Buffer | Uint8Array): any {
  // Make sure we're working with a Buffer
  const data = Buffer.isBuffer(accountData) 
    ? accountData 
    : Buffer.from(accountData);
  
  try {
    // Skip account discriminator (first 8 bytes)
    let offset = ACCOUNT_DISCRIMINATOR_SIZE;
    
    // Parse id (u64) - 8 bytes
    const id = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Parse tokenAddress (PublicKey) - 32 bytes
    const tokenAddress = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Parse stakedAmount (u64) - 8 bytes
    const stakedAmount = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Parse caller (PublicKey) - 32 bytes
    const caller = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Parse timestamp (i64) - 8 bytes
    const timestamp = data.readBigInt64LE(offset);
    offset += 8;
    
    // Parse followers vector (Vec<PublicKey>) 
    // First 4 bytes is the length of the vector
    const followersCount = data.readUInt32LE(offset);
    offset += 4;
    
    // Read each follower PublicKey (32 bytes each)
    const followers: PublicKey[] = [];
    for (let i = 0; i < followersCount; i++) {
      const follower = new PublicKey(data.slice(offset, offset + 32));
      followers.push(follower);
      offset += 32;
    }
    
    // Parse status (u8) - 1 byte
    const status = data.readUInt8(offset);
    offset += 1;
    
    // Parse isDistributed (bool) - 1 byte
    const isDistributed = data.readUInt8(offset) === 1;
    offset += 1;
    
    // Parse payoutPerFollower (u64) - 8 bytes
    const payoutPerFollower = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Parse claimedFollowers vector (Vec<PublicKey>)
    // First 4 bytes is the length of the vector
    const claimedFollowersCount = data.readUInt32LE(offset);
    offset += 4;
    
    // Read each claimed follower PublicKey (32 bytes each)
    const claimedFollowers: PublicKey[] = [];
    for (let i = 0; i < claimedFollowersCount; i++) {
      const claimedFollower = new PublicKey(data.slice(offset, offset + 32));
      claimedFollowers.push(claimedFollower);
      offset += 32;
    }
    
    // Return the parsed account data
    return {
      id: id.toString(),
      tokenAddress: tokenAddress.toString(),
      stakedAmount: stakedAmount.toString(),
      caller: caller.toString(),
      timestamp: timestamp.toString(),
      followers: followers.map(f => f.toString()),
      status,
      isDistributed,
      payoutPerFollower: payoutPerFollower.toString(),
      claimedFollowers: claimedFollowers.map(f => f.toString())
    };
  } catch (error) {
    console.error('Error parsing TradeCall account data:', error);
    return null;
  }
}

// Try to parse account data that might be a TradeCall
export function tryParseTradeCallAccount(accountData: Buffer | Uint8Array | string): any {
  try {
    // If the input is a hex string, convert it to a Buffer
    const data = typeof accountData === 'string'
      ? Buffer.from(accountData, 'hex')
      : accountData;
    
    return parseTradeCallAccount(data);
  } catch (error) {
    console.error('Failed to parse account data:', error);
    return null;
  }
} 