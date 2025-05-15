"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as SolanaProgramService from "@/services/solanaProgram";
import * as TokenService from "@/services/tokenService";
import dynamic from 'next/dynamic';
import { TokenPriceData } from "@/services/tokenService";

// Dynamically import the WalletMultiButton component with SSR disabled
const WalletMultiButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return { default: WalletMultiButton };
  },
  { ssr: false }
);

// Interface for combined trade call and token data
interface TradeCallData {
  address: string;
  parsed: {
    id: string;
    tokenAddress: string;
    stakedAmount: string;
    caller: string;
    timestamp: string;
    followers: string[];
    status: number;
    isDistributed: boolean;
    payoutPerFollower: string;
    claimedFollowers: string[];
  };
  tokenData?: TokenPriceData;
  callerName?: string;
}

export default function CallsPage() {
  const { publicKey, connected } = useWallet();
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOption, setSortOption] = useState("recent");
  const [tradeCalls, setTradeCalls] = useState<TradeCallData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTokenData, setLoadingTokenData] = useState(false);
  const [tradeCallsLoaded, setTradeCallsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch trade calls from Solana program
  const fetchTradeCalls = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all trade calls from the program
      const tradeCallAccounts = await SolanaProgramService.fetchAllTradeCalls(
        publicKey
      );
      console.log("Trade call accounts:", tradeCallAccounts);

      // Filter out any accounts that couldn't be parsed
      const validTradeCalls = tradeCallAccounts.filter(
        (account) => account?.parsed
      );

      if (validTradeCalls.length === 0) {
        console.warn("No valid trade calls found");
      }

      // Generate caller names and set initial data
      const initialTradeCalls = validTradeCalls.map((tradeCall) => ({
        ...tradeCall,
        callerName: generateCallerName(tradeCall.parsed.caller),
      }));

      setTradeCalls(initialTradeCalls);
      setTradeCallsLoaded(true);
    } catch (err) {
      console.error("Error fetching trade call data:", err);
      setError("Failed to fetch trade calls. See console for details.");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  // Function to fetch token data for all trade calls
  const fetchTokenData = useCallback(async () => {
    if (tradeCalls.length === 0) return;

    setLoadingTokenData(true);

    try {
      // Process trade calls in batches to avoid rate limiting
      const BATCH_SIZE = 3;
      const enrichedTradeCalls = [...tradeCalls];

      for (let i = 0; i < tradeCalls.length; i += BATCH_SIZE) {
        const batch = tradeCalls.slice(i, i + BATCH_SIZE);

        // Create an array of promises for each trade call in the batch
        const batchPromises = batch.map(async (tradeCall, batchIndex) => {
          const index = i + batchIndex;
          try {
            // For each trade call, get the token price data
            const tokenAddress = tradeCall.parsed.tokenAddress;
            const tokenData = await TokenService.fetchTokenPrice(tokenAddress);

            // Update the trade call with token data
            enrichedTradeCalls[index] = {
              ...enrichedTradeCalls[index],
              tokenData,
            };
          } catch (err) {
            console.error(
              `Error fetching token data for ${tradeCall.parsed.tokenAddress}:`,
              err
            );
          }
        });

        // Wait for all promises in the batch to resolve
        await Promise.all(batchPromises);

        // Update state after each batch so the UI updates progressively
        setTradeCalls([...enrichedTradeCalls]);

        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < tradeCalls.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } catch (err) {
      console.error("Error fetching token data:", err);
    } finally {
      setLoadingTokenData(false);
    }
  }, [tradeCalls]);

  // Fetch trade calls only on initial mount when wallet is connected
  useEffect(() => {
    if (connected && publicKey && !tradeCallsLoaded) {
      fetchTradeCalls();
    } else if (!connected) {
      // Clear data when wallet disconnects
      setTradeCalls([]);
      setTradeCallsLoaded(false);
    }
  }, [connected, publicKey, fetchTradeCalls, tradeCallsLoaded]);

  // Function to refresh all data
  const handleRefresh = async () => {
    setTradeCallsLoaded(false); // Reset the loaded state
    await fetchTradeCalls();
    if (tradeCalls.length > 0) {
      await fetchTokenData();
    }
  };

  // Generate a caller name based on wallet address
  const generateCallerName = (address: string) => {
    const prefixes = [
      "Crypto",
      "Moon",
      "Whale",
      "Alpha",
      "Degen",
      "Token",
      "Sol",
    ];
    const suffixes = [
      "Hunter",
      "Trader",
      "Master",
      "Guru",
      "King",
      "Alert",
      "Pro",
    ];

    // Use the address to generate a consistent name
    const hash = address
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const prefix = prefixes[hash % prefixes.length];
    const suffix = suffixes[(hash >> 4) % suffixes.length];

    return `${prefix}${suffix}`;
  };

  // Format timestamp to date
  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  // Format SOL amount
  const formatSol = (lamports: string) => {
    return (
      <span>
        {(parseInt(lamports) / 1000000000).toFixed(2)}{" "} SOL
        <Image src="/Solana_logo.png" alt="SOL" width={16} height={16} className="inline-block ml-1 mb-1" />
      </span>
    );
  };

  // Map numeric status to string
  const getStatusString = (status: number): string => {
    const statusMap: Record<number, string> = {
      0: "active",
      1: "completed",
      2: "slashed",
    };
    return statusMap[status] || "unknown";
  };

  // Filter calls based on active filter
  const filteredCalls = tradeCalls.filter((call) => {
    if (activeFilter === "all") return true;
    return getStatusString(call.parsed.status) === activeFilter;
  });

  // Sort calls based on sort option
  const sortedCalls = [...filteredCalls].sort((a, b) => {
    if (sortOption === "recent") {
      return parseInt(b.parsed.timestamp) - parseInt(a.parsed.timestamp);
    } else if (sortOption === "stake") {
      return parseInt(b.parsed.stakedAmount) - parseInt(a.parsed.stakedAmount);
    } else if (sortOption === "followers") {
      return b.parsed.followers.length - a.parsed.followers.length;
    } else if (sortOption === "performance") {
      const aPerf = a.tokenData?.usdPrice24hrPercentChange || 0;
      const bPerf = b.tokenData?.usdPrice24hrPercentChange || 0;
      return bPerf - aPerf;
    }
    return 0;
  });

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "slashed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Helper function to get performance color
  const getPerformanceColor = (percentChange: number | undefined) => {
    if (!percentChange) return "text-gray-600 dark:text-gray-400";
    if (percentChange > 0) return "text-green-600 dark:text-green-400";
    if (percentChange < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Token Calls</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Browse all token calls made on CredCall. Filter by status and sort by
          different metrics.
        </p>

        {!connected ? (
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-xl text-center mb-8">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Please connect your wallet to view trade calls.
            </p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        ) : loading ? (
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-xl text-center mb-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                Loading trade calls...
              </p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-200 mb-6">
                {error}
              </div>
            )}

            {/* Filters and Sort Options */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 text-sm rounded-full ${
                    activeFilter === "all"
                      ? "bg-foreground text-background"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                  onClick={() => setActiveFilter("all")}
                >
                  All
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded-full ${
                    activeFilter === "active"
                      ? "bg-foreground text-background"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                  onClick={() => setActiveFilter("active")}
                >
                  Active
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded-full ${
                    activeFilter === "completed"
                      ? "bg-foreground text-background"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                  onClick={() => setActiveFilter("completed")}
                >
                  Completed
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded-full ${
                    activeFilter === "slashed"
                      ? "bg-foreground text-background"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                  onClick={() => setActiveFilter("slashed")}
                >
                  Slashed
                </button>
              </div>

              <div className="flex items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                  Sort by:
                </span>
                <select
                  className="bg-gray-100 dark:bg-gray-800 border-none rounded-md text-sm py-1 px-2 focus:ring-0"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="recent">Most Recent</option>
                  <option value="stake">Highest Stake</option>
                  <option value="followers">Most Followers</option>
                  <option value="performance">Best Performance</option>
                </select>
              </div>
            </div>

            {/* Refresh button */}
            <div className="mb-6 flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading || loadingTokenData}
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2 ${
                  loading || loadingTokenData
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {(loading || loadingTokenData) && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Refresh Data
              </button>

              {loadingTokenData && (
                <span className="text-xs text-gray-500">
                  Loading token data...
                </span>
              )}

              <div className="ml-auto text-sm text-gray-500">
                {tradeCalls.length} trade calls found
              </div>
            </div>

            {/* No results message */}
            {sortedCalls.length === 0 && !loading && (
              <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-xl text-center">
                <p className="text-gray-600 dark:text-gray-300">
                  {tradeCalls.length === 0
                    ? "No trade calls found. Try refreshing the data."
                    : "No trade calls match your current filters. Try changing the filters."}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Call list */}
      {!loading && sortedCalls.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedCalls.map((call) => (
            <div
              key={call.address}
              className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                  {call.tokenData?.logo ? (
                    <img
                      src={TokenService.getTokenLogoUrl(call.tokenData)}
                      alt={`${call.tokenData.symbol || "Token"} logo`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/40x40/222/666?text=Token";
                      }}
                    />
                  ) : (
                    <div className="text-xs font-mono text-gray-500">
                      {call.parsed.tokenAddress.slice(0, 4)}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium">
                    {call.callerName || "Anonymous"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatSol(call.parsed.stakedAmount)} staked
                  </p>
                </div>
                <div
                  className={`ml-auto px-2 py-1 text-xs rounded-full ${getStatusColor(
                    getStatusString(call.parsed.status)
                  )}`}
                >
                  {getStatusString(call.parsed.status).charAt(0).toUpperCase() +
                    getStatusString(call.parsed.status).slice(1)}
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Token:</span>
                  <span className="font-mono text-sm">
                    {call.tokenData?.symbol || (
                      <span className="text-gray-400 text-xs">
                        {SolanaProgramService.shortenAddress(
                          call.parsed.tokenAddress
                        )}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Price:</span>
                  <span className="font-mono text-sm">
                    {call.tokenData?.usdPrice ? (
                      `$${TokenService.formatTokenPrice(
                        call.tokenData.usdPrice
                      )}`
                    ) : (
                      <span className="text-gray-400 text-xs">Loading...</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">24h Change:</span>
                  <span
                    className={`font-mono text-sm ${getPerformanceColor(
                      call.tokenData?.usdPrice24hrPercentChange
                    )}`}
                  >
                    {call.tokenData?.usdPrice24hrPercentChange !== undefined ? (
                      `${
                        call.tokenData.usdPrice24hrPercentChange >= 0 ? "+" : ""
                      }${call.tokenData.usdPrice24hrPercentChange.toFixed(2)}%`
                    ) : (
                      <span className="text-gray-400 text-xs">--</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Call ID:</span>
                  <span className="font-mono text-sm">{call.parsed.id}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Date:</span>
                  <span className="font-mono text-sm">
                    {formatDate(call.parsed.timestamp)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Followers:</span>
                  <span className="font-mono text-sm">
                    {call.parsed.followers.length}
                  </span>
                </div>
              </div>
              <Link
                href={`/calls/${call.address}`}
                className="w-full rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-foreground py-2 text-sm font-medium block text-center"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
