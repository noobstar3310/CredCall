import Moralis from 'moralis';

// Initialize Moralis with the API key from environment variable
const initMoralis = async () => {
  if (!Moralis.Core.isStarted) {
    await Moralis.start({
      apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
    });
  }
};

// Get user's token portfolio from Moralis
export const getUserPortfolio = async (address: string) => {
  try {
    await initMoralis();
    
    const response = await Moralis.SolApi.account.getPortfolio({
      network: "mainnet",
      address: address
    });
    
    return response.raw;
  } catch (error) {
    console.error('Error fetching user portfolio from Moralis:', error);
    throw error;
  }
};

// Check if user has a specific token
export const hasUserPurchasedToken = async (userAddress: string, tokenAddress: string, tradeCallTimestamp: number) => {
  try {
    const portfolio = await getUserPortfolio(userAddress);
    
    // Check if the user has the token in their portfolio
    const hasToken = portfolio.tokens.some((token: any) => 
      token.mint.toLowerCase() === tokenAddress.toLowerCase()
    );
    
    if (!hasToken) {
      return {
        hasPurchased: false,
        message: "You don't own this token"
      };
    }
    
    // For future implementation: check token transaction history to verify purchase time
    // This would require additional API calls to get transaction history
    // and verify that the purchase happened before or around the trade call time
    
    return {
      hasPurchased: true,
      message: "Token ownership verified"
    };
  } catch (error) {
    console.error('Error verifying token purchase:', error);
    return {
      hasPurchased: false,
      message: "Error verifying token ownership: " + (error instanceof Error ? error.message : String(error))
    };
  }
};

// For future implementation: Get token transaction history
export const getTokenTransactions = async (userAddress: string, tokenAddress: string) => {
  try {
    await initMoralis();
    
    // This is a placeholder for future implementation
    // You would need to use Moralis.SolApi to get token transfer history
    // and check timestamps against the trade call timestamp
    
    return [];
  } catch (error) {
    console.error('Error fetching token transactions:', error);
    throw error;
  }
}; 