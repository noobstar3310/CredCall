# Setting Up Moralis Integration for Token Verification

This document explains how to set up the Moralis API integration for token verification in the CredCall application.

## Requirements

1. Install the Moralis dependency:
   ```
   npm install moralis
   ```

2. Create a Moralis account and get an API key from [Moralis.io](https://moralis.io/)

## Environment Setup

Create a `.env.local` file at the root of your project with the following content:

```
# For server-side API routes
MORALIS_API_KEY=YOUR_MORALIS_API_KEY

# For client-side components (browser)
NEXT_PUBLIC_MORALIS_API_KEY=YOUR_MORALIS_API_KEY
```

Replace `YOUR_MORALIS_API_KEY` with the actual API key you obtained from Moralis.

**Important**: After changing environment variables, restart your Next.js development server for the changes to take effect.

## Client-Side vs. Server-Side Usage

- **Client-side components** (like React components) must use the `NEXT_PUBLIC_MORALIS_API_KEY` environment variable.
- **Server-side components** (like API routes) should use the `MORALIS_API_KEY` environment variable.

This is due to how Next.js handles environment variables - only those prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## How Token Verification Works

1. When a user attempts to claim rewards for a failed trade call, we first verify that they actually own the token mentioned in the trade call.

2. The application makes an API request to our backend endpoint `/api/verify-token-ownership`.

3. The backend uses Moralis API to check if the user's wallet contains the specified token.

4. If the user owns the token, they can proceed with claiming rewards. Otherwise, they are informed that they need to purchase the token first.

## Network Configuration

The application is configured to use Solana **mainnet** for token verification. This is important because:

1. We need to check the user's actual token holdings on mainnet
2. Devnet tokens are not useful for verification as they don't represent real token purchases
3. The trade call program may be deployed on devnet for testing, but token verification must happen on mainnet

## Advanced Implementation (Future)

For a more complete implementation, we should:

1. Check when the token was purchased to ensure it was before or around the trade call time
2. Verify the user has a sufficient balance of the token
3. Implement transaction history verification

This would require additional Moralis API calls and potentially other data sources.

## Troubleshooting

If you encounter issues with Moralis API:

1. Ensure your API key is correctly set in the environment variables
2. Check the Moralis API documentation for any recent changes
3. Verify your rate limits haven't been exceeded
4. Check that you're using "mainnet" as the network parameter (not "devnet")
5. If you see 401 Unauthorized errors, check that you're using the correct environment variable for the context (client vs. server)
6. After updating environment variables, always restart your development server 