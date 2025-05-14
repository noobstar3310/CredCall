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
  
  // Debug logging for initial data
  console.log('Account Data Analysis:', {
    totalLength: data.length,
    discriminator: data.slice(0, ACCOUNT_DISCRIMINATOR_SIZE).toString('hex'),
    fullData: data.toString('hex'),
    isBuffer: Buffer.isBuffer(accountData),
    isUint8Array: accountData instanceof Uint8Array,
    type: typeof accountData
  });
  
  // Validate minimum data length
  if (data.length < ACCOUNT_DISCRIMINATOR_SIZE) {
    console.error('Account data too short:', {
      length: data.length,
      expectedMinimum: ACCOUNT_DISCRIMINATOR_SIZE,
      hexDump: data.toString('hex')
    });
    return null;
  }
  
  // Initialize offset at the start of the function
  let offset = ACCOUNT_DISCRIMINATOR_SIZE;
  
  try {
    // Debug logging for each field
    const logField = (name: string, value: any, size: number) => {
      console.log(`Parsing ${name}:`, {
        offset,
        size,
        value: value?.toString(),
        hex: data.slice(offset, offset + size).toString('hex'),
        remainingBytes: data.length - offset
      });
    };
    
    // Parse id (u64) - 8 bytes
    if (offset + 8 > data.length) {
      throw new Error(`Buffer overflow while reading id. Offset: ${offset}, Data length: ${data.length}`);
    }
    const id = data.readBigUInt64LE(offset);
    logField('id', id, 8);
    offset += 8;
    
    // Parse tokenAddress (PublicKey) - 32 bytes
    if (offset + 32 > data.length) {
      throw new Error(`Buffer overflow while reading tokenAddress. Offset: ${offset}, Data length: ${data.length}`);
    }
    const tokenAddress = new PublicKey(data.slice(offset, offset + 32));
    logField('tokenAddress', tokenAddress.toString(), 32);
    offset += 32;
    
    // Parse stakedAmount (u64) - 8 bytes
    if (offset + 8 > data.length) {
      throw new Error(`Buffer overflow while reading stakedAmount. Offset: ${offset}, Data length: ${data.length}`);
    }
    const stakedAmount = data.readBigUInt64LE(offset);
    logField('stakedAmount', stakedAmount, 8);
    offset += 8;
    
    // Parse caller (PublicKey) - 32 bytes
    const caller = new PublicKey(data.slice(offset, offset + 32));
    logField('caller', caller.toString(), 32);
    offset += 32;
    
    // Parse timestamp (i64) - 8 bytes
    if (offset + 8 > data.length) {
      throw new Error(`Buffer overflow while reading timestamp. Offset: ${offset}, Data length: ${data.length}`);
    }
    const timestamp = data.readBigInt64LE(offset);
    logField('timestamp', timestamp, 8);
    offset += 8;
    
    // Parse followers vector (Vec<PublicKey>) 
    // First 4 bytes is the length of the vector
    if (offset + 4 > data.length) {
      throw new Error(`Buffer overflow while reading followers count. Offset: ${offset}, Data length: ${data.length}`);
    }
    const followersCount = data.readUInt32LE(offset);
    logField('followersCount', followersCount, 4);
    offset += 4;
    
    // Read each follower PublicKey (32 bytes each)
    const followers: PublicKey[] = [];
    for (let i = 0; i < followersCount; i++) {
      if (offset + 32 > data.length) {
        throw new Error(`Buffer overflow while reading follower ${i}. Offset: ${offset}, Data length: ${data.length}`);
      }
      const follower = new PublicKey(data.slice(offset, offset + 32));
      logField(`follower ${i}`, follower.toString(), 32);
      followers.push(follower);
      offset += 32;
    }
    
    // Parse status (u8) - 1 byte
    if (offset + 1 > data.length) {
      throw new Error(`Buffer overflow while reading status. Offset: ${offset}, Data length: ${data.length}`);
    }
    const status = data.readUInt8(offset);
    logField('status', status, 1);
    offset += 1;
    
    // Parse isDistributed (bool) - 1 byte
    if (offset + 1 > data.length) {
      throw new Error(`Buffer overflow while reading isDistributed. Offset: ${offset}, Data length: ${data.length}`);
    }
    const isDistributed = data.readUInt8(offset) === 1;
    logField('isDistributed', isDistributed, 1);
    offset += 1;
    
    // Parse payoutPerFollower (u64) - 8 bytes
    if (offset + 8 > data.length) {
      throw new Error(`Buffer overflow while reading payoutPerFollower. Offset: ${offset}, Data length: ${data.length}`);
    }
    const payoutPerFollower = data.readBigUInt64LE(offset);
    logField('payoutPerFollower', payoutPerFollower, 8);
    offset += 8;
    
    // Parse claimedFollowers vector (Vec<PublicKey>)
    // First 4 bytes is the length of the vector
    if (offset + 4 > data.length) {
      throw new Error(`Buffer overflow while reading claimedFollowers count. Offset: ${offset}, Data length: ${data.length}`);
    }
    const claimedFollowersCount = data.readUInt32LE(offset);
    logField('claimedFollowersCount', claimedFollowersCount, 4);
    offset += 4;
    
    // Read each claimed follower PublicKey (32 bytes each)
    const claimedFollowers: PublicKey[] = [];
    for (let i = 0; i < claimedFollowersCount; i++) {
      if (offset + 32 > data.length) {
        throw new Error(`Buffer overflow while reading claimed follower ${i}. Offset: ${offset}, Data length: ${data.length}`);
      }
      const claimedFollower = new PublicKey(data.slice(offset, offset + 32));
      logField(`claimedFollower ${i}`, claimedFollower.toString(), 32);
      claimedFollowers.push(claimedFollower);
      offset += 32;
    }
    
    // Parse callerPayout (u64) - 8 bytes
    if (offset + 8 > data.length) {
      throw new Error(`Buffer overflow while reading callerPayout. Offset: ${offset}, Data length: ${data.length}`);
    }
    const callerPayout = data.readBigUInt64LE(offset);
    logField('callerPayout', callerPayout, 8);
    
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
      claimedFollowers: claimedFollowers.map(f => f.toString()),
      callerPayout: callerPayout.toString()
    };
  } catch (error) {
    console.error('Error parsing TradeCall account data:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        dataLength: data.length,
        offset: offset,
        hexDump: data.toString('hex'),
        discriminator: data.slice(0, ACCOUNT_DISCRIMINATOR_SIZE).toString('hex')
      });
    }
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
    
    // Debug logging for input data
    console.log('Input Data Analysis:', {
      type: typeof accountData,
      isBuffer: Buffer.isBuffer(accountData),
      isUint8Array: accountData instanceof Uint8Array,
      length: data.length,
      hexDump: data.toString('hex')
    });
    
    // First check if the data is long enough to be a TradeCall account
    if (data.length < ACCOUNT_DISCRIMINATOR_SIZE) {
      console.error('Account data too short to be a TradeCall account:', {
        length: data.length,
        expectedMinimum: ACCOUNT_DISCRIMINATOR_SIZE,
        hexDump: data.toString('hex')
      });
      return null;
    }
    
    return parseTradeCallAccount(data);
  } catch (error) {
    console.error('Failed to parse account data:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        dataLength: accountData instanceof Buffer ? accountData.length : 
                   accountData instanceof Uint8Array ? accountData.length :
                   typeof accountData === 'string' ? accountData.length / 2 : 'unknown',
        type: typeof accountData
      });
    }
    return null;
  }
} 