'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('myCalls');
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Mock user profile data - in a real app, this would come from an API call
  const mockProfile = {
    address: 'sol...8f92',
    reputation: 75,
    totalStaked: '25 SOL',
    activeCalls: 2,
    completedCalls: 3,
    slashedCalls: 1,
    followerCount: 15,
    followingCount: 8,
    balance: '50 SOL',
    calls: [
      {
        id: 1,
        token: 'SOL',
        callPrice: '$106.25',
        currentPrice: '$118.42',
        percentChange: '+11.4%',
        status: 'active',
        stakingAmount: '10 SOL',
        date: '2023-08-15'
      },
      {
        id: 4,
        token: 'PYTH',
        callPrice: '$0.52',
        currentPrice: '$0.49',
        percentChange: '-5.8%',
        status: 'active',
        stakingAmount: '12 SOL',
        date: '2023-08-12'
      },
      {
        id: 3,
        token: 'JTO',
        callPrice: '$2.65',
        currentPrice: '$3.15',
        percentChange: '+18.9%',
        status: 'completed',
        stakingAmount: '5 SOL',
        date: '2023-08-05'
      },
      {
        id: 6,
        token: 'ORCA',
        callPrice: '$1.15',
        currentPrice: '$1.28',
        percentChange: '+11.3%',
        status: 'completed',
        stakingAmount: '6 SOL',
        date: '2023-08-02'
      },
      {
        id: 7,
        token: 'MNGO',
        callPrice: '$0.025',
        currentPrice: '$0.028',
        percentChange: '+12.0%',
        status: 'completed',
        stakingAmount: '4 SOL',
        date: '2023-07-25'
      },
      {
        id: 5,
        token: 'RAY',
        callPrice: '$0.87',
        currentPrice: '$0.38',
        percentChange: '-56.3%',
        status: 'slashed',
        stakingAmount: '8 SOL',
        date: '2023-08-07'
      }
    ],
    following: [
      {
        id: 2,
        caller: 'MoonShot',
        token: 'BONK',
        callPrice: '$0.00001235',
        currentPrice: '$0.00000617',
        percentChange: '-50.0%',
        status: 'slashed',
        date: '2023-08-10'
      },
      {
        id: 8,
        caller: 'AlphaCatcher',
        token: 'RENDER',
        callPrice: '$5.25',
        currentPrice: '$6.10',
        percentChange: '+16.2%',
        status: 'active',
        date: '2023-08-14'
      }
    ]
  };

  const handleConnectWallet = () => {
    // Mock wallet connection
    setIsWalletConnected(true);
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

  // Filter calls based on status
  const filteredCalls = mockProfile.calls.filter(call => {
    if (activeTab === 'myCalls') return true;
    if (activeTab === 'active') return call.status === 'active';
    if (activeTab === 'completed') return call.status === 'completed';
    if (activeTab === 'slashed') return call.status === 'slashed';
    if (activeTab === 'following') return false; // This tab shows followed calls instead
    return true;
  });

  if (!isWalletConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-background rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-800 text-center">
          <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to connect your wallet to view your profile.
          </p>
          <button
            onClick={handleConnectWallet}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium px-6 py-3 mx-auto"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-8">My Profile</h1>
      
      {/* User Stats */}
      <div className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          
          <div className="flex-1">
            <div className="text-center md:text-left">
              <h2 className="font-medium text-xl mb-1">{mockProfile.address}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                <div className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Reputation: {mockProfile.reputation}/100
                </div>
                <div className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {mockProfile.totalStaked} Total Staked
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500">Active Calls</p>
                <p className="font-medium text-lg">{mockProfile.activeCalls}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="font-medium text-lg">{mockProfile.completedCalls}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500">Slashed</p>
                <p className="font-medium text-lg">{mockProfile.slashedCalls}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500">Following</p>
                <p className="font-medium text-lg">{mockProfile.followingCount}</p>
              </div>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <div className="mb-2">
              <p className="text-sm text-gray-500">Balance</p>
              <p className="font-mono font-medium">{mockProfile.balance}</p>
            </div>
            <Link 
              href="/create"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium px-4 py-2 text-sm"
            >
              Create New Call
            </Link>
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

      {/* Call Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {activeTab === 'following' ? (
          mockProfile.following.length > 0 ? (
            mockProfile.following.map(call => (
              <div key={call.id} className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="ml-3">
                    <p className="font-medium">{call.caller}</p>
                    <p className="text-sm text-gray-500">{call.token} Token Call</p>
                  </div>
                  <div className={`ml-auto px-2 py-1 text-xs rounded-full ${getStatusColor(call.status)}`}>
                    {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Call Price:</span>
                    <span className="font-mono text-sm">{call.callPrice}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Current Price:</span>
                    <span className="font-mono text-sm">
                      {call.currentPrice} <span className={getPerformanceColor(call.percentChange)}>({call.percentChange})</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Date:</span>
                    <span className="font-mono text-sm">{call.date}</span>
                  </div>
                </div>
                <Link 
                  href={`/calls/${call.id}`}
                  className="w-full rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-foreground py-2 text-sm font-medium block text-center"
                >
                  View Details
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-8 text-center text-gray-500">
              <p>You are not following any calls yet.</p>
              <Link href="/calls" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                Explore calls to follow
              </Link>
            </div>
          )
        ) : filteredCalls.length > 0 ? (
          filteredCalls.map(call => (
            <div key={call.id} className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <div className="ml-0">
                  <p className="font-medium">{call.token} Token Call</p>
                  <p className="text-sm text-gray-500">{call.stakingAmount} staked</p>
                </div>
                <div className={`ml-auto px-2 py-1 text-xs rounded-full ${getStatusColor(call.status)}`}>
                  {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Call Price:</span>
                  <span className="font-mono text-sm">{call.callPrice}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Current Price:</span>
                  <span className="font-mono text-sm">
                    {call.currentPrice} <span className={getPerformanceColor(call.percentChange)}>({call.percentChange})</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Date:</span>
                  <span className="font-mono text-sm">{call.date}</span>
                </div>
              </div>
              <Link 
                href={`/calls/${call.id}`}
                className="w-full rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-foreground py-2 text-sm font-medium block text-center"
              >
                View Details
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-8 text-center text-gray-500">
            <p>No {activeTab === 'myCalls' ? '' : activeTab + ' '}calls found.</p>
            <Link href="/create" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
              Create a new call
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 