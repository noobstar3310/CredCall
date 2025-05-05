'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ConnectPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletType, setWalletType] = useState('');

  const handleConnect = (type: string) => {
    setIsConnecting(true);
    setWalletType(type);
    
    // Simulate wallet connection
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-foreground text-center mb-2">Connect Wallet</h1>
      <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
        Connect your wallet to interact with the CredCall platform.
      </p>
      
      {isConnected ? (
        <div className="bg-background rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-800 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Wallet Connected</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You have successfully connected your {walletType} wallet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/profile"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium px-6 py-3"
            >
              View Profile
            </Link>
            <Link 
              href="/calls"
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium px-6 py-3"
            >
              Explore Calls
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="space-y-4">
            <button
              onClick={() => handleConnect('Phantom')}
              disabled={isConnecting}
              className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 dark:text-purple-300 font-bold">P</span>
                </div>
                <span className="font-medium">Phantom Wallet</span>
              </div>
              {isConnecting && walletType === 'Phantom' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground"></div>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            
            <button
              onClick={() => handleConnect('Solflare')}
              disabled={isConnecting}
              className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 dark:text-orange-300 font-bold">S</span>
                </div>
                <span className="font-medium">Solflare Wallet</span>
              </div>
              {isConnecting && walletType === 'Solflare' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground"></div>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            
            <button
              onClick={() => handleConnect('Backpack')}
              disabled={isConnecting}
              className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 font-bold">B</span>
                </div>
                <span className="font-medium">Backpack</span>
              </div>
              {isConnecting && walletType === 'Backpack' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground"></div>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Don't have a Solana wallet?</p>
            <a 
              href="https://docs.solana.com/wallet-guide" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Learn how to set up a wallet
            </a>
          </div>
        </div>
      )}
    </div>
  );
} 