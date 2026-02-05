# Web3GPT Universal Wallet Connection

Updated frontend with support for **any Ethereum wallet**.

## Supported Wallets

- ✅ MetaMask
- ✅ Coinbase Wallet
- ✅ Phantom (Ethereum)
- ✅ Trust Wallet
- ✅ Brave Wallet
- ✅ Rainbow
- ✅ WalletConnect (300+ mobile wallets)
- ✅ Any EIP-1193 compatible wallet

## What Changed

### `index.html`
- Added Web3Modal and WalletConnect CDN scripts
- Added network selector dropdown
- Added disconnect button
- Network badge shows current connection status

### `index.js`
- **Web3Modal Integration** - Universal wallet connection modal
- **Multi-network support** - Localhost, Base Sepolia, Base Mainnet, Ethereum, Sepolia
- **Auto network switching** - Prompts user to switch/add networks
- **Wallet event handling** - Responds to account/network changes
- **Disconnect support** - Clean disconnection flow
- **Contract address mapping** - Per-network contract addresses
- **Block explorer links** - Dynamic based on network

## Setup

1. Copy `index.html` and `index.js` to your `frontend/` folder
2. Update `CONTRACT_ADDRESSES` in `index.js` with your deployed contract addresses:

```javascript
const CONTRACT_ADDRESSES = {
    31337: "0x...",   // Localhost
    84532: "0x...",   // Base Sepolia
    8453: "0x...",    // Base Mainnet
    // etc.
};
```

3. Serve the frontend (e.g., `npx serve frontend/`)

## Testing

### Automated Tests (Jest)

```bash
cd test
npm install jest
npx jest wallet-connection.test.js
```

### Browser Tests

1. Open `test/test-runner.html` in a browser
2. Click "Run All Tests"
3. Follow prompts to connect wallet

### Manual Test Checklist

- [ ] Connect with MetaMask
- [ ] Connect with Coinbase Wallet
- [ ] Connect via WalletConnect QR
- [ ] Switch networks from dropdown
- [ ] Disconnect and reconnect
- [ ] Switch accounts in wallet
- [ ] Complete payment flow
- [ ] Owner withdraw (if applicable)

## Network Configuration

To add a new network, update `NETWORK_CONFIG` in `index.js`:

```javascript
const NETWORK_CONFIG = {
    YOUR_CHAIN_ID: {
        chainId: '0x...',  // Hex chain ID
        chainName: 'Your Network',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://your-rpc.com'],
        blockExplorerUrls: ['https://your-explorer.com']
    }
};
```

Then add the chain ID to `CONTRACT_ADDRESSES` and the network `<select>` in HTML.

## Files

```
chatgpt-blockchain-update/
├── index.html          # Updated frontend
├── index.js            # Universal wallet logic
├── README.md           # This file
└── test/
    ├── wallet-connection.test.js  # Jest tests
    └── test-runner.html           # Browser test page
```
