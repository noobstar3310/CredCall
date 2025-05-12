'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the WalletMultiButton component with SSR disabled to prevent hydration errors
const WalletMultiButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return { default: WalletMultiButton };
  },
  { ssr: false }
);

const WalletButton = () => {
  const { publicKey, connected, connecting, wallet, wallets } = useWallet();
  const [hasError, setHasError] = useState(false);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  // Set mounted state when component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if wallet is available in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Check if Phantom or Solana wallet is available
        const hasSolanaWallet = !!(
          (window as any).solana || 
          (window as any).phantom || 
          // Also check for wallet availability in-browser
          wallets.length > 0 && wallets.some(adapter => adapter.readyState === 'Installed')
        );
        setHasWallet(hasSolanaWallet);
      } catch (error) {
        console.error('Error checking wallet availability:', error);
        setHasWallet(false);
      }
    }
  }, [wallets]);

  // Handler for wallet errors
  const onError = useCallback((error: Error) => {
    console.error('Wallet error:', error);
    setHasError(true);
  }, []);

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

  try {
    return (
      <WalletMultiButton 
        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium text-sm px-4 py-2"
      />
    );
  } catch (error) {
    console.error('Error rendering wallet button:', error);
    return (
      <Link 
        href="/connect"
        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium text-sm px-4 py-2"
      >
        Connect Wallet
      </Link>
    );
  }
};

export default WalletButton; 