"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from 'next/dynamic';
import { LAMPORTS_PER_SOL, Connection, PublicKey } from "@solana/web3.js";

const WalletMultiButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return { default: WalletMultiButton };
  },
  { ssr: false }
);

export default function ConnectPage() {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    const getWalletInfo = async () => {
      if (publicKey) {
        try {
          // Connect to the Solana devnet
          const connection = new Connection(
            "https://api.devnet.solana.com",
            "confirmed"
          );

          // Get the wallet balance
          const walletBalance = await connection.getBalance(publicKey);

          // Convert lamports to SOL
          const solBalance = walletBalance / LAMPORTS_PER_SOL;

          // Set the balance state
          setBalance(solBalance);

          // Get recent transactions
          try {
            const signatures = await connection.getSignaturesForAddress(
              publicKey,
              { limit: 5 }
            );
            setRecentTransactions(signatures);
          } catch (err) {
            console.error("Error fetching transactions:", err);
            setRecentTransactions([]);
          }

          // Log wallet address and balance to console
          console.log("Wallet Address:", publicKey.toString());
          console.log("Wallet Balance:", solBalance, "SOL");
        } catch (error) {
          console.error("Error fetching wallet data:", error);
        }
      }
    };

    if (connected) {
      getWalletInfo();
    } else {
      setBalance(null);
      setRecentTransactions([]);
    }
  }, [publicKey, connected]);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Connect Your Wallet
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Connect your Solana wallet to start creating or following token calls.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center mb-8">
        <WalletMultiButton className="rounded-full border border-solid transition-colors flex items-center justify-center hover:bg-opacity-90 font-medium px-8 py-4 text-lg" />
      </div>

      {connected && publicKey ? (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-md max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Wallet Information</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-gray-600 dark:text-gray-300">Address:</span>
              <div className="flex flex-col items-end">
                <div className="font-mono text-sm break-all text-right">
                  {publicKey.toString()}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publicKey.toString());
                  }}
                  className="text-blue-600 dark:text-blue-400 text-xs hover:underline mt-1"
                >
                  Copy Address
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Balance:</span>
              <span className="font-mono">
                {balance !== null ? `${balance.toFixed(5)} SOL` : "Loading..."}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Network:</span>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                Devnet
              </span>
            </div>
          </div>

          {recentTransactions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-2">
                Recent Transactions:
              </h3>
              <div className="space-y-2">
                {recentTransactions.map((tx, i) => (
                  <div key={i} className="text-xs">
                    <a
                      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
                    >
                      {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                    </a>
                    <span className="text-gray-500 ml-2">
                      {new Date(tx.blockTime * 1000).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 max-w-2xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to see your account information.
          </p>
        </div>
      )}
    </div>
  );
}
