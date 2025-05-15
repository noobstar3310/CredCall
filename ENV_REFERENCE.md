# Environment Variables Reference

This file shows the required environment variables for the CredCall application.
Copy these to your `.env.local` file and replace the placeholder values with your actual API keys.

```
# Moralis API Key - This is used in server-side API routes
MORALIS_API_KEY=your_moralis_api_key_here

# Moralis API Key for client-side components - Must use NEXT_PUBLIC_ prefix
NEXT_PUBLIC_MORALIS_API_KEY=your_moralis_api_key_here

# Other environment variables can be added here
```

## Important Notes

1. The `NEXT_PUBLIC_` prefix is required for any environment variables that need to be accessed in the browser (client-side).

2. For optimal security, use different API keys with appropriate permissions for client-side and server-side operations.

3. Never commit your `.env.local` file to version control.

4. After changing environment variables, you need to restart your Next.js development server for the changes to take effect.

## Troubleshooting

If you're seeing 401 (Unauthorized) errors when calling the Moralis API:

1. Ensure your API key is correct and has not expired.
2. Check that you're using the correct environment variable in each context.
3. Verify you've restarted the Next.js server after updating environment variables.
4. For client-side requests, check the browser console to confirm the API key is being included in the request headers. 