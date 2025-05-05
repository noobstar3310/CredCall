import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-gray-50 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-12">
            <div className="md:w-1/2">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
                Trustless Token Call Verification
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                The first platform that holds KOLs accountable for their token calls through on-chain verification, staking, and performance tracking.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/calls"
                  className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-opacity-90 font-medium px-6 py-3 text-center"
                >
                  Explore Calls
                </Link>
                <Link
                  href="/create"
                  className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium px-6 py-3 text-center"
                >
                  Create Call
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-background rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                {/* Placeholder for a token call card preview */}
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="ml-3">
                    <p className="font-medium">CryptoWhale</p>
                    <p className="text-sm text-gray-500">10 SOL staked</p>
                  </div>
                  <div className="ml-auto px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Token:</span>
                    <span className="font-mono text-sm">SOL</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Call Price:</span>
                    <span className="font-mono text-sm">$106.25</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Current Price:</span>
                    <span className="font-mono text-sm text-green-600">$118.42 (+11.4%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Followers:</span>
                    <span className="font-mono text-sm">28</span>
                  </div>
                </div>
                <button className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm font-medium">
                  Follow This Call
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How CredCall Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              A transparent and accountable platform that tracks the performance of token calls made by KOLs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">KOLs Stake SOL</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Key Opinion Leaders stake SOL to make token calls public. The more staked, the higher visibility the call receives.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Track Performance</h3>
              <p className="text-gray-600 dark:text-gray-300">
                The system automatically tracks token price movements and follower participation to evaluate call performance.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Rewards & Consequences</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Good calls ({'>'}10% pump) earn reputation and stake return. Bad calls ({'>'}50% dump) result in stake slashing and redistribution to followers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Calls Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Featured Token Calls</h2>
            <Link href="/calls" className="text-blue-600 dark:text-blue-400 hover:underline">
              View All Calls →
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sample calls would go here */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-background rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="ml-3">
                    <p className="font-medium">Caller #{i}</p>
                    <p className="text-xs text-gray-500">{2 + i} SOL staked</p>
                  </div>
                  <div className="ml-auto px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {i % 2 === 0 ? "Active" : "Completed"}
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-500">Token:</span>
                    <span className="font-mono text-xs">TOKEN #{i}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-500">Current:</span>
                    <span className="font-mono text-xs text-green-600">+{i * 5}%</span>
                  </div>
                </div>
                <Link href={`/calls/${i}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
