"use client";

import React, { FC, ReactNode, useMemo, useState, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import dynamic from "next/dynamic";
import { clusterApiUrl } from "@solana/web3.js";

// Import the wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

// Dynamic import of WalletModalProvider with SSR disabled
const WalletModalProvider = dynamic(
  async () => {
    const { WalletModalProvider } = await import('@solana/wallet-adapter-react-ui');
    return { default: WalletModalProvider };
  },
  { ssr: false }
);

interface SolanaProviderProps {
  children: ReactNode;
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  // State to track if component is mounted (client-side)
  const [mounted, setMounted] = useState(false);
  
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Initialize the wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );
  
  // Set mounted when component is mounted (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Error handler for wallet connection issues
  const onError = (error: Error) => {
    console.error('Wallet connection error:', error);
    // You could also add more sophisticated error handling here
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false} 
        onError={onError}
        localStorageKey="credcall-wallet-adapter"
      >
        {mounted ? (
          <WalletModalProvider>{children}</WalletModalProvider>
        ) : (
          children
        )}
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaProvider; 