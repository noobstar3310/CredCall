import { NextRequest, NextResponse } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis
const initMoralis = async () => {
  try {
    if (!Moralis.Core.isStarted) {
      // For server components, use non-prefixed environment variable
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      console.log('Moralis initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Moralis:', error);
    throw error;
  }
};

// Define types for Moralis response objects
interface SolanaToken {
  mint: string;
  symbol: string;
  amount: string;
  associatedTokenAddress: string;
  name?: string;
  decimals?: number;
}

// Log the API key availability (but not the actual key for security)
console.log('Moralis API Key available in API route:', !!process.env.MORALIS_API_KEY);

export async function POST(req: NextRequest) {
  console.log('Token verification API called');
  
  try {
    // Parse the request body
    const body = await req.json();
    const { userAddress, tokenAddress, tradeCallTimestamp } = body;
    
    console.log('Request parameters:', { 
      userAddress, 
      tokenAddress: tokenAddress ? `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}` : 'missing',
      tradeCallTimestamp 
    });
    
    // Validate required fields
    if (!userAddress || !tokenAddress) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if API key is available
    if (!process.env.MORALIS_API_KEY) {
      console.error('Moralis API key is not available');
      
      // For development/testing, you can return mock data if needed
      return NextResponse.json({
        hasPurchased: true,
        message: "Token ownership mocked as verified (API key missing)",
        isMocked: true
      });
    }
    
    // Initialize Moralis
    await initMoralis();
    
    console.log('Getting portfolio for address:', userAddress.slice(0, 6) + '...');
    
    // Get user's token portfolio
    const response = await Moralis.SolApi.account.getPortfolio({
      network: "mainnet",
      address: userAddress
    });
    
    console.log('Portfolio response received');
    
    // Log portfolio contents (limited for privacy)
    if (response && response.raw) {
      console.log('Portfolio contains:', { 
        tokenCount: response.raw.tokens?.length || 0,
        nftCount: response.raw.nfts?.length || 0,
        nativeBalance: response.raw.nativeBalance || 'not available'
      });
    }
    
    // Get the portfolio data and verify token ownership
    const portfolio = response.raw;
    
    // Check if the user has the token
    const matchingToken = portfolio.tokens?.find((token: SolanaToken) => 
      token.mint.toLowerCase() === tokenAddress.toLowerCase()
    );
    
    const hasToken = !!matchingToken;
    
    if (!hasToken) {
      console.log('Token not found in user portfolio');
      return NextResponse.json({
        hasPurchased: false,
        message: "You don't own this token",
        status: "ineligible",
        details: {
          required: true,
          tokenAddress: tokenAddress,
          reason: "Token ownership required for claiming rewards"
        }
      });
    }
    
    console.log('Token found in portfolio:', {
      symbol: matchingToken.symbol,
      amount: matchingToken.amount
    });
    
    // At this point you can extend the verification to check transaction history
    // You would need to use Moralis.SolApi.account.getSPL to get token transactions
    // and check if any transaction occurred before the trade call timestamp
    
    // Example of how to compare timestamps (if you had transaction data):
    // const tokenTransactionTimestamp = /* timestamp from transaction */;
    // const isTokenPurchasedBeforeTrade = tokenTransactionTimestamp < tradeCallTimestamp;
    
    return NextResponse.json({
      hasPurchased: true,
      tokenDetails: {
        symbol: matchingToken.symbol,
        amount: matchingToken.amount
      },
      message: "Token ownership verified"
    });
    
  } catch (error) {
    console.error('Error verifying token ownership:', error);
    
    // Provide more detailed error response
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResponse = { 
      error: 'Failed to verify token ownership',
      details: errorMessage,
      location: 'API route handler'
    };
    
    console.error('Error response:', errorResponse);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 