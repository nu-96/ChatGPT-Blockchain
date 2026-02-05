#!/bin/bash

# Load environment variables if they exist
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

echo "🚀 Deploying Payment.sol to Sepolia..."

# Check requirements
if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo "❌ Error: SEPOLIA_RPC_URL is not set."
    echo "Please set it with: export SEPOLIA_RPC_URL=your_rpc_url"
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY is not set."
    echo "Please set it with: export PRIVATE_KEY=your_private_key"
    exit 1
fi

# Deploy
forge create --rpc-url $SEPOLIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    src/Payment.sol:Payment

echo "✅ Deployment complete!"
echo "-----------------------------------"
echo "IMPORTANT: Copy the 'Deployed to:' address above."
echo "Paste it into 'frontend/index.js' at the CONTRACT_ADDRESS variable."
echo "-----------------------------------"
