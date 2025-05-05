'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';

export default function CallDetailPage() {
  const { id } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const { connected, publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Set mounted state when component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data for token calls - in a real app, this would come from an API call
  const mockCalls = [
    {
      id: 1,
      caller: 'CryptoWhale',
      token: 'SOL',
      callPrice: '$106.25',
      currentPrice: '$118.42',
      percentChange: '+11.4%',
      status: 'active',
      stakingAmount: '10 SOL',
      followers: 28,
      date: '2023-08-15',
      tokenAddress: 'So11111111111111111111111111111111111111112',
      rationale: 'SOL is poised for a breakout with upcoming Solana ecosystem developments and increased developer activity. Looking at a 10% price increase in the next 7 days.',
      timestamp: '2023-08-15T14:30:00Z',
      timeLeft: '4 days',
      performance: [
        { date: '2023-08-15', price: 106.25 },
        { date: '2023-08-16', price: 108.50 },
        { date: '2023-08-17', price: 112.30 },
        { date: '2023-08-18', price: 115.75 },
        { date: '2023-08-19', price: 118.42 }
      ]
    },
    {
      id: 2,
      caller: 'MoonShot',
      token: 'BONK',
      callPrice: '$0.00001235',
      currentPrice: '$0.00000617',
      percentChange: '-50.0%',
      status: 'slashed',
      stakingAmount: '15 SOL',
      followers: 45,
      date: '2023-08-10',
      tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      rationale: 'BONK is about to get listed on a major exchange. Expect a significant price increase in the next few days.',
      timestamp: '2023-08-10T10:15:00Z',
      timeLeft: 'Completed',
      performance: [
        { date: '2023-08-10', price: 0.00001235 },
        { date: '2023-08-11', price: 0.00001100 },
        { date: '2023-08-12', price: 0.00000950 },
        { date: '2023-08-13', price: 0.00000800 },
        { date: '2023-08-14', price: 0.00000617 }
      ]
    },
    {
      id: 3,
      caller: 'SolanaKing',
      token: 'JTO',
      callPrice: '$2.65',
      currentPrice: '$3.15',
      percentChange: '+18.9%',
      status: 'completed',
      stakingAmount: '5 SOL',
      followers: 12,
      date: '2023-08-05',
      tokenAddress: 'jtojtojtojtojtojtojtojtojtojtojtojtojtojtojto11',
      rationale: 'Jito is undervalued compared to its peers. The token should see significant growth in the coming days.',
      timestamp: '2023-08-05T09:45:00Z',
      timeLeft: 'Completed',
      performance: [
        { date: '2023-08-05', price: 2.65 },
        { date: '2023-08-06', price: 2.78 },
        { date: '2023-08-07', price: 2.95 },
        { date: '2023-08-08', price: 3.10 },
        { date: '2023-08-09', price: 3.15 }
      ]
    }
  ];

  // Find the call with the matching ID
  const callData = mockCalls.find(call => call.id.toString() === id);

  if (!callData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Call Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The token call you're looking for doesn't exist or has been removed.
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

  // Handler for following a call
  const handleFollowCall = () => {
    if (!mounted || !connected) {
      // Redirect to connect page with return URL
      router.push(`/connect?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    
    // If connected, toggle following state
    setIsFollowing(!isFollowing);
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'slashed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Helper function to get performance color
  const getPerformanceColor = (percentChange: string) => {
    const value = parseFloat(percentChange.replace('%', ''));
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

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
          <h1 className="text-3xl font-bold text-foreground">{callData.token} Call</h1>
          <div className={`px-3 py-1 text-sm rounded-full ${getStatusColor(callData.status)}`}>
            {callData.status.charAt(0).toUpperCase() + callData.status.slice(1)}
          </div>
        </div>
      </div>

      {/* Call Information */}
      <div className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="ml-4">
            <p className="font-medium text-lg">{callData.caller}</p>
            <p className="text-sm text-gray-500">Called on {new Date(callData.timestamp).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-1">Token</h3>
              <div className="font-mono font-medium">{callData.token}</div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-1">Token Address</h3>
              <div className="font-mono text-sm truncate">{callData.tokenAddress}</div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-1">Call Price</h3>
              <div className="font-mono font-medium">{callData.callPrice}</div>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Current Price</h3>
              <div className="font-mono font-medium">
                {callData.currentPrice} <span className={getPerformanceColor(callData.percentChange)}>({callData.percentChange})</span>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-1">Staked Amount</h3>
              <div className="font-mono font-medium">{callData.stakingAmount}</div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 mb-1">Followers</h3>
              <div className="font-mono font-medium">{callData.followers}</div>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Time Remaining</h3>
              <div className="font-mono font-medium">{callData.timeLeft}</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm text-gray-500 mb-2">Rationale</h3>
          <div className="text-sm p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {callData.rationale}
          </div>
        </div>

        {callData.status === 'active' && (
          <button
            onClick={handleFollowCall}
            className={`w-full rounded-full ${isFollowing 
              ? 'bg-gray-200 dark:bg-gray-700 text-foreground' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'} py-3 text-sm font-medium`}
          >
            {isFollowing ? 'Unfollow Call' : (connected ? 'Follow This Call' : 'Connect Wallet to Follow')}
          </button>
        )}

        {callData.status === 'slashed' && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-800 dark:text-red-200">
            <p className="font-medium">Call Slashed</p>
            <p className="mt-1">This call was slashed because the token price dropped more than 50% from the call price. The staked SOL was redistributed to followers.</p>
          </div>
        )}

        {callData.status === 'completed' && callData.percentChange.startsWith('+') && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-800 dark:text-green-200">
            <p className="font-medium">Call Completed Successfully</p>
            <p className="mt-1">This call was successful as the token price increased by more than 10%. The caller received their staked SOL back and gained on-chain reputation.</p>
          </div>
        )}
      </div>

      {/* Price Performance Chart */}
      <div className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
        <h2 className="text-xl font-bold mb-4">Price Performance</h2>
        <div className="h-64 w-full bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
          {/* In a real app, we would implement a chart component here */}
          <div className="text-center text-gray-500">
            <p>Chart placeholder</p>
            <p className="text-sm mt-2">Price change: {callData.percentChange} since call</p>
          </div>
        </div>
      </div>

      {/* Call Details */}
      <div className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-4">Call Conditions</h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm mb-2">
              <span className="font-medium">Good Call Scenario:</span> If token price increases by {'>'}10% from the call price, this is considered a good call.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              • Caller receives their staked SOL back
              <br />
              • Caller's on-chain reputation increases
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm mb-2">
              <span className="font-medium">Bad Call Scenario:</span> If token price drops by {'>'}50% from the call price, this is considered a bad call.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              • Caller's staked SOL is slashed
              <br />
              • Slashed SOL is redistributed to verified followers
              <br />
              • Caller's on-chain reputation decreases
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 