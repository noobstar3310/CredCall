'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { 
  fetchAllTradeCalls,
  TRADE_CALL_STATUSES,
  lamportsToSol,
  timestampToDate,
  shortenAddress as originalShortenAddress
} from '@/services/solanaProgram';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Define interfaces for the data structures
interface ParsedTradeCall {
  id?: number;
  tokenAddress?: string;
  stakedAmount: number | string;
  caller: string;
  timestamp: number | string;
  followers?: string[];
  status: number;
  isDistributed?: boolean;
  payoutPerFollower?: number;
  claimedFollowers?: string[];
  callerPayout?: number;
}

interface TradeCallData {
  address: string;
  data: string;
  parsed: ParsedTradeCall;
}

// Define type for TRADE_CALL_STATUSES
type TradeCallStatusMap = {
  [key: number]: string;
}

// Safe shorten address function
const shortenAddress = (address: string | undefined): string => {
  if (!address) return 'Unknown';
  return originalShortenAddress(address);
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('myCalls');
  const { publicKey, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [tradeCalls, setTradeCalls] = useState<TradeCallData[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [userStats, setUserStats] = useState({
    activeCalls: 0,
    completedCalls: 0,
    slashedCalls: 0,
    totalStaked: 0,
    followingCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) return;
      
      setIsLoading(true);
      try {
        // Fetch wallet balance
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const balance = await connection.getBalance(publicKey);
        setUserBalance(balance / LAMPORTS_PER_SOL);

        // Fetch trade calls
        const calls = await fetchAllTradeCalls(publicKey);
        
        if (calls && calls.length > 0) {
          setTradeCalls(calls as TradeCallData[]);

          // Calculate stats
          const stats = {
            activeCalls: 0,
            completedCalls: 0,
            slashedCalls: 0,
            totalStaked: 0,
            followingCount: 0
          };

          calls.forEach(call => {
            if (call.parsed) {
              const isCaller = call.parsed.caller === publicKey.toString();
              const isFollower = call.parsed.followers && publicKey && call.parsed.followers.includes(publicKey.toString());
              
              if (isCaller) {
                const stakedAmount = parseFloat(lamportsToSol(call.parsed.stakedAmount).toString());
                stats.totalStaked += stakedAmount;
                
                if (call.parsed.status === 0) stats.activeCalls++;
                else if (call.parsed.status === 1) stats.completedCalls++;
                else if (call.parsed.status === 2) stats.slashedCalls++;
              }
              
              if (isFollower) {
                stats.followingCount++;
              }
            }
          });
          
          setUserStats(stats);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (connected && publicKey) {
      fetchData();
    }
  }, [publicKey, connected]);

  // Helper function to get status color
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: // Active
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 1: // Successful
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 2: // Failed
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

  // Filter calls based on status and active tab
  const filteredCalls = tradeCalls.filter(call => {
    if (!call.parsed) return false;
    
    const isCaller = call.parsed.caller === publicKey?.toString();
    const isFollower = call.parsed.followers && publicKey && call.parsed.followers.includes(publicKey.toString());
    
    if (activeTab === 'myCalls') return isCaller;
    if (activeTab === 'active') return isCaller && call.parsed.status === 0;
    if (activeTab === 'completed') return isCaller && call.parsed.status === 1;
    if (activeTab === 'slashed') return isCaller && call.parsed.status === 2;
    if (activeTab === 'following') return isFollower && !isCaller;
    return false;
  });

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">My Profile</h1>
        
        {/* User Stats */}
        <div className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            
            <div className="flex-1">
              <div className="text-center md:text-left">
                <h2 className="font-medium text-xl mb-1">
                  {publicKey ? shortenAddress(publicKey.toString()) : 'Not Connected'}
                </h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  <div className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {userStats.totalStaked.toFixed(2)} SOL Total Staked
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-500">Active Calls</p>
                  <p className="font-medium text-lg">{userStats.activeCalls}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium text-lg">{userStats.completedCalls}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-500">Slashed</p>
                  <p className="font-medium text-lg">{userStats.slashedCalls}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-500">Following</p>
                  <p className="font-medium text-lg">{userStats.followingCount}</p>
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="mb-2">
                <p className="text-sm text-gray-500">Balance</p>
                <p className="font-mono font-medium">{userBalance.toFixed(4)} SOL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-800">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('myCalls')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'myCalls'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                All My Calls
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'completed'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setActiveTab('slashed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'slashed'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Slashed
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'following'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Following
              </button>
            </nav>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <p>Loading your profile data...</p>
          </div>
        )}

        {/* Call Cards */}
        {!isLoading && (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredCalls.length > 0 ? (
              filteredCalls.map(call => {
                const { parsed, address } = call;
                if (!parsed) return null;
                
                const stakedAmount = lamportsToSol(parsed.stakedAmount || 0);
                const timestamp = timestampToDate(parsed.timestamp || 0);
                const tokenSymbol = parsed.tokenAddress ? parsed.tokenAddress.slice(0, 4) : 'TOKEN';
                const statusText = (TRADE_CALL_STATUSES as TradeCallStatusMap)[parsed.status] || 'Unknown';
                // In a real app, this would fetch current price and calculate percentage change
                const percentChange = '+0.0%';
              
                return (
                  <div key={address} className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center mb-4">
                      <div className="ml-0">
                        <p className="font-medium">{tokenSymbol} Token Call</p>
                        <p className="text-sm text-gray-500">{stakedAmount} SOL staked</p>
                      </div>
                      <div className={`ml-auto px-2 py-1 text-xs rounded-full ${getStatusColor(parsed.status)}`}>
                        {statusText}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-500">Token Address:</span>
                        <span className="font-mono text-xs">
                          {parsed.tokenAddress ? originalShortenAddress(parsed.tokenAddress as string) : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-500">Followers:</span>
                        <span className="font-mono text-sm">
                          {parsed.followers?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Date:</span>
                        <span className="font-mono text-sm">{timestamp}</span>
                      </div>
                    </div>
                    <Link 
                      href={`/calls/${address}`}
                      className="w-full rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-foreground py-2 text-sm font-medium block text-center"
                    >
                      View Details
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-8 text-center text-gray-500">
                <p>No {activeTab === 'myCalls' ? '' : activeTab + ' '}calls found.</p>
                {activeTab !== 'following' && (
                  <Link href="/create" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                    Create a new call
                  </Link>
                )}
                {activeTab === 'following' && (
                  <Link href="/calls" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                    Explore calls to follow
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 