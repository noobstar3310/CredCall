import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-background border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-foreground font-semibold">
              CredCall
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Trustless, On-Chain Call Verification & Accountability
            </p>
          </div>
          
          <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <a 
              href="https://github.com/your-github/credcall" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} CredCall. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer; 