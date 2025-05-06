'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';

export default function CallsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOption, setSortOption] = useState('recent');

  // Mock data for token calls
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
      date: '2023-08-15'
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
      date: '2023-08-10'
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
      date: '2023-08-05'
    },
    {
      id: 4,
      caller: 'AlphaCatcher',
      token: 'PYTH',
      callPrice: '$0.52',
      currentPrice: '$0.49',
      percentChange: '-5.8%',
      status: 'active',
      stakingAmount: '12 SOL',
      followers: 34,
      date: '2023-08-12'
    },
    {
      id: 5,
      caller: 'DefiMaster',
      token: 'RAY',
      callPrice: '$0.87',
      currentPrice: '$0.38',
      percentChange: '-56.3%',
      status: 'slashed',
      stakingAmount: '8 SOL',
      followers: 19,
      date: '2023-08-07'
    },
    {
      id: 6,
      caller: 'TrendHunter',
      token: 'ORCA',
      callPrice: '$1.15',
      currentPrice: '$1.28',
      percentChange: '+11.3%',
      status: 'completed',
      stakingAmount: '6 SOL',
      followers: 23,
      date: '2023-08-02'
    }
  ];

  // Filter calls based on active filter
  const filteredCalls = mockCalls.filter(call => {
    if (activeFilter === 'all') return true;
    return call.status === activeFilter;
  });

  // Sort calls based on sort option
  const sortedCalls = [...filteredCalls].sort((a, b) => {
    if (sortOption === 'recent') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortOption === 'stake') {
      return parseFloat(b.stakingAmount) - parseFloat(a.stakingAmount);
    } else if (sortOption === 'followers') {
      return b.followers - a.followers;
    } else if (sortOption === 'performance') {
      const aPerf = parseFloat(a.percentChange.replace('%', ''));
      const bPerf = parseFloat(b.percentChange.replace('%', ''));
      return bPerf - aPerf;
    }
    return 0;
  });

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Token Calls</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Browse all token calls made by KOLs. Filter by status and sort by different metrics.
        </p>
        
        {/* Filters and Sort Options */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button 
              className={`px-3 py-1 text-sm rounded-full ${activeFilter === 'all' 
                ? 'bg-foreground text-background' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-full ${activeFilter === 'active' 
                ? 'bg-foreground text-background' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}
              onClick={() => setActiveFilter('active')}
            >
              Active
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-full ${activeFilter === 'completed' 
                ? 'bg-foreground text-background' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}
              onClick={() => setActiveFilter('completed')}
            >
              Completed
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-full ${activeFilter === 'slashed' 
                ? 'bg-foreground text-background' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}
              onClick={() => setActiveFilter('slashed')}
            >
              Slashed
            </button>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Sort by:</span>
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
      </div>

      {/* Call list */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedCalls.map((call) => (
          <div key={call.id} className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="ml-3">
                <p className="font-medium">{call.caller}</p>
                <p className="text-sm text-gray-500">{call.stakingAmount} staked</p>
              </div>
              <div className={`ml-auto px-2 py-1 text-xs rounded-full ${getStatusColor(call.status)}`}>
                {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Token:</span>
                <span className="font-mono text-sm">{call.token}</span>
              </div>
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
                <span className="text-sm text-gray-500">Followers:</span>
                <span className="font-mono text-sm">{call.followers}</span>
              </div>
            </div>
            <Link 
              href={`/calls/${call.id}`}
              className="w-full rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-foreground py-2 text-sm font-medium block text-center"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 