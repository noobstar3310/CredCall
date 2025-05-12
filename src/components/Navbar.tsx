"use client";

import Link from "next/link";
import { useState } from "react";
import WalletConnectButton from "./WalletConnectButton";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-background border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">
                CredCall
              </span>
            </Link>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            <Link
              href="/calls"
              className="px-3 py-2 text-sm font-medium text-foreground hover:opacity-80"
            >
              Token Calls
            </Link>
            <Link
              href="/create"
              className="px-3 py-2 text-sm font-medium text-foreground hover:opacity-80"
            >
              Create Call
            </Link>
            <Link
              href="/profile"
              className="px-3 py-2 text-sm font-medium text-foreground hover:opacity-80"
            >
              My Profile
            </Link>
            <WalletConnectButton />
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:opacity-80 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/calls"
              className="block px-3 py-2 text-base font-medium text-foreground hover:opacity-80"
            >
              Token Calls
            </Link>
            <Link
              href="/create"
              className="block px-3 py-2 text-base font-medium text-foreground hover:opacity-80"
            >
              Create Call
            </Link>
            <Link
              href="/profile"
              className="block px-3 py-2 text-base font-medium text-foreground hover:opacity-80"
            >
              My Profile
            </Link>
            <div className="px-3 py-2">
              <WalletConnectButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
