'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Set mounted state when component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to connect page if wallet is not connected
  useEffect(() => {
    if (mounted && !connected) {
      // Pass the current path as returnUrl
      router.push(`/connect?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, connected, router, pathname]);

  // Show nothing while checking wallet status or redirecting
  if (!mounted || !connected) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="h-12 w-12 mx-auto rounded-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  // If wallet is connected, render the children
  return <>{children}</>;
};

export default ProtectedRoute; 