/**
 * Test script for Moralis API
 * 
 * Instructions:
 * 1. Create a .env.local file with MORALIS_API_KEY
 * 2. Run this script with: node -r dotenv/config src/scripts/test-moralis.js
 */

// Import libraries
const Moralis = require('moralis');

// Example wallet address to check
const TEST_WALLET = "kXB7FfzdrfZpAZEW3TZcp8a8CwQbsowa6BdfAHZ4gVs";
const TEST_TOKEN = "5ykhiPoUTcoqpieSnQ6w2tPbCERJawe9kAM6MuZJMcbP"; // Optional: token to look for

async function main() {
  try {
    console.log('Starting Moralis API test...');
    console.log('API Key present:', !!process.env.MORALIS_API_KEY);
    
    // Initialize Moralis
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY
    });
    
    console.log('Moralis initialized successfully');
    console.log(`Fetching portfolio for address: ${TEST_WALLET.slice(0, 6)}...`);
    
    // Get wallet portfolio
    const response = await Moralis.SolApi.account.getPortfolio({
      network: "mainnet",
      address: TEST_WALLET
    });
    
    console.log('Portfolio retrieved successfully');
    
    // Log native balance
    console.log('Native balance:', response.raw.nativeBalance);
    
    // Log token count
    console.log('Tokens:', response.raw.tokens.length);
    
    // Log tokens (limited info for privacy)
    response.raw.tokens.forEach((token, index) => {
      console.log(`Token ${index + 1}:`, {
        mint: token.mint.slice(0, 6) + '...' + token.mint.slice(-4),
        symbol: token.symbol,
        amount: token.amount,
        decimals: token.decimals
      });
      
      // Check if this is the test token we're looking for
      if (TEST_TOKEN && token.mint.toLowerCase() === TEST_TOKEN.toLowerCase()) {
        console.log('✅ TEST TOKEN FOUND:', token.symbol, token.amount);
      }
    });
    
    // Log NFTs
    console.log('NFTs:', response.raw.nfts.length);
    
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Error running Moralis test:', error);
  }
}

// Run the main function
main().then(() => console.log('Done')); 