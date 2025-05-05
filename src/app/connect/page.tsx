'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';

// Dynamically import the WalletMultiButton with ssr disabled to prevent hydration mismatches
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function ConnectPage() {
  const { publicKey, connected, connecting, wallets } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const [walletOptions, setWalletOptions] = useState([
    {
      name: 'Phantom',
      icon: 'P',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-600 dark:text-purple-300',
      url: 'https://phantom.app/download'
    },
    {
      name: 'Solflare',
      icon: 'S',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      textColor: 'text-orange-600 dark:text-orange-300',
      url: 'https://solflare.com/download'
    }
  ]);

  // Set mounted when component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      router.push(returnUrl);
    }
  }, [connected, publicKey, router, returnUrl]);

  // Error handler for wallet connection
  const handleError = useCallback((error) => {
    console.error('Wallet connection error:', error);
    setHasError(true);
  }, []);

  // Check if any wallets are installed
  const hasInstalledWallets = mounted && wallets.some(wallet => wallet.readyState === 'Installed');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-foreground text-center mb-2">Connect Your Wallet</h1>
      <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
        Connect your Solana wallet to interact with the CredCall platform.
      </p>
      
      <div className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="mb-6 text-center">
          {hasError && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg text-sm">
              There was an error connecting to your wallet. Please try again or select a different wallet.
            </div>
          )}
          
          {mounted ? (
            <div className="flex flex-col items-center">
              <WalletMultiButton className="mx-auto rounded-full bg-foreground text-background hover:bg-opacity-90 py-3 px-6" />
              {!hasInstalledWallets && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  No Solana wallets detected. Please install one from the options below.
                </p>
              )}
            </div>
          ) : (
            <button className="mx-auto rounded-full bg-foreground text-background hover:bg-opacity-90 py-3 px-6 disabled:opacity-50" disabled>
              Connect Wallet
            </button>
          )}
        </div>
        
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Don't have a wallet?</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            To use CredCall, you'll need a Solana wallet. Here are some recommended options:
          </p>
          
          <div className="space-y-4">
            {walletOptions.map((option) => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${option.bgColor} rounded-full flex items-center justify-center mr-3`}>
                    <span className={`${option.textColor} font-bold`}>{option.icon}</span>
                  </div>
                  <div>
                    <span className="font-medium">{option.name} Wallet</span>
                    <p className="text-xs text-gray-500">Recommended wallet for Solana</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Need help setting up a wallet?</p>
            <a 
              href="https://docs.solana.com/wallet-guide" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View the Solana wallet guide
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 