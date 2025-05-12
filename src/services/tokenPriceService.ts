import { PublicKey } from '@solana/web3.js';

// This service handles fetching price and market cap data for tokens
// For pum.fun, we would typically use their API

interface TokenPriceData {
  price: number;
  marketCap?: number;
  change24h?: number;
  volume24h?: number;
  symbol?: string;
  name?: string;
}

// Cache token price data to avoid too many requests
const priceCache: Record<string, {data: TokenPriceData, timestamp: number}> = {};
// Cache expiry in milliseconds (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Get token price and market cap data for a Solana token
 * 
 * @param tokenAddress The token's address
 * @returns Price data or null if not available
 */
export async function getTokenPriceData(tokenAddress: string): Promise<TokenPriceData | null> {
  try {
    // Check cache first
    const now = Date.now();
    if (priceCache[tokenAddress] && now - priceCache[tokenAddress].timestamp < CACHE_EXPIRY) {
      return priceCache[tokenAddress].data;
    }

    // For this demo, we'll simulate the API call with mock data
    // In a real implementation, you would call the pum.fun API
    
    // Validate the token address
    try {
      new PublicKey(tokenAddress);
    } catch (e) {
      console.error('Invalid token address:', tokenAddress);
      return null;
    }
    
    // Generate deterministic mock data based on token address
    // In a real app, this would be an API call
    const mockData = await fetchMockPriceData(tokenAddress);
    
    // Cache the data
    priceCache[tokenAddress] = {
      data: mockData,
      timestamp: now
    };
    
    return mockData;
  } catch (error) {
    console.error('Error fetching token price data:', error);
    return null;
  }
}

// For demonstration, generate mock data based on the token address
// This would be replaced with actual API calls to pum.fun or other price services
async function fetchMockPriceData(tokenAddress: string): Promise<TokenPriceData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // For Sol token
  if (tokenAddress === 'So11111111111111111111111111111111111111112') {
    return {
      price: 118.42,
      marketCap: 51_382_762_480,
      change24h: 11.4,
      volume24h: 2_481_628_450,
      symbol: 'SOL',
      name: 'Solana'
    };
  }
  
  // Known token from your example
  if (tokenAddress === 'DNrmDMs2czDaAwgzg2BmvM7Jn5ZqA6VN5huRqCrSpump') {
    return {
      price: 0.0025,
      marketCap: 2_500_000,
      change24h: 5.2,
      volume24h: 320_000,
      symbol: 'PUMP',
      name: 'Pump Token'
    };
  }
  
  // Use hash of address to generate pseudo-random but consistent values
  const hash = tokenAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate price between $0.0001 and $100
  const price = (hash % 1000000) / 10000;
  
  // Generate market cap between $100K and $10M
  const marketCap = 100000 + (hash % 9900000);
  
  // Generate price change between -20% and +20%
  const change24h = ((hash % 400) - 200) / 10;
  
  // Generate 24h volume between $10K and $1M
  const volume24h = 10000 + (hash % 990000);
  
  return {
    price,
    marketCap,
    change24h,
    volume24h,
    symbol: `TKN${hash % 1000}`,
    name: `Token ${hash % 1000}`
  };
}

/**
 * Format price with appropriate precision
 */
export function formatPrice(price: number): string {
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(6)}`;
  }
}

/**
 * Format market cap with appropriate suffix (K, M, B)
 */
export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000) {
    return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
  } else if (marketCap >= 1_000_000) {
    return `$${(marketCap / 1_000_000).toFixed(2)}M`;
  } else if (marketCap >= 1_000) {
    return `$${(marketCap / 1_000).toFixed(2)}K`;
  } else {
    return `$${marketCap.toFixed(0)}`;
  }
}

/**
 * Format price change with appropriate color and sign
 */
export function formatPriceChange(change: number): { text: string, isPositive: boolean } {
  const isPositive = change >= 0;
  const text = isPositive ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  return { text, isPositive };
} 