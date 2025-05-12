import axios from 'axios';

// Moralis API key
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImNlYjNjMTJiLTc2ZmUtNDYxOS1iOTZjLWJiMDYyYWNiNGY2MCIsIm9yZ0lkIjoiNDQ2NDI4IiwidXNlcklkIjoiNDU5MzEyIiwidHlwZUlkIjoiODgwZjFkNGEtZTE0MC00ZDMyLWFlNGYtMzhjMDNmNmUxNDk1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDY5NDYxNzUsImV4cCI6NDkwMjcwNjE3NX0.2MVKUCzFBKKTyiW0x_aykjkNC6pcqgohWi_iTIcCThs";

// Interfaces for token data
export interface TokenPriceData {
  tokenAddress?: string;
  usdPrice?: number;
  usdPrice24h?: number;
  usdPrice24hrUsdChange?: number;
  usdPrice24hrPercentChange?: number;
  nativePrice?: {
    value: string;
    decimals: string;
    name: string;
    symbol: string;
  };
  exchangeName?: string;
  exchangeAddress?: string;
  pairAddress?: string;
  logo?: string;
  name?: string;
  symbol?: string;
  isVerifiedContract?: boolean;
}

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  logoHash?: string;
  thumbnail?: string;
  blockNumber?: string;
  validated?: boolean;
}

/**
 * Fetch token price data from Moralis API
 * @param tokenAddress The token address to fetch price for
 * @param network The network to fetch from (default: mainnet)
 * @returns Token price data
 */
export async function fetchTokenPrice(
  tokenAddress: string,
  network: 'mainnet' | 'devnet' = 'mainnet'
): Promise<TokenPriceData> {
  try {
    const response = await axios.get(
      `https://solana-gateway.moralis.io/token/${network}/${tokenAddress}/price`,
      {
        headers: {
          'accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error fetching token price for ${tokenAddress}:`, error);
    return {};
  }
}

/**
 * Fetch token metadata from Moralis API
 * @param tokenAddress The token address to fetch metadata for
 * @param network The network to fetch from (default: mainnet)
 * @returns Token metadata
 */
export async function fetchTokenMetadata(
  tokenAddress: string,
  network: 'mainnet' | 'devnet' = 'mainnet'
): Promise<TokenMetadata | null> {
  try {
    const response = await axios.get(
      `https://solana-gateway.moralis.io/token/${network}/${tokenAddress}`,
      {
        headers: {
          'accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error fetching token metadata for ${tokenAddress}:`, error);
    return null;
  }
}

/**
 * Get token logo URL from token data or generate a fallback
 * @param tokenData Token price data or metadata
 * @returns URL to the token logo
 */
export function getTokenLogoUrl(tokenData: TokenPriceData | TokenMetadata | null): string {
  if (!tokenData) return 'https://placehold.co/64x64/222/666?text=Token';
  
  // Check for logo in TokenPriceData
  if ('logo' in tokenData && tokenData.logo) {
    return tokenData.logo;
  }
  
  // Check for logo in TokenMetadata
  if ('logo' in tokenData && tokenData.logo) {
    return tokenData.logo;
  }
  
  // Fallback: generate a URL based on address if available
  const address = tokenData.address || (tokenData as TokenPriceData).tokenAddress;
  if (address) {
    return `https://logo.moralis.io/solana-mainnet_${address}_9ed4525833b29588ead980afc8218b5a.webp`;
  }
  
  // Final fallback
  return 'https://placehold.co/64x64/222/666?text=Token';
}

/**
 * Format token price with appropriate precision
 * @param price The price to format
 * @returns Formatted price string
 */
export function formatTokenPrice(price: number | undefined): string {
  if (price === undefined || price === null) return 'N/A';
  
  if (price < 0.000001) {
    return price.toExponential(6);
  } else if (price < 0.01) {
    return price.toFixed(8);
  } else if (price < 1) {
    return price.toFixed(6);
  } else {
    return price.toFixed(2);
  }
}

/**
 * Calculate price change indicator (↑ or ↓)
 */
export function getPriceChangeIndicator(percentChange: number | undefined): string {
  if (percentChange === undefined) return '';
  return percentChange >= 0 ? '↑' : '↓';
}

/**
 * Get CSS class for price change (green for positive, red for negative)
 */
export function getPriceChangeColorClass(percentChange: number | undefined): string {
  if (percentChange === undefined) return 'text-gray-400';
  return percentChange >= 0 ? 'text-green-500' : 'text-red-500';
} 