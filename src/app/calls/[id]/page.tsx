'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as SolanaProgramService from '@/services/solanaProgram';
import { WalletAdapter } from '@/services/solanaProgram';
import * as TokenService from '@/services/tokenService';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Image from 'next/image';

// Dynamically import the WalletMultiButton component with SSR disabled
dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return { default: WalletMultiButton };
  },
  { ssr: false }
);

// Define interfaces for token data and call data
interface TokenData {
  symbol?: string;
  usdPrice?: number;
  usdPrice24hrPercentChange?: number;
  logo?: string;
}

interface TradeCallData {
  address: string;
  parsed: {
    id: string;
    tokenAddress: string;
    tokenSymbol?: string;
    stakedAmount: string;
    timestamp: string;
    caller: string;
    followers: string[];
    status: number;
    claimedFollowers: string[];
  };
}

export default function CallDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { connected, publicKey, wallet } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [callData, setCallData] = useState<TradeCallData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [tokenVerified, setTokenVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Get call ID from URL
  const callId = pathname?.split('/').pop();

  // Set mounted state when component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch trade call data
  useEffect(() => {
    const fetchCallData = async () => {
      if (!callId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch trade call data
        const tradeCall = await SolanaProgramService.fetchTradeCall(callId);
        if (!tradeCall?.parsed) {
          throw new Error('Trade call not found');
        }
        
        setCallData(tradeCall as TradeCallData);
        
        // Fetch token data
        const tokenInfo = await TokenService.fetchTokenPrice(tradeCall.parsed.tokenAddress);
        setTokenData(tokenInfo as TokenData);
        
        // Check if current user is following
        if (publicKey) {
          const isFollower = tradeCall.parsed.followers.includes(publicKey.toString());
          setIsFollowing(isFollower);
          
          // Check if user has already claimed their share
          const hasClaimed = publicKey && tradeCall.parsed.claimedFollowers 
            ? tradeCall.parsed.claimedFollowers.includes(publicKey.toString())
            : false;
          setHasClaimed(hasClaimed);
        }
      } catch (err) {
        console.error('Error fetching trade call:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch trade call data');
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchCallData();
    }
  }, [callId, mounted, publicKey]);

  // Verify if user owns the token
  const verifyTokenOwnership = async () => {
    if (!publicKey || !callData?.parsed?.tokenAddress) return false;
    
    try {
      setVerifying(true);
      setError(null);
      setSuccess(null);
      
      // Make a request to our backend API endpoint
      const userAddress = publicKey.toString();
      const tokenAddress = callData.parsed.tokenAddress;
      const tradeCallTimestamp = parseInt(callData.parsed.timestamp);
      
      console.log('Verifying token ownership:', {
        userAddress: userAddress.slice(0, 6) + '...' + userAddress.slice(-4),
        tokenAddress: tokenAddress.slice(0, 6) + '...' + tokenAddress.slice(-4),
        tradeCallTimestamp: new Date(tradeCallTimestamp * 1000).toLocaleString()
      });
      
      const response = await axios.post('/api/verify-token-ownership', {
        userAddress,
        tokenAddress,
        tradeCallTimestamp
      });
      
      console.log('Token verification response:', response.data);
      
      const { hasPurchased, tokenDetails, isMocked } = response.data;
      setTokenVerified(hasPurchased);
      
      if (!hasPurchased) {
        // Not owning the token is not an error, it's just a verification result
        // We'll just show this as information instead of an error
        setSuccess(null); // Clear any previous success messages
        setError(null); // Clear any previous error messages
      } else if (isMocked) {
        // If the response is mocked (for development without API key)
        console.log('Using mocked verification response');
        setSuccess('Token verification simulated for development');
      } else if (tokenDetails) {
        // Display token details if available
        const detailsMessage = `Verified! You own ${tokenDetails.amount} ${tokenDetails.symbol || 'tokens'}`;
        setSuccess(detailsMessage);
      }
      
      return hasPurchased;
    } catch (err: unknown) {
      console.error('Error verifying token ownership:', err);
      
      let errorMessage = 'Failed to verify token ownership. Please try again later.';
      
      // Extract more detailed error information if available
      if (axios.isAxiosError(err) && err.response?.data?.details) {
        errorMessage = `Error: ${err.response.data.details}`;
        console.error('API error details:', err.response.data);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setTokenVerified(false);
      return false;
    } finally {
      setVerifying(false);
    }
  };

  // Handler for following a call
  const handleFollowCall = async () => {
    if (!mounted || !connected || !publicKey || !wallet) {
      router.push(`/connect?returnUrl=${encodeURIComponent(pathname || '')}`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // First check if the user has a vault
      const [userVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_vault'), publicKey.toBuffer()],
        new PublicKey(SolanaProgramService.PROGRAM_ID)
      );
      
      const connection = SolanaProgramService.getConnection();
      const userVaultInfo = await connection.getAccountInfo(userVaultPDA);
      
      // If the user doesn't have a vault, create one
      if (!userVaultInfo) {
        console.log('User vault not found. Creating vault...');
        await SolanaProgramService.createUserVault(wallet.adapter as unknown as WalletAdapter);
        console.log('User vault created successfully');
      }
      
      if (!callData) {
        throw new Error('Trade call data is not available');
      }
      
      // Now follow the trade call
      const txid = await SolanaProgramService.followTradeCall(
        wallet.adapter as unknown as WalletAdapter, 
        callData.address
      );
      console.log('Successfully followed trade call:', txid);
      
      // Update UI
      setIsFollowing(true);
      
      // Refresh the call data to update follower count
      const updatedCall = await SolanaProgramService.fetchTradeCall(callData.address);
      setCallData(updatedCall as TradeCallData);
      
      // Show success message in the UI instead of an alert
      setSuccess('Successfully followed this trade call!');
    } catch (err) {
      console.error('Error following trade call:', err);
      
      let errorMessage = 'Failed to follow trade call';
      
      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes('User rejected the request')) {
          errorMessage = 'Transaction was rejected in your wallet. Please try again.';
        } else if (err.message.includes('AlreadyFollowing')) {
          errorMessage = 'You are already following this trade call';
          setIsFollowing(true);
        } else if (err.message.includes('CannotFollowOwnTrade')) {
          errorMessage = 'You cannot follow your own trade call';
        } else if (err.message.includes('InsufficientDeposit') || err.message.includes('NoDeposit')) {
          errorMessage = 'Insufficient funds in your vault. Please deposit SOL to your vault first.';
          // Optionally redirect to vault page
          if (confirm(`${errorMessage}\n\nWould you like to go to the vault page to deposit funds?`)) {
            router.push('/vault');
          }
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handler for claiming follower share with token verification
  const handleClaimShare = async () => {
    if (!mounted || !connected || !publicKey || !wallet) {
      router.push(`/connect?returnUrl=${encodeURIComponent(pathname || '')}`);
      return;
    }
    
    if (!callData || !callData.address) {
      setError('Trade call data is not available');
      return;
    }
    
    try {
      setClaiming(true);
      setError(null);
      setSuccess(null);
      
      // Verify token ownership if not already verified
      if (tokenVerified === null) {
        const isVerified = await verifyTokenOwnership();
        if (!isVerified) {
          setClaiming(false);
          return;
        }
      } else if (tokenVerified === false) {
        setError("You don't own this token. You must have purchased the token to claim rewards.");
        setClaiming(false);
        return;
      }
      
      const txid = await SolanaProgramService.claimFollowerShare(wallet.adapter as unknown as WalletAdapter, callData.address);
      console.log('Successfully claimed follower share:', txid);
      
      // Update UI
      setHasClaimed(true);
      
      // Refresh the call data
      const updatedCall = await SolanaProgramService.fetchTradeCall(callData.address);
      setCallData(updatedCall as TradeCallData);
      
      // Show success message in the UI
      setSuccess('Successfully claimed your rewards!');
    } catch (err) {
      console.error('Error claiming follower share:', err);
      
      let errorMessage = 'Failed to claim follower share';
      
      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes('User rejected the request')) {
          errorMessage = 'Transaction was rejected in your wallet. Please try again.';
        } else if (err.message.includes('NotAFollower')) {
          errorMessage = 'You are not a follower of this trade call';
        } else if (err.message.includes('AlreadyClaimed')) {
          errorMessage = 'You have already claimed your rewards';
          setHasClaimed(true);
        } else if (err.message.includes('FundsNotDistributed')) {
          errorMessage = 'Funds have not been distributed yet';
        } else if (err.message.includes('TradeCallNotActive')) {
          errorMessage = 'This trade call is not active';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setClaiming(false);
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 1:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 2:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Helper function to get status text
  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return 'Active';
      case 1:
        return 'Completed';
      case 2:
        return 'Slashed';
      default:
        return 'Unknown';
    }
  };

  // Helper function to get performance color
  const getPerformanceColor = (percentChange: number | undefined) => {
    if (!percentChange) return 'text-gray-600 dark:text-gray-400';
    if (percentChange > 0) return 'text-green-600 dark:text-green-400';
    if (percentChange < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading trade call data...</p>
        </div>
      </div>
    );
  }

  if (error || !callData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || 'Trade call not found'}
          </p>
          <Link
            href="/calls"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium px-6 py-3 mx-auto inline-flex"
          >
            Back to All Calls
          </Link>
        </div>
      </div>
    );
  }

  const { parsed } = callData;
  const stakedAmount = SolanaProgramService.lamportsToSol(parsed.stakedAmount);
  const timestamp = new Date(parseInt(parsed.timestamp) * 1000);
  const percentChange = tokenData?.usdPrice24hrPercentChange;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href="/calls" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-foreground mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to All Calls
        </Link>
        
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-foreground">
            {tokenData?.symbol || SolanaProgramService.shortenAddress(parsed.tokenAddress)} Call
          </h1>
          <div className={`px-3 py-1 text-sm rounded-full ${getStatusColor(parsed.status)}`}>
            {getStatusText(parsed.status)}
          </div>
        </div>
      </div>

      {/* Call Information */}
      <div className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {tokenData?.logo ? (
              <Image
                src={TokenService.getTokenLogoUrl(tokenData)}
                alt={`${tokenData.symbol || 'Token'} logo`}
                className="w-full h-full object-cover"
                width={48}
                height={48}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placehold.co/48x48/222/666?text=Token';
                }}
              />
            ) : (
              <div className="text-xs font-mono text-gray-500">
                {parsed.tokenAddress.slice(0, 4)}
              </div>
            )}
          </div>
          <div className="ml-4">
            <p className="font-medium text-lg">
              {SolanaProgramService.shortenAddress(parsed.caller)}
            </p>
            <p className="text-sm text-gray-500">
              Called on {timestamp.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-1">Token</h3>
              <div className="font-mono font-medium">
                {tokenData?.symbol || SolanaProgramService.shortenAddress(parsed.tokenAddress)}
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-1">Token Address</h3>
              <div className="font-mono text-sm truncate">{parsed.tokenAddress}</div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-1">Current Price</h3>
              <div className="font-mono font-medium">
                {tokenData?.usdPrice ? (
                  <>
                    ${TokenService.formatTokenPrice(tokenData.usdPrice)}
                    <span className={`ml-2 ${getPerformanceColor(percentChange)}`}>
                      {percentChange !== undefined ? (
                        `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`
                      ) : (
                        '--'
                      )}
                    </span>
                  </>
                ) : (
                  'Loading...'
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-1">Staked Amount</h3>
              <div className="font-mono font-medium">{stakedAmount} SOL</div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-1">Followers</h3>
              <div className="font-mono font-medium">{parsed.followers.length}</div>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Call ID</h3>
              <div className="font-mono font-medium">{parsed.id}</div>
            </div>
          </div>
        </div>

        {parsed.status === 0 && (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-200">
                {success}
              </div>
            )}
            
            <button
              onClick={handleFollowCall}
              disabled={loading}
              className={`w-full rounded-full ${
                isFollowing 
                  ? 'bg-gray-200 dark:bg-gray-700 text-foreground' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } py-3 text-sm font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : isFollowing ? (
                'Following'
              ) : connected ? (
                'Follow This Call'
              ) : (
                'Connect Wallet to Follow'
              )}
            </button>
          </>
        )}

        {parsed.status === 2 && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-800 dark:text-red-200 mb-4">
            <p className="font-medium">Call Slashed</p>
            <p className="mt-1">This call was slashed because the token price dropped significantly. The staked SOL was redistributed to followers.</p>
          </div>
        )}

        {parsed.status === 1 && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-800 dark:text-green-200 mb-4">
            <p className="font-medium">Call Completed Successfully</p>
            <p className="mt-1">This call was successful. The caller received their staked SOL <Image src="/Solana_logo.png" alt="SOL" width={16} height={14} className="inline-block mx-1" /> back and gained on-chain reputation.</p>
          </div>
        )}
        
        {/* Claim Follower Share button - only show for failed trade calls and followers who haven't claimed yet */}
        {parsed.status === 2 && isFollowing && (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-200">
                {success}
              </div>
            )}
            
            {/* Token verification info - show as informational message, not error */}
            {tokenVerified === false && !error && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                You need to own the {callData.parsed.tokenSymbol || 'token'} to be eligible for claiming rewards. 
                Please acquire the token before attempting to claim rewards.
              </div>
            )}
            
            {tokenVerified === true && !error && !success && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                Token ownership verified! You can claim your rewards.
              </div>
            )}
            
            <button
              onClick={tokenVerified === null ? verifyTokenOwnership : handleClaimShare}
              disabled={claiming || hasClaimed || verifying || tokenVerified === false}
              className={`w-full rounded-full ${
                hasClaimed 
                  ? 'bg-gray-200 dark:bg-gray-700 text-foreground'
                  : tokenVerified === false
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : tokenVerified === true
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
              } py-3 text-sm font-medium mb-4 ${(claiming || verifying) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {claiming ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Claim...
                </div>
              ) : verifying ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying Token Ownership...
                </div>
              ) : hasClaimed ? (
                'Rewards Claimed'
              ) : tokenVerified === null ? (
                'Verify Eligibility'
              ) : tokenVerified === false ? (
                'Not Eligible to Claim'
              ) : (
                'Claim Your Rewards'
              )}
            </button>
          </>
        )}
      </div>

      {/* Call Details */}
      <div className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-4">Call Conditions</h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm mb-2">
              <span className="font-medium">Good Call Scenario:</span> If token price increases by &gt;10% from the call price, this is considered a good call.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              • Caller receives their staked SOL back
              <br />
              • Caller&apos;s on-chain reputation increases
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm mb-2">
              <span className="font-medium">Bad Call Scenario:</span> If token price drops by &gt;50% from the call price, this is considered a bad call.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              • Caller&apos;s staked SOL is slashed
              <br />
              • Slashed SOL is redistributed to verified followers
              <br />
              • Caller&apos;s on-chain reputation decreases
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 