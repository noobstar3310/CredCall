"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Define an interface for the window object with wallet properties
interface WindowWithWallets extends Window {
  solana?: {
    isPhantom?: boolean;
    publicKey?: { toString(): string };
    connect: () => Promise<{ publicKey: string }>;
    disconnect: () => Promise<void>;
    signTransaction: (transaction: unknown) => Promise<unknown>;
    signAllTransactions: (transactions: unknown[]) => Promise<unknown[]>;
  };
  phantom?: unknown;
}

// Dynamically import the WalletMultiButton component with SSR disabled
const WalletMultiButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return { default: WalletMultiButton };
  },
  { ssr: false }
);

const WalletConnectButton = () => {
  const { wallets } = useWallet();
  const [hasError] = useState(false);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  // Set mounted state when component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if wallet is available in browser
  useEffect(() => {
    if (mounted) {
      try {
        const windowWithWallets = window as WindowWithWallets;
        
        const hasSolanaWallet = !!(
          windowWithWallets.solana || 
          windowWithWallets.phantom || 
          wallets.length > 0 && wallets.some(adapter => adapter.readyState === 'Installed')
        );
        setHasWallet(hasSolanaWallet);
      } catch (error) {
        console.error('Error checking wallet availability:', error);
        setHasWallet(false);
      }
    }
  }, [mounted, wallets]);

  // If we're not mounted yet (in SSR), return placeholder
  if (!mounted) {
    return (
      <button 
        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium text-sm px-4 py-2"
        disabled
      >
        Connect Wallet
      </button>
    );
  }

  // If there's an error connecting or we know there's no wallet, show a fallback button
  if (hasError || (hasWallet === false)) {
    return (
      <Link 
        href="/connect"
        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium text-sm px-4 py-2"
      >
        Connect Wallet
      </Link>
    );
  }

  return (
    <WalletMultiButton 
      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium text-sm px-4 py-2"
    />
  );
};

export default WalletConnectButton;
