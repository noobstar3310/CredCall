"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, Connection, PublicKey } from "@solana/web3.js";
import { createTradeCall } from "@/services/solanaProgram";
import dynamic from "next/dynamic";

export default function CreateCallPage() {
  const { publicKey, connected, disconnect } = useWallet();
  const [tokenAddress, setTokenAddress] = useState("");
  const [rationale, setRationale] = useState("");
  const [stakingAmount, setStakingAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [solBalance, setSolBalance] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);

  const WalletMultiButton = dynamic(
    async () => {
      const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
      return { default: WalletMultiButton };
    },
    { ssr: false }
  );

  useEffect(() => {
    const getWalletBalance = async () => {
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
          const balance = walletBalance / LAMPORTS_PER_SOL;

          // Set the balance state
          setSolBalance(balance);

          // Log wallet address and balance to console
          console.log("Wallet Address:", publicKey.toString());
          console.log("Wallet Balance:", balance, "SOL");
        } catch (error) {
          console.error("Error fetching balance:", error);
          setSolBalance(0);
        }
      }
    };

    if (connected) {
      getWalletBalance();
    } else {
      setSolBalance(0);
    }
  }, [publicKey, connected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!tokenAddress) {
      setFormError("Token address is required.");
      return;
    }

    if (!stakingAmount || parseFloat(stakingAmount) <= 0) {
      setFormError("A valid staking amount is required.");
      return;
    }

    if (parseFloat(stakingAmount) > solBalance) {
      setFormError("Staking amount exceeds your balance.");
      return;
    }

    // Validate token address format
    try {
      new PublicKey(tokenAddress);
    } catch (err) {
      setFormError("Invalid token address format.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setSuccess(null);

    try {
      // Convert staking amount to lamports
      const stakeAmountInLamports = Math.floor(parseFloat(stakingAmount) * LAMPORTS_PER_SOL);
      
      // Call the createTradeCall function
      const tx = await createTradeCall(window.solana, tokenAddress, stakeAmountInLamports);
      
      setSuccess(`Trade call created successfully! Transaction: ${tx}`);
      
      // Clear form
      setTokenAddress("");
      setStakingAmount("");
      setRationale("");
      
      // Redirect to calls page after a short delay
      setTimeout(() => {
        window.location.href = "/calls";
      }, 2000);
    } catch (err) {
      console.error("Error creating trade call:", err);
      if (err instanceof Error) {
        if (err.message.includes("User rejected the request")) {
          setFormError("Transaction was rejected. Please approve the transaction in your wallet to create the trade call.");
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("Failed to create trade call. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to calculate call visibility based on staking amount
  const calculateVisibility = (amount: string) => {
    const value = parseFloat(amount) || 0;

    if (value >= 20) return "High";
    if (value >= 10) return "Medium";
    if (value >= 5) return "Low";
    return "Minimal";
  };

  // Helper function to shorten address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Create a Token Call
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Stake SOL to publish a public token call. The more you stake, the higher
        visibility your call receives.
      </p>

      {!connected ? (
        <div className="bg-background rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-800 text-center">
          <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to connect your wallet to create a token call.
          </p>
          <div className="flex justify-center">
            <WalletMultiButton className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium px-6 py-3" />
          </div>
        </div>
      ) : (
        <div className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-gray-500">Connected Wallet</p>
              <p className="font-mono font-medium">
                {publicKey ? shortenAddress(publicKey.toString()) : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p className="font-mono font-medium">
                {solBalance.toFixed(4)} SOL
              </p>
            </div>
            <button
              onClick={() => disconnect()}
              className="text-sm text-gray-500 hover:text-foreground"
            >
              Disconnect
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
                {formError}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-200">
                {success}
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="tokenAddress"
                className="block text-sm font-medium mb-2"
              >
                Token Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="tokenAddress"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="Enter the token address (e.g., So11111111111111111111111111111111111111112)"
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 font-mono text-sm"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Make sure to enter the correct token address. This will be used
                for price tracking.
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="staking"
                className="block text-sm font-medium mb-2"
              >
                Staking Amount (SOL) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="staking"
                  min="1"
                  step="0.1"
                  max={solBalance}
                  value={stakingAmount}
                  onChange={(e) => setStakingAmount(e.target.value)}
                  placeholder="Enter amount to stake"
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 font-mono text-sm"
                  required
                />
                <div className="absolute right-3 top-3 text-sm text-gray-500">
                  SOL
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Call Visibility
                </h3>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (parseFloat(stakingAmount) || 0) * 5
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[60px]">
                    {calculateVisibility(stakingAmount)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  The more SOL you stake, the higher visibility your call
                  receives on the platform.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="rationale"
                className="block text-sm font-medium mb-2"
              >
                Call Rationale (Optional)
              </label>
              <textarea
                id="rationale"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Explain your reasoning for making this token call..."
                rows={4}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm"
              ></textarea>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Call Conditions</h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  If the token price increases by {">"}10% or more, your call
                  will be considered good, your stake will be returned, and your
                  on-chain reputation will increase.
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-4 w-4 text-red-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  If the token price drops by {">"}50% or more, your call will
                  be considered bad, your stake will be slashed and
                  redistributed to verified followers.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium px-6 py-3 flex-1 ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Creating Trade Call..." : "Submit Token Call"}
              </button>
              <Link
                href="/calls"
                className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium px-6 py-3 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
