import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { MegahackContracts } from '../target/types/megahack_contracts';
import { PublicKey, SystemProgram, Keypair } from '@solana/web3.js';

// Flag to control whether we want to resolve a trade call as success or failure
const RESOLVE_AS_SUCCESS = true; // Set to false to test failure case

async function main() {
  // Set up Anchor provider and program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MegahackContracts as Program<MegahackContracts>;

  // Get or create a trade call first
  // Step 1: Reset ID counter 
  const [idCounterPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from('id_counter')],
    program.programId
  );

  try {
    console.log("Resetting ID counter...");
    await program.methods
      .resetIdCounter()
      .accounts({
        idCounter: idCounterPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Step 2: Create a mock token address
    const mockTokenAddress = Keypair.generate().publicKey;
    
    // Step 3: Create a trade call
    console.log("Creating a new trade call...");
    const stakingAmount = new anchor.BN(100_000_000); // 0.1 SOL
    
    const [tradeCallPDA] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from('trade_call'),
        Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]), // Counter value 1 (little endian)
      ],
      program.programId
    );
    
    await program.methods
      .createTradeCall(
        mockTokenAddress,
        stakingAmount
      )
      .accounts({
        tradeCall: tradeCallPDA,
        idCounter: idCounterPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log(`Trade call created with ID #1 and staked amount ${stakingAmount} lamports`);
    console.log(`Trade call address: ${tradeCallPDA.toString()}`);
    
    // Step 4: Create some followers
    // For demo purposes, we'll create 3 followers (using wallets we don't control)
    console.log("\nAdding followers to the trade call...");
    const followers = [
      Keypair.generate(),
      Keypair.generate(),
      Keypair.generate(),
    ];
    
    // In a real scenario, these would be actual users' wallets
    // For demo, we'll just print the public keys but not actually add them as followers
    console.log("Follower public keys:");
    followers.forEach((follower, index) => {
      console.log(`Follower ${index + 1}: ${follower.publicKey.toString()}`);
    });
    
    // Step 5: Resolve the trade call based on the flag
    if (RESOLVE_AS_SUCCESS) {
      console.log("\nResolving trade call as SUCCESS...");
      await program.methods
        .resolveTradeCallSuccess()
        .accounts({
          tradeCall: tradeCallPDA,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log("Trade call resolved as successful");
      console.log("Staked SOL returned to caller");
    } else {
      console.log("\nResolving trade call as FAILURE...");
      await program.methods
        .resolveTradeCallFailure()
        .accounts({
          tradeCall: tradeCallPDA,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log("Trade call resolved as failure");
      
      // Step 6: For failure case, demonstrate fund distribution
      // In a real scenario, each follower would claim their share
      console.log("\nNote: In a real scenario, followers would each call distribute_failed_trade_funds");
      console.log("to claim their share of the staked SOL.");
      console.log("For each follower, the command would look like this:");
      followers.forEach((follower, index) => {
        console.log(`\nFor follower ${index + 1} (${follower.publicKey.toString()}):`);
        console.log(`
  program.methods
    .distributeFailedTradeFunds()
    .accounts({
      tradeCall: ${tradeCallPDA.toString()},
      follower: ${follower.publicKey.toString()},
      systemProgram: SystemProgram.programId,
    })
    .rpc();
        `);
      });
    }
    
    // Step 7: Fetch the updated trade call to verify the status
    const tradeCallData = await program.account.tradeCall.fetch(tradeCallPDA);
    console.log("\nUpdated Trade Call Status:");
    console.log(`ID: ${tradeCallData.id}`);
    console.log(`Token: ${tradeCallData.tokenAddress.toString()}`);
    console.log(`Staked: ${tradeCallData.stakedAmount.toString()} lamports`);
    console.log(`Caller: ${tradeCallData.caller.toString()}`);
    console.log(`Status: ${['Active', 'Successful', 'Failed'][Object.keys(tradeCallData.status).findIndex(key => key !== undefined)]}`);
    console.log(`Follower count: ${tradeCallData.followers.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
); 