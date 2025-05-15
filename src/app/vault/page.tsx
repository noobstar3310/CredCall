'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import { createUserVault, depositToVault, withdrawFromVault, WalletAdapter } from '@/services/solanaProgram';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getConnection } from '@/services/solanaProgram';

export default function VaultPage() {
  const { publicKey, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [hasVault, setHasVault] = useState(false);
  const [vaultBalance, setVaultBalance] = useState<number>(0);

  const checkVaultStatus = useCallback(async () => {
    if (!publicKey) return;

    try {
      const connection = getConnection();
      const [userVault] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_vault'), publicKey.toBuffer()],
        new PublicKey('DeTE4KgCH6uZnu7XxcsR62z4ke7Z4LTRxMFZZPd488GY')
      );

      const accountInfo = await connection.getAccountInfo(userVault);
      setHasVault(accountInfo !== null);

      if (accountInfo) {
        // Get the vault's SOL balance
        const balance = accountInfo.lamports;
        setVaultBalance(balance);
      }
    } catch (err) {
      console.error('Error checking vault status:', err);
      setHasVault(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      checkVaultStatus();
    }
  }, [connected, publicKey, checkVaultStatus]);

  const handleCreateVault = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Cast window.solana to the proper type expected by the function
      const tx = await createUserVault(window.solana as unknown as WalletAdapter);
      setSuccess(`Vault created successfully! Transaction: ${tx}`);
      setHasVault(true);
      // Refresh vault status after creation
      await checkVaultStatus();
    } catch (err) {
      console.error('Error creating vault:', err);
      if (err instanceof Error) {
        if (err.message.includes('User rejected the request')) {
          setError('Transaction was rejected. Please approve the transaction in your wallet to create the vault.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create vault. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amountInLamports = Math.floor(Number(depositAmount) * LAMPORTS_PER_SOL);
      const tx = await depositToVault(window.solana as unknown as WalletAdapter, amountInLamports);
      setSuccess(`Deposit successful! Transaction: ${tx}`);
      setDepositAmount('');
      // Refresh vault status after deposit
      await checkVaultStatus();
    } catch (err) {
      console.error('Error depositing:', err);
      if (err instanceof Error) {
        if (err.message.includes('User rejected the request')) {
          setError('Transaction was rejected. Please approve the transaction in your wallet to deposit funds.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to deposit. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const amountInLamports = Math.floor(Number(withdrawAmount) * LAMPORTS_PER_SOL);
    if (amountInLamports > vaultBalance) {
      setError('Insufficient balance in vault');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const tx = await withdrawFromVault(window.solana as unknown as WalletAdapter, amountInLamports);
      setSuccess(`Withdrawal successful! Transaction: ${tx}`);
      setWithdrawAmount('');
      // Refresh vault status after withdrawal
      await checkVaultStatus();
    } catch (err) {
      console.error('Error withdrawing:', err);
      if (err instanceof Error) {
        if (err.message.includes('User rejected the request')) {
          setError('Transaction was rejected. Please approve the transaction in your wallet to withdraw funds.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to withdraw. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to access the vault.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">User Vault</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {hasVault && (
          <div className="bg-gray-50 dark:bg-gray-200 p-4 rounded-lg mb-6">
            <h3 className="text-lg text-black font-medium mb-2">Vault Balance</h3>
            <p className=" text-black text-2xl">
              {(vaultBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL <Image src="/Solana_logo.png" alt="SOL" width={24} height={24} className="inline-block ml-1 mb-1" />
            </p>
          </div>
        )}

        {!hasVault ? (
          <div className="space-y-4">
            <p className="text-gray-600">You need to create a vault before you can deposit or withdraw funds.</p>
            <button
              onClick={handleCreateVault}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Vault'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-black">
                Deposit <Image src="/Solana_logo.png" alt="SOL" width={20} height={20} className="inline-block mx-1 mb-1" />
              </h3>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  name="deposit"
                  id="deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  <Image src="/Solana_logo.png" alt="SOL" width={16} height={16} className="inline-block" />
                </span>
              </div>
              <button
                onClick={handleDeposit}
                disabled={isLoading}
                className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Depositing...' : 'Deposit'}
              </button>
            </div>

            <div>
              <h3 className=" text-black text-lg font-medium mb-4">
                Withdraw <Image src="/Solana_logo.png" alt="SOL" width={20} height={20} className="inline-block mx-1 mb-1" />
              </h3>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  name="withdraw"
                  id="withdraw"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  max={vaultBalance / LAMPORTS_PER_SOL}
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  <Image src="/Solana_logo.png" alt="SOL" width={16} height={16} className="inline-block" />
                </span>
              </div>
              <button
                onClick={handleWithdraw}
                disabled={isLoading}
                className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 