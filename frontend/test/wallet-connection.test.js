/**
 * Wallet Connection Tests
 * Run with: npx jest test/wallet-connection.test.js
 * Or manually in browser console
 */

// Mock window.ethereum for testing
const mockEthereum = {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
};

// Import functions (adjust path as needed)
const {
    detectWalletProviders,
    getNetworkName,
    getExplorerUrl,
    CONTRACT_ADDRESSES,
    ABI
} = require('../index.js');

describe('Wallet Detection', () => {
    beforeEach(() => {
        // Reset mocks
        delete global.window;
        global.window = {};
    });

    test('detects MetaMask', () => {
        global.window.ethereum = { isMetaMask: true };
        const providers = detectWalletProviders();
        expect(providers.length).toBe(1);
        expect(providers[0].name).toBe('MetaMask');
    });

    test('detects Coinbase Wallet', () => {
        global.window.ethereum = { isCoinbaseWallet: true };
        const providers = detectWalletProviders();
        expect(providers.length).toBe(1);
        expect(providers[0].name).toBe('Coinbase Wallet');
    });

    test('detects Phantom', () => {
        global.window.phantom = { ethereum: {} };
        global.window.ethereum = null;
        const providers = detectWalletProviders();
        expect(providers.length).toBe(1);
        expect(providers[0].name).toBe('Phantom');
    });

    test('detects Trust Wallet', () => {
        global.window.ethereum = { isTrust: true };
        const providers = detectWalletProviders();
        expect(providers.length).toBe(1);
        expect(providers[0].name).toBe('Trust Wallet');
    });

    test('detects Brave Wallet', () => {
        global.window.ethereum = { isBraveWallet: true };
        const providers = detectWalletProviders();
        expect(providers.length).toBe(1);
        expect(providers[0].name).toBe('Brave Wallet');
    });

    test('falls back to generic provider', () => {
        global.window.ethereum = {};
        const providers = detectWalletProviders();
        expect(providers.length).toBe(1);
        expect(providers[0].name).toBe('Browser Wallet');
    });

    test('returns empty array when no wallet', () => {
        const providers = detectWalletProviders();
        expect(providers.length).toBe(0);
    });
});

describe('Network Utilities', () => {
    test('getNetworkName returns correct names', () => {
        expect(getNetworkName(1)).toBe('Ethereum');
        expect(getNetworkName(8453)).toBe('Base');
        expect(getNetworkName(84532)).toBe('Base Sepolia');
        expect(getNetworkName(11155111)).toBe('Sepolia');
        expect(getNetworkName(31337)).toBe('Localhost');
        expect(getNetworkName(999)).toBe('Chain 999');
    });

    test('getExplorerUrl returns correct URLs', () => {
        const txHash = '0x123abc';
        expect(getExplorerUrl(1, txHash)).toBe('https://etherscan.io/tx/0x123abc');
        expect(getExplorerUrl(8453, txHash)).toBe('https://basescan.org/tx/0x123abc');
        expect(getExplorerUrl(84532, txHash)).toBe('https://sepolia.basescan.org/tx/0x123abc');
        expect(getExplorerUrl(11155111, txHash)).toBe('https://sepolia.etherscan.io/tx/0x123abc');
    });

    test('getExplorerUrl handles localhost', () => {
        const url = getExplorerUrl(31337, '0x123');
        expect(url).toContain('alert');
    });
});

describe('Contract Configuration', () => {
    test('CONTRACT_ADDRESSES has expected networks', () => {
        expect(CONTRACT_ADDRESSES).toHaveProperty('31337');
        expect(CONTRACT_ADDRESSES).toHaveProperty('84532');
        expect(CONTRACT_ADDRESSES).toHaveProperty('8453');
        expect(CONTRACT_ADDRESSES).toHaveProperty('1');
        expect(CONTRACT_ADDRESSES).toHaveProperty('11155111');
    });

    test('ABI has required functions', () => {
        const functionNames = ABI
            .filter(item => item.type === 'function')
            .map(item => item.name);
        
        expect(functionNames).toContain('pay');
        expect(functionNames).toContain('withdraw');
        expect(functionNames).toContain('getBalance');
        expect(functionNames).toContain('owner');
    });

    test('ABI has required events', () => {
        const eventNames = ABI
            .filter(item => item.type === 'event')
            .map(item => item.name);
        
        expect(eventNames).toContain('PaymentReceived');
        expect(eventNames).toContain('Withdrawal');
    });
});

// Browser-based integration test checklist
const MANUAL_TEST_CHECKLIST = `
=== MANUAL WALLET CONNECTION TESTS ===

Run these tests in browser with the frontend running:

1. MetaMask Connection
   [ ] Click "Connect Wallet"
   [ ] MetaMask popup appears
   [ ] Select account and connect
   [ ] Address displays correctly
   [ ] Network badge shows correct network

2. Coinbase Wallet Connection
   [ ] Install Coinbase Wallet extension
   [ ] Click "Connect Wallet"
   [ ] Coinbase Wallet option appears
   [ ] Can successfully connect

3. WalletConnect (Mobile Wallets)
   [ ] Click "Connect Wallet"
   [ ] WalletConnect option appears
   [ ] QR code displays
   [ ] Scanning with mobile wallet works

4. Network Switching
   [ ] Select different network from dropdown
   [ ] Wallet prompts to switch network
   [ ] If network not added, prompts to add
   [ ] Contract updates after switch

5. Disconnect
   [ ] Click "Disconnect"
   [ ] Wallet state clears
   [ ] UI resets to disconnected state
   [ ] Can reconnect after disconnect

6. Account Change
   [ ] Connect wallet
   [ ] Switch account in wallet
   [ ] UI updates with new address

7. Payment Flow
   [ ] Connect to correct network
   [ ] Enter question
   [ ] Click "Pay 0.001 ETH & Submit"
   [ ] Transaction confirmation appears
   [ ] Payment status updates

8. Owner Withdraw
   [ ] Connect as contract owner
   [ ] Withdraw button becomes enabled
   [ ] Can successfully withdraw
`;

console.log(MANUAL_TEST_CHECKLIST);
