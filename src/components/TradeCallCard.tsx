"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import * as SolanaProgramService from "@/services/solanaProgram";
import * as TokenPriceService from "@/services/tokenPriceService";

// Define TokenPriceData interface
interface TokenPriceData {
  symbol?: string;
  price?: number;
  change24h?: number;
  marketCap?: number;
}

interface TradeCallCardProps {
  tokenAddress: string;
  stakedAmount: string | number;
  caller: string;
  timestamp: string | number;
  status: 0 | 1 | 2; // 0 = Active, 1 = Successful, 2 = Failed
  followers?: string[];
  className?: string;
  callerName?: string; // Optional caller name for display
  rationale?: string; // Optional rationale text
  address?: string; // Trade call account address for follow action
}

const TradeCallCard: React.FC<TradeCallCardProps> = ({
  tokenAddress,
  stakedAmount,
  caller,
  timestamp,
  status,
  followers = [],
  className = "",
  callerName,
  rationale,
  address,
}) => {
  const { publicKey, connected, wallet } = useWallet();
  const [tokenPriceData, setTokenPriceData] = useState<TokenPriceData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const [followInProgress, setFollowInProgress] = useState(false);

  // Format SOL amount to 4 decimal places
  const formattedStakedAmount =
    typeof stakedAmount === "string"
      ? SolanaProgramService.lamportsToSol(parseInt(stakedAmount)).toFixed(4)
      : SolanaProgramService.lamportsToSol(stakedAmount).toFixed(4);

  // Format date
  const formattedDate = SolanaProgramService.timestampToDate(timestamp);

  // Get status text
  const statusText =
    SolanaProgramService.TRADE_CALL_STATUSES[
      status as keyof typeof SolanaProgramService.TRADE_CALL_STATUSES
    ];

  // Determine status color
  const statusColor =
    status === 0
      ? "bg-blue-600 text-white" // Active
      : status === 1
      ? "bg-green-600 text-white" // Successful
      : "bg-red-600 text-white"; // Failed

  // Check if user is already following
  useEffect(() => {
    if (connected && publicKey && followers.length > 0) {
      const isAlreadyFollowing = followers.some(
        (follower) =>
          follower.toLowerCase() === publicKey.toString().toLowerCase()
      );
      setIsFollowing(isAlreadyFollowing);
    }
  }, [connected, publicKey, followers]);

  // Fetch token price data when component mounts
  useEffect(() => {
    let isMounted = true;
    const fetchTokenPrice = async () => {
      try {
        const priceData = await TokenPriceService.getTokenPriceData(
          tokenAddress
        );
        if (isMounted) {
          setTokenPriceData(priceData);
        }
      } catch (error) {
        console.error("Error fetching token price:", error);
      }
    };

    fetchTokenPrice();
    
    return () => {
      isMounted = false;
    };
  }, [tokenAddress]);

  // Get price change formatting
  const getPriceChangeFormatting = (change: number) => {
    const { text, isPositive } = TokenPriceService.formatPriceChange(change);
    return {
      text,
      className: isPositive ? "text-green-600" : "text-red-600",
    };
  };

  // Format caller name
  const displayName =
    callerName || `Caller ${SolanaProgramService.shortenAddress(caller)}`;

  // Handle follow button click
  const handleFollow = async () => {
    if (!connected || !wallet) {
      alert("Please connect your wallet first");
      return;
    }

    if (!address) {
      setFollowError("Trade call address not provided");
      return;
    }

    setFollowInProgress(true);
    setFollowError(null);

    try {
      // Use type casting for wallet compatibility
      const adapter = wallet as unknown as SolanaProgramService.WalletAdapter;
      const txId = await SolanaProgramService.followTradeCall(adapter, address);
      console.log("Successfully followed trade call, transaction ID:", txId);

      // Update UI state
      setIsFollowing(true);
    } catch (error) {
      console.error("Failed to follow trade call:", error);
      if (error instanceof Error) {
        setFollowError(error.message);
      } else {
        setFollowError("Failed to follow trade call");
      }
    } finally {
      setFollowInProgress(false);
    }
  };

  return (
    <div
      className={`bg-background rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header with caller info and status */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-gray-500">
                {formattedStakedAmount} SOL staked
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 text-sm rounded-full ${statusColor}`}>
            {statusText}
          </div>
        </div>
      </div>

      {/* Border separator */}
      <div className="border-t border-gray-200 dark:border-gray-800"></div>

      {/* Token and pricing data */}
      <div className="p-6">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Token:</span>
            <span className="font-mono text-sm">
              {tokenPriceData?.symbol ||
                SolanaProgramService.shortenAddress(tokenAddress)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Call Price:</span>
            <span className="font-mono text-sm">
              {tokenPriceData?.price
                ? TokenPriceService.formatPrice(tokenPriceData.price)
                : "Loading..."}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Current Price:</span>
            {tokenPriceData?.price ? (
              <span
                className={`font-mono text-sm ${
                  (tokenPriceData.change24h || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {TokenPriceService.formatPrice(tokenPriceData.price)} (
                {getPriceChangeFormatting(tokenPriceData.change24h || 0).text})
              </span>
            ) : (
              <span className="font-mono text-sm">Loading...</span>
            )}
          </div>

          {tokenPriceData?.marketCap && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Market Cap:</span>
              <span className="font-mono text-sm">
                {TokenPriceService.formatMarketCap(tokenPriceData.marketCap)}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Followers:</span>
            <span className="font-mono text-sm">{followers.length}</span>
          </div>
        </div>

        {/* Rationale if provided */}
        {rationale && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-300">
            <p className="font-medium mb-1">Rationale:</p>
            <p>{rationale}</p>
          </div>
        )}

        {/* Follow error message */}
        {followError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-sm text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
            {followError}
          </div>
        )}

        {/* Follow button */}
        <button
          className={`w-full mt-4 rounded-full ${
            isFollowing
              ? "bg-gray-600 hover:bg-gray-700"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white py-2 text-sm font-medium transition-colors ${
            followInProgress || status !== 0
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          onClick={handleFollow}
          disabled={isFollowing || followInProgress || status !== 0}
        >
          {followInProgress
            ? "Processing..."
            : isFollowing
            ? "Following"
            : "Follow This Call"}
        </button>
      </div>
    </div>
  );
};

export default TradeCallCard;
