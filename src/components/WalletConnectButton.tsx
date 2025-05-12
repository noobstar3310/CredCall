"use client";

import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";

interface WalletConnectButtonProps {
  className?: string;
}

const WalletConnectButton: FC<WalletConnectButtonProps> = ({ className }) => {
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    const getBalance = async () => {
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

          // Log wallet address and balance to console
          console.log("Wallet Address:", publicKey.toString());
          console.log("Wallet Balance:", solBalance, "SOL");
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    if (connected) {
      getBalance();
    }
  }, [publicKey, connected]);

  return (
    <div className={className}>
      <WalletMultiButton className="rounded-full border border-solid transition-colors flex items-center justify-center hover:bg-opacity-90 font-medium px-6 py-3 text-center" />
    </div>
  );
};

export default WalletConnectButton;
