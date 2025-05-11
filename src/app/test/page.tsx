"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";

// Example pump.fun tokens (just for quick access examples)
const EXAMPLE_TOKENS = {
  PUMP: "DNrmDMs2czDaAwgzg2BmvM7Jn5ZqA6VN5huRqCrSpump",
  PUMPFUN: "GkyPYa7NnCFbduLknCfBfP7p8564X1VZhwZYJ6CZpump",
  CHILLHOUSE: "GkyPYa7NnCFbduLknCfBfP7p8564X1VZhwZYJ6CZpump",
};

const MORALIS_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImNlYjNjMTJiLTc2ZmUtNDYxOS1iOTZjLWJiMDYyYWNiNGY2MCIsIm9yZ0lkIjoiNDQ2NDI4IiwidXNlcklkIjoiNDU5MzEyIiwidHlwZUlkIjoiODgwZjFkNGEtZTE0MC00ZDMyLWFlNGYtMzhjMDNmNmUxNDk1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDY5NDYxNzUsImV4cCI6NDkwMjcwNjE3NX0.2MVKUCzFBKKTyiW0x_aykjkNC6pcqgohWi_iTIcCThs";

export default function TestPage() {
  const [tokenData, setTokenData] = useState<any>(null);
  const [tokenMetadata, setTokenMetadata] = useState<any>(null);
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [inputAddress, setInputAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenHistory, setTokenHistory] = useState<string[]>([]);

  const fetchTokenInfo = async (address: string) => {
    if (!address) return;

    setLoading(true);
    setError(null);
    setTokenData(null);
    setTokenMetadata(null);

    try {
      // Fetch token price
      const priceResponse = await axios.get(
        `https://solana-gateway.moralis.io/token/mainnet/${address}/price`,
        {
          headers: {
            accept: "application/json",
            "X-API-Key": MORALIS_API_KEY,
          },
        }
      );

      setTokenData(priceResponse.data);

      // Add to history if not already there
      if (!tokenHistory.includes(address)) {
        setTokenHistory((prev) => [address, ...prev].slice(0, 5)); // Keep last 5 tokens
      }

      // Fetch token metadata (includes logo)
      try {
        const metadataResponse = await axios.get(
          `https://solana-gateway.moralis.io/token/mainnet/${address}`,
          {
            headers: {
              accept: "application/json",
              "X-API-Key": MORALIS_API_KEY,
            },
          }
        );

        setTokenMetadata(metadataResponse.data);
      } catch (metadataErr) {
        console.error("Error fetching token metadata:", metadataErr);
        // Continue even if metadata fails, we still have price data
      }
    } catch (err: any) {
      console.error("Error fetching token info:", err);
      setError(`Failed to fetch token info: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Get logo URL from API data
  const getTokenLogoUrl = () => {
    // First check if logo is directly in the price data response
    if (tokenData?.logo) {
      return tokenData.logo;
    }

    // Then check if it's in the metadata
    if (tokenMetadata?.logo) {
      return tokenMetadata.logo;
    }

    // Fallback URL based on token address
    return `https://placehold.co/64x64/222/666?text=Token`;
  };

  // Get token name and symbol
  const getTokenName = () => {
    if (tokenData?.name) {
      return tokenData.name;
    }

    if (tokenMetadata?.name) {
      return tokenMetadata.name;
    }

    return "Unknown Token";
  };

  const getTokenSymbol = () => {
    if (tokenData?.symbol) {
      return tokenData.symbol;
    }

    if (tokenMetadata?.symbol) {
      return tokenMetadata.symbol;
    }

    return "???";
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAddress.trim()) {
      setTokenAddress(inputAddress.trim());
      fetchTokenInfo(inputAddress.trim());
    }
  };

  // Load token
  const loadToken = (address: string) => {
    setInputAddress(address);
    setTokenAddress(address);
    fetchTokenInfo(address);
  };

  // Format price with appropriate precision
  const formatPrice = (price: number) => {
    if (price === undefined || price === null) return "N/A";

    if (price < 0.000001) {
      return price.toExponential(6);
    } else if (price < 0.01) {
      return price.toFixed(8);
    } else if (price < 1) {
      return price.toFixed(6);
    } else {
      return price.toFixed(2);
    }
  };

  // Calculate price change color and indicator
  const getPriceChangeColor = () => {
    if (!tokenData?.usdPrice24hrPercentChange) return "text-gray-400";

    return tokenData.usdPrice24hrPercentChange >= 0
      ? "text-green-400"
      : "text-red-400";
  };

  const getPriceChangeIndicator = () => {
    if (!tokenData?.usdPrice24hrPercentChange) return "";

    return tokenData.usdPrice24hrPercentChange >= 0 ? "↑" : "↓";
  };

  return (
    <div className="p-8 bg-gray-900 text-gray-200 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-100">
        Solana Token Explorer
      </h1>

      {/* Token Address Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            placeholder="Enter Solana token address"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "Fetch Token"}
          </button>
        </div>
      </form>

      {/* Example Tokens */}
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-2">Example Tokens:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EXAMPLE_TOKENS).map(([name, address]) => (
            <button
              key={address}
              onClick={() => loadToken(address)}
              className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
              disabled={loading}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Recent history */}
      {tokenHistory.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">Recent Tokens:</p>
          <div className="flex flex-wrap gap-2">
            {tokenHistory.map((address) => (
              <button
                key={address}
                onClick={() => loadToken(address)}
                className="px-3 py-1 text-xs bg-gray-800/50 text-gray-400 rounded hover:bg-gray-700 transition font-mono"
                disabled={loading}
              >
                {address.substring(0, 6)}...
                {address.substring(address.length - 6)}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center p-12">
          <div className="animate-pulse text-blue-400">
            Loading token data...
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded mb-4 text-red-200">
          {error}
        </div>
      )}

      {tokenData && (
        <div className="space-y-6">
          {/* Token Info Card */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="rounded-lg overflow-hidden border border-gray-700 bg-gray-800 p-1 min-w-16">
                <img
                  src={getTokenLogoUrl()}
                  alt={`${getTokenName()} Logo`}
                  width={64}
                  height={64}
                  className="rounded-full"
                  onError={(e) => {
                    // If image fails to load, use a fallback
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/64x64/222/666?text=Token";
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-100">
                    {getTokenName()}
                  </h2>
                  <span className="px-2 py-0.5 bg-gray-700 rounded text-sm text-gray-300">
                    {getTokenSymbol()}
                  </span>
                </div>
                <p className="text-blue-400 mb-2">
                  <a
                    href={`https://solscan.io/token/${tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    View on Solscan
                  </a>
                </p>
                <p className="text-xs text-gray-400 font-mono break-all">
                  {tokenAddress}
                </p>
              </div>
            </div>

            {tokenData.usdPrice !== undefined && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Current Price</p>
                  <p className="text-2xl font-bold text-gray-100">
                    ${formatPrice(tokenData.usdPrice)} USD
                  </p>

                  {tokenData.usdPrice24hrPercentChange !== undefined && (
                    <p className={`text-sm mt-1 ${getPriceChangeColor()}`}>
                      {getPriceChangeIndicator()}{" "}
                      {Math.abs(tokenData.usdPrice24hrPercentChange).toFixed(2)}
                      % (24h)
                    </p>
                  )}
                </div>

                {tokenData.exchangeName && (
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Exchange</p>
                    <p className="text-xl font-medium text-gray-100">
                      {tokenData.exchangeName}
                    </p>
                    {tokenData.pairAddress && (
                      <p className="text-xs text-blue-400 mt-1">
                        <a
                          href={`https://solscan.io/account/${tokenData.pairAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          View Trading Pair
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Advanced Data Section */}
          <div>
            <details className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <summary className="text-xl font-semibold text-gray-100 cursor-pointer">
                Raw Token Data
              </summary>
              <div className="mt-4 space-y-4">
                <pre className="bg-gray-900 text-gray-300 p-4 rounded overflow-auto max-h-[40vh] border border-gray-700 text-xs">
                  {JSON.stringify(tokenData, null, 2)}
                </pre>

                {tokenMetadata && (
                  <pre className="bg-gray-900 text-gray-300 p-4 rounded overflow-auto max-h-[40vh] border border-gray-700 text-xs">
                    {JSON.stringify(tokenMetadata, null, 2)}
                  </pre>
                )}
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
