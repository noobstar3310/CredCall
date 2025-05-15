import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, BN, web3, Idl, Wallet } from '@project-serum/anchor';
import { Buffer } from 'buffer';
import { tryParseTradeCallAccount } from './accountParser';

// Program ID for the Trade Call Platform
export const PROGRAM_ID = 'DeTE4KgCH6uZnu7XxcsR62z4ke7Z4LTRxMFZZPd488GY';

// Define the IDL (Interface Definition Language) structure for our program
export const IDL: Idl = {
  version: '0.1.0',
  name: 'trade_call_platform',
  instructions: [
    {
      name: 'initializePlatform',
      accounts: [
        { name: 'platformState', isMut: true, isSigner: false },
        { name: 'admin', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: 'initializeIdCounter',
      accounts: [
        { name: 'idCounter', isMut: true, isSigner: false },
        { name: 'platformState', isMut: false, isSigner: false },
        { name: 'authority', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: 'createUserVault',
      accounts: [
        { name: 'userVault', isMut: true, isSigner: false },
        { name: 'user', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: 'depositToVault',
      accounts: [
        { name: 'userVault', isMut: true, isSigner: false },
        { name: 'user', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: [{ name: 'amount', type: 'u64' }]
    },
    {
      name: 'createTradeCall',
      accounts: [
        { name: 'tradeCall', isMut: true, isSigner: false },
        { name: 'idCounter', isMut: true, isSigner: false },
        { name: 'authority', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: [
        { name: 'tokenAddress', type: 'publicKey' },
        { name: 'stakeAmount', type: 'u64' }
      ]
    },
    {
      name: 'followTrade',
      accounts: [
        { name: 'tradeCall', isMut: true, isSigner: false },
        { name: 'userVault', isMut: true, isSigner: false },
        { name: 'follower', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: 'resolveTradeCallSuccess',
      accounts: [
        { name: 'tradeCall', isMut: true, isSigner: false },
        { name: 'platformState', isMut: false, isSigner: false },
        { name: 'admin', isMut: true, isSigner: true },
        { name: 'caller', isMut: true, isSigner: false },
        { name: 'userVault', isMut: true, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: 'resolveTradeCallFailureAll',
      accounts: [
        { name: 'tradeCall', isMut: true, isSigner: false },
        { name: 'platformState', isMut: false, isSigner: false },
        { name: 'admin', isMut: true, isSigner: true },
        { name: 'userVault', isMut: true, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: 'claimFollowerShare',
      accounts: [
        { name: 'tradeCall', isMut: true, isSigner: false },
        { name: 'follower', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: 'withdrawFromVault',
      accounts: [
        { name: 'userVault', isMut: true, isSigner: false },
        { name: 'user', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: [{ name: 'amount', type: 'u64' }]
    }
  ],
  accounts: [
    {
      name: 'PlatformState',
      type: {
        kind: 'struct',
        fields: [
          { name: 'admin', type: { array: ['u8', 32] } }
        ]
      }
    },
    {
      name: 'IDCounter',
      type: {
        kind: 'struct',
        fields: [
          { name: 'value', type: 'u64' }
        ]
      }
    },
    {
      name: 'UserVault',
      type: {
        kind: 'struct',
        fields: [
          { name: 'user', type: 'publicKey' },
          { name: 'depositedAmount', type: 'u64' },
          { name: 'reservedFee', type: 'u64' }
        ]
      }
    },
    {
      name: 'TradeCall',
      type: {
        kind: 'struct',
        fields: [
          { name: 'id', type: 'u64' },
          { name: 'tokenAddress', type: 'publicKey' },
          { name: 'stakedAmount', type: 'u64' },
          { name: 'caller', type: 'publicKey' },
          { name: 'timestamp', type: 'i64' },
          { name: 'followers', type: { vec: 'publicKey' } },
          { name: 'status', type: 'u8' },
          { name: 'isDistributed', type: 'bool' },
          { name: 'payoutPerFollower', type: 'u64' },
          { name: 'claimedFollowers', type: { vec: 'publicKey' } },
          { name: 'callerPayout', type: 'u64' }
        ]
      }
    }
  ],
  errors: [
    { code: 6000, name: 'AlreadyFollowing', msg: 'Already following this trade call' },
    { code: 6001, name: 'CannotFollowOwnTrade', msg: 'Cannot follow your own trade call' },
    { code: 6002, name: 'NoDeposit', msg: 'No deposit found in user vault' },
    { code: 6003, name: 'InsufficientDeposit', msg: 'Insufficient deposit to reserve fee' },
    { code: 6004, name: 'TradeCallAlreadyResolved', msg: 'Trade call already resolved' },
    { code: 6005, name: 'TradeCallNotActive', msg: 'Trade call is not active' },
    { code: 6006, name: 'InsufficientFunds', msg: 'Insufficient funds in trade call' },
    { code: 6007, name: 'NoFollowers', msg: 'No followers to distribute funds to' },
    { code: 6008, name: 'NotAuthorized', msg: 'Not authorized' },
    { code: 6009, name: 'NotAFollower', msg: 'Not a follower' },
    { code: 6010, name: 'AlreadyClaimed', msg: 'Already claimed' },
    { code: 6011, name: 'FundsNotDistributed', msg: 'Funds not distributed' },
    { code: 6012, name: 'InsufficientWithdraw', msg: 'Insufficient deposit to withdraw' }
  ]
} as Idl;

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

// Define a wallet interface compatible with Anchor's Wallet
export type WalletAdapter = Wallet;

// Create a program instance with a wallet
export const getProgramInstance = (wallet: WalletAdapter) => {
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
    // @ts-expect-error - we're not signing anything, just need publicKey for the provider
    { publicKey },
    { commitment: 'confirmed' }
  );
  
  // Create a program instance
  const programId = new PublicKey(PROGRAM_ID);
  return new Program(IDL, programId, provider);
};

// Fetch all trade call accounts
export const fetchAllTradeCalls = async () => {
  const connection = getConnection();
  const programId = new PublicKey(PROGRAM_ID);
  
  try {
    console.log('Fetching program accounts from:', programId.toString());
    
    // Helper function to identify account type
    const identifyAccountType = (data: Buffer) => {
      const discriminator = data.slice(0, 8).toString('hex');
      console.log('Account discriminator:', discriminator);
      
      // Log the first 32 bytes for debugging
      console.log('First 32 bytes:', data.slice(0, 32).toString('hex'));
      
      return {
        discriminator,
        dataLength: data.length,
        isTradeCall: data.length > 100, // Trade calls should be the largest accounts
        isUserVault: data.length === 48, // User vaults are typically 48 bytes
        isPlatformState: data.length === 40, // Platform state is typically 40 bytes
        isIdCounter: data.length === 16, // ID counter is typically 16 bytes
      };
    };
    
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
          
          // Identify account type
          const accountType = identifyAccountType(rawData);
          console.log('Account Analysis:', {
            address: tradeCallAddress,
            ...accountType,
            owner: accountInfo.owner.toString(),
            executable: accountInfo.executable,
            lamports: accountInfo.lamports,
            rentEpoch: accountInfo.rentEpoch
          });
          
          // Only process trade call accounts
          if (!accountType.isTradeCall) {
            console.log(`Skipping non-trade-call account: ${tradeCallAddress}`);
            return null;
          }
          
          const parsedData = tryParseTradeCallAccount(rawData);
          
          if (!parsedData) {
            console.warn(`Failed to parse account data for: ${tradeCallAddress}`, {
              dataLength: rawData.length,
              hexDump: rawData.toString('hex')
            });
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
  wallet: WalletAdapter,
  tradeCallAddress: string
): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Create a program instance with the wallet
    const program = getProgramInstance(wallet);
    const tradeCallPubkey = new PublicKey(tradeCallAddress);
    
    // Derive the user vault address
    const [userVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_vault'), wallet.publicKey.toBuffer()],
      program.programId
    );
    
    // Call the followTrade instruction
    const tx = await program.methods
      .followTrade()
      .accounts({
        tradeCall: tradeCallPubkey,
        userVault, // Include the user vault account
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
      } else if (error.message.includes('NoDeposit') || error.message.includes('InsufficientDeposit')) {
        throw new Error('Insufficient funds in your vault. Please deposit SOL first.');
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

// New functions for program interaction

export const initializePlatform = async (wallet: WalletAdapter): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const program = getProgramInstance(wallet);
    const [platformState] = PublicKey.findProgramAddressSync(
      [Buffer.from('platform')],
      program.programId
    );

    const tx = await program.methods
      .initializePlatform()
      .accounts({
        platformState,
        admin: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error initializing platform:', error);
    throw error;
  }
};

export const initializeIdCounter = async (wallet: WalletAdapter): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const program = getProgramInstance(wallet);
    const [idCounter] = PublicKey.findProgramAddressSync(
      [Buffer.from('id_counter')],
      program.programId
    );
    const [platformState] = PublicKey.findProgramAddressSync(
      [Buffer.from('platform')],
      program.programId
    );

    const tx = await program.methods
      .initializeIdCounter()
      .accounts({
        idCounter,
        platformState,
        authority: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error initializing ID counter:', error);
    throw error;
  }
};

export const createUserVault = async (wallet: WalletAdapter): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const program = getProgramInstance(wallet);
    const [userVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_vault'), wallet.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .createUserVault()
      .accounts({
        userVault,
        user: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error creating user vault:', error);
    throw error;
  }
};

export const depositToVault = async (
  wallet: WalletAdapter,
  amount: number
): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const program = getProgramInstance(wallet);
    const [userVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_vault'), wallet.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .depositToVault(new BN(amount))
      .accounts({
        userVault,
        user: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error depositing to vault:', error);
    throw error;
  }
};

export const createTradeCall = async (
  wallet: WalletAdapter,
  tokenAddress: string,
  stakeAmount: number
): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const program = getProgramInstance(wallet);
    const [idCounter] = PublicKey.findProgramAddressSync(
      [Buffer.from('id_counter')],
      program.programId
    );

    // Get current ID counter value
    const idCounterAccount = await program.account.idCounter.fetch(idCounter);
    const [tradeCall] = PublicKey.findProgramAddressSync(
      [Buffer.from('trade_call'), new BN(idCounterAccount.value as number).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );

    const tx = await program.methods
      .createTradeCall(new PublicKey(tokenAddress), new BN(stakeAmount))
      .accounts({
        tradeCall,
        idCounter,
        authority: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error creating trade call:', error);
    throw error;
  }
};

export const resolveTradeCallSuccess = async (
  wallet: WalletAdapter,
  tradeCallAddress: string
): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const program = getProgramInstance(wallet);
    const [platformState] = PublicKey.findProgramAddressSync(
      [Buffer.from('platform')],
      program.programId
    );

    const tradeCallPubkey = new PublicKey(tradeCallAddress);
    const tradeCallAccount = await program.account.tradeCall.fetch(tradeCallPubkey);
    const [userVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_vault'), (tradeCallAccount.caller as PublicKey).toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .resolveTradeCallSuccess()
      .accounts({
        tradeCall: tradeCallPubkey,
        platformState,
        admin: wallet.publicKey,
        caller: tradeCallAccount.caller as PublicKey,
        userVault,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error resolving trade call success:', error);
    throw error;
  }
};

export const resolveTradeCallFailureAll = async (
  wallet: WalletAdapter,
  tradeCallAddress: string
): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const program = getProgramInstance(wallet);
    const [platformState] = PublicKey.findProgramAddressSync(
      [Buffer.from('platform')],
      program.programId
    );
    const [userVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_vault'), wallet.publicKey.toBuffer()],
      program.programId
    );

    const tradeCallPubkey = new PublicKey(tradeCallAddress);

    const tx = await program.methods
      .resolveTradeCallFailureAll()
      .accounts({
        tradeCall: tradeCallPubkey,
        platformState,
        admin: wallet.publicKey,
        userVault,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error resolving trade call failure:', error);
    throw error;
  }
};

export const claimFollowerShare = async (
  wallet: WalletAdapter,
  tradeCallAddress: string
): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const program = getProgramInstance(wallet);
    const tradeCallPubkey = new PublicKey(tradeCallAddress);

    const tx = await program.methods
      .claimFollowerShare()
      .accounts({
        tradeCall: tradeCallPubkey,
        follower: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error claiming follower share:', error);
    throw error;
  }
};

export const withdrawFromVault = async (
  wallet: WalletAdapter,
  amount: number
): Promise<string> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const program = getProgramInstance(wallet);
    const [userVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_vault'), wallet.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .withdrawFromVault(new BN(amount))
      .accounts({
        userVault,
        user: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error withdrawing from vault:', error);
    throw error;
  }
}; 