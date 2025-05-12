import { Connection, PublicKey, clusterApiUrl, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN, web3 } from '@project-serum/anchor';
import { Buffer } from 'buffer';
import { tryParseTradeCallAccount } from './accountParser';

// Program ID for the Trade Call Platform
export const PROGRAM_ID = '8WA4Qq9NSTNkgAFBHchEYR66SnBbrvruCQC3wZHLoed2';

// Define the IDL (Interface Definition Language) structure for our program
export const IDL = {
  version: '0.1.0',
  name: 'trade_call_platform',
  instructions: [
    {
      name: 'followTrade',
      accounts: [
        {
          name: 'tradeCall',
          isMut: true,
          isSigner: false
        },
        {
          name: 'follower',
          isMut: true,
          isSigner: true
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: 'tradeCall',
      type: {
        kind: 'struct',
        fields: [
          { name: 'id', type: 'u64' },
          { name: 'tokenAddress', type: 'publicKey' },
          { name: 'stakedAmount', type: 'u64' },
          { name: 'caller', type: 'publicKey' },
          { name: 'timestamp', type: 'i64' },
          { name: 'followers', type: { vector: 'publicKey' } },
          { name: 'status', type: 'u8' },
          { name: 'isDistributed', type: 'bool' },
          { name: 'payoutPerFollower', type: 'u64' },
          { name: 'claimedFollowers', type: { vector: 'publicKey' } }
        ]
      }
    }
  ]
};

// Status mapping
export const TRADE_CALL_STATUSES = {
  0: 'Active',
  1: 'Successful',
  2: 'Failed'
};

// Create a connection to Solana devnet
export const getConnection = () => {
  return new Connection(clusterApiUrl('devnet'), 'confirmed');
};

// Create a program instance with a wallet
export const getProgramInstance = (wallet: any) => {
  const connection = getConnection();
  // Create a provider - with a wallet that can sign transactions
  const provider = new AnchorProvider(
    connection,
    wallet,
    { commitment: 'confirmed' }
  );
  
  // Create a program instance
  const programId = new PublicKey(PROGRAM_ID);
  return new Program(IDL, programId, provider);
};

// Create a program instance with just a public key (read-only)
export const getReadOnlyProgramInstance = (publicKey: PublicKey) => {
  const connection = getConnection();
  // Create a provider with just a public key (can't sign transactions)
  const provider = new AnchorProvider(
    connection,
    // @ts-ignore - we're not signing anything, just need publicKey for the provider
    { publicKey },
    { commitment: 'confirmed' }
  );
  
  // Create a program instance
  const programId = new PublicKey(PROGRAM_ID);
  return new Program(IDL, programId, provider);
};

// Fetch all trade call accounts
export const fetchAllTradeCalls = async (publicKey: PublicKey) => {
  const connection = getConnection();
  const programId = new PublicKey(PROGRAM_ID);
  
  try {
    console.log('Fetching program accounts from:', programId.toString());
    
    // Fetch all program accounts with optimized settings
    const allTradeCallAccounts = await connection.getProgramAccounts(programId, {
      commitment: 'confirmed',
      filters: [],
      dataSlice: { offset: 0, length: 0 }, // We'll fetch full data separately for better performance
    });
    
    console.log('Program accounts found:', allTradeCallAccounts.length);
    
    // Process the accounts in batches to avoid overwhelming the RPC
    const BATCH_SIZE = 5;
    const processedTradeCalls = [];
    
    for (let i = 0; i < allTradeCallAccounts.length; i += BATCH_SIZE) {
      const batch = allTradeCallAccounts.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (account) => {
        try {
          const tradeCallAddress = account.pubkey.toString();
          const accountInfo = await connection.getAccountInfo(account.pubkey);
          
          if (!accountInfo || !accountInfo.data) {
            console.warn(`No data found for account: ${tradeCallAddress}`);
            return null;
          }
          
          const rawData = Buffer.from(accountInfo.data);
          const parsedData = tryParseTradeCallAccount(rawData);
          
          if (!parsedData) {
            console.warn(`Failed to parse account data for: ${tradeCallAddress}`);
            return null;
          }
          
          return {
            address: tradeCallAddress,
            data: rawData.toString('hex'),
            parsed: parsedData
          };
        } catch (decodeError) {
          console.error('Error processing account:', decodeError);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      processedTradeCalls.push(...batchResults.filter(result => result !== null));
      
      // Small delay between batches to be nice to the RPC
      if (i + BATCH_SIZE < allTradeCallAccounts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Successfully processed ${processedTradeCalls.length} trade calls`);
    return processedTradeCalls;
  } catch (error) {
    console.error('Error fetching trade calls:', error);
    throw error;
  }
};

// Fetch a specific trade call by address
export const fetchTradeCall = async (tradeCallAddress: string) => {
  const connection = getConnection();
  
  try {
    const pubkey = new PublicKey(tradeCallAddress);
    const accountInfo = await connection.getAccountInfo(pubkey);
    
    if (!accountInfo || !accountInfo.data) {
      throw new Error('Trade call account not found');
    }
    
    const rawData = Buffer.from(accountInfo.data);
    const parsedData = tryParseTradeCallAccount(rawData);
    
    return {
      address: tradeCallAddress,
      data: rawData.toString('hex'),
      parsed: parsedData
    };
  } catch (error) {
    console.error(`Error fetching trade call ${tradeCallAddress}:`, error);
    throw error;
  }
};

// Follow a trade call
export const followTradeCall = async (
  wallet: any,
  tradeCallAddress: string
): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Create a program instance with the wallet
    const program = getProgramInstance(wallet);
    const tradeCallPubkey = new PublicKey(tradeCallAddress);
    
    // Call the followTrade instruction
    const tx = await program.methods
      .followTrade()
      .accounts({
        tradeCall: tradeCallPubkey,
        follower: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();
    
    console.log('Follow transaction sent:', tx);
    return tx;
  } catch (error) {
    console.error('Error following trade call:', error);
    // Extract the error message from Anchor error
    if (error instanceof Error) {
      if (error.message.includes('AlreadyFollowing')) {
        throw new Error('You are already following this trade call');
      } else if (error.message.includes('CannotFollowOwnTrade')) {
        throw new Error('You cannot follow your own trade call');
      } else if (error.message.includes('TradeCallNotActive')) {
        throw new Error('This trade call is no longer active');
      }
    }
    throw error;
  }
};

// Helper function to format lamports to SOL
export const lamportsToSol = (lamports: number | string) => {
  const value = typeof lamports === 'string' ? parseInt(lamports) : lamports;
  return value / web3.LAMPORTS_PER_SOL;
};

// Helper function to format timestamp to date
export const timestampToDate = (timestamp: number | string) => {
  const value = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  return new Date(value * 1000).toLocaleString();
};

// Helper function to shorten an address
export const shortenAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}; 