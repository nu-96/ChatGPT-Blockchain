/**
 * Web3GPT Universal Wallet Connection
 * Supports: MetaMask, Coinbase Wallet, WalletConnect (300+ wallets), Phantom, etc.
 */

// Contract addresses per network - update these with your deployed addresses
const CONTRACT_ADDRESSES = {
    31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Localhost
    84532: "", // Base Sepolia - add your deployed address
    8453: "",  // Base Mainnet - add your deployed address
    1: "",     // Ethereum Mainnet - add your deployed address
    11155111: "" // Sepolia - add your deployed address
};

const ABI = [
    {
        "type": "constructor",
        "inputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "receive",
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "getBalance",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "owner",
        "inputs": [],
        "outputs": [{ "name": "", "type": "address", "internalType": "address payable" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "pay",
        "inputs": [],
        "outputs": [],
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "withdraw",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "event",
        "name": "PaymentReceived",
        "inputs": [
            { "name": "from", "type": "address", "indexed": true, "internalType": "address" },
            { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "Withdrawal",
        "inputs": [
            { "name": "to", "type": "address", "indexed": true, "internalType": "address" },
            { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
        ],
        "anonymous": false
    }
];

// Network configurations for switching
const NETWORK_CONFIG = {
    84532: {
        chainId: '0x14a34',
        chainName: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia.base.org'],
        blockExplorerUrls: ['https://sepolia.basescan.org']
    },
    8453: {
        chainId: '0x2105',
        chainName: 'Base',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org'],
        blockExplorerUrls: ['https://basescan.org']
    },
    11155111: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://rpc.sepolia.org'],
        blockExplorerUrls: ['https://sepolia.etherscan.io']
    }
};

// State
let web3Modal;
let provider;
let signer;
let contract;
let currentAddress;
let currentChainId;
let walletProvider; // Raw provider from wallet

// DOM Elements
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const submitBtn = document.getElementById('submit-btn');
const withdrawBtn = document.getElementById('withdraw-btn');
const walletStatus = document.getElementById('wallet-status');
const paymentStatus = document.getElementById('payment-status');
const chatForm = document.getElementById('chat-form');
const responseDiv = document.getElementById('response');
const networkSelect = document.getElementById('network-select');

/**
 * Initialize Web3Modal with provider options
 */
function initWeb3Modal() {
    const providerOptions = {
        // WalletConnect - supports 300+ wallets
        walletconnect: {
            package: window.WalletConnectProvider?.default || window.WalletConnectProvider,
            options: {
                rpc: {
                    1: "https://eth-mainnet.g.alchemy.com/v2/demo",
                    8453: "https://mainnet.base.org",
                    84532: "https://sepolia.base.org",
                    11155111: "https://rpc.sepolia.org",
                    31337: "http://localhost:8545"
                }
            }
        }
    };

    // Override the injected provider detection to include CLV and other wallets
    const injectedProvider = getInjectedProvider();
    
    web3Modal = new Web3Modal.default({
        cacheProvider: true,
        providerOptions,
        theme: {
            background: "#1e293b",
            main: "#f8fafc",
            secondary: "#94a3b8",
            border: "#334155",
            hover: "#334155"
        }
    });
}

/**
 * Direct connect for wallets not detected by Web3Modal (like CLV)
 */
async function connectDirect() {
    const injectedProvider = getInjectedProvider();
    
    if (!injectedProvider) {
        throw new Error('No wallet found. Please install a wallet extension.');
    }
    
    await injectedProvider.request({ method: 'eth_requestAccounts' });
    return injectedProvider;
}

/**
 * Detect all available wallet providers
 */
function detectWalletProviders() {
    const providers = [];
    
    // MetaMask
    if (window.ethereum?.isMetaMask) {
        providers.push({ name: 'MetaMask', provider: window.ethereum });
    }
    
    // Coinbase Wallet
    if (window.ethereum?.isCoinbaseWallet) {
        providers.push({ name: 'Coinbase Wallet', provider: window.ethereum });
    }
    
    // Phantom (Ethereum)
    if (window.phantom?.ethereum) {
        providers.push({ name: 'Phantom', provider: window.phantom.ethereum });
    }
    
    // CLV (Clover) Wallet
    if (window.clover) {
        providers.push({ name: 'CLV Wallet', provider: window.clover });
    }
    
    // Trust Wallet
    if (window.ethereum?.isTrust) {
        providers.push({ name: 'Trust Wallet', provider: window.ethereum });
    }
    
    // Brave Wallet
    if (window.ethereum?.isBraveWallet) {
        providers.push({ name: 'Brave Wallet', provider: window.ethereum });
    }
    
    // Generic fallback
    if (window.ethereum && providers.length === 0) {
        providers.push({ name: 'Browser Wallet', provider: window.ethereum });
    }
    
    return providers;
}

/**
 * Get the best available provider (checks multiple injection points)
 */
function getInjectedProvider() {
    // Check for CLV/Clover first since it uses a different namespace
    if (window.clover) return window.clover;
    // Check Phantom Ethereum
    if (window.phantom?.ethereum) return window.phantom.ethereum;
    // Default to window.ethereum
    return window.ethereum;
}

/**
 * Connect wallet using Web3Modal with fallback to direct connection
 */
async function connectWallet() {
    try {
        // First, try to detect CLV or other non-standard wallets
        const injectedProvider = getInjectedProvider();
        
        // If we have an injected provider that's not standard ethereum, connect directly
        if (window.clover || (injectedProvider && !window.ethereum)) {
            console.log('Using direct connection for non-standard wallet');
            walletProvider = await connectDirect();
        } else {
            // Use Web3Modal for standard wallets
            walletProvider = await web3Modal.connect();
        }
        
        // Create ethers provider
        provider = new ethers.providers.Web3Provider(walletProvider);
        signer = provider.getSigner();
        currentAddress = await signer.getAddress();
        
        const network = await provider.getNetwork();
        currentChainId = network.chainId;
        
        // Update UI
        updateWalletUI();
        
        // Set up contract
        await setupContract();
        
        // Set up event listeners for wallet events
        setupWalletEvents();
        
        // Show disconnect button
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'block';
        
    } catch (error) {
        console.error('Connection error:', error);
        if (error.message !== 'Modal closed by user') {
            // Try direct connection as last resort
            try {
                console.log('Web3Modal failed, trying direct connection...');
                walletProvider = await connectDirect();
                provider = new ethers.providers.Web3Provider(walletProvider);
                signer = provider.getSigner();
                currentAddress = await signer.getAddress();
                
                const network = await provider.getNetwork();
                currentChainId = network.chainId;
                
                updateWalletUI();
                await setupContract();
                setupWalletEvents();
                
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'block';
            } catch (directError) {
                walletStatus.innerHTML = `<span class="error">Connection failed: ${directError.message}</span>`;
            }
        }
    }
}

/**
 * Disconnect wallet
 */
async function disconnectWallet() {
    if (web3Modal) {
        await web3Modal.clearCachedProvider();
    }
    
    if (walletProvider?.disconnect) {
        await walletProvider.disconnect();
    }
    
    // Reset state
    provider = null;
    signer = null;
    contract = null;
    currentAddress = null;
    currentChainId = null;
    walletProvider = null;
    
    // Reset UI
    walletStatus.innerHTML = 'Wallet not connected';
    connectBtn.innerText = 'Connect Wallet';
    connectBtn.style.display = 'block';
    disconnectBtn.style.display = 'none';
    submitBtn.disabled = true;
    withdrawBtn.disabled = true;
}

/**
 * Set up wallet event listeners
 */
function setupWalletEvents() {
    if (!walletProvider) return;
    
    // Account changed
    walletProvider.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
            await disconnectWallet();
        } else {
            currentAddress = accounts[0];
            updateWalletUI();
            await setupContract();
        }
    });
    
    // Chain changed
    walletProvider.on('chainChanged', async (chainId) => {
        currentChainId = parseInt(chainId, 16);
        networkSelect.value = currentChainId.toString();
        updateWalletUI();
        await setupContract();
    });
    
    // Disconnect
    walletProvider.on('disconnect', async () => {
        await disconnectWallet();
    });
}

/**
 * Update wallet UI display
 */
function updateWalletUI() {
    const shortAddress = `${currentAddress.substring(0, 6)}...${currentAddress.substring(38)}`;
    const selectedNetwork = parseInt(networkSelect.value);
    const isCorrectNetwork = currentChainId === selectedNetwork;
    
    const networkName = getNetworkName(currentChainId);
    const networkBadgeClass = isCorrectNetwork ? '' : 'wrong';
    
    walletStatus.innerHTML = `
        <div class="wallet-info">
            <span class="info">${shortAddress}</span>
            <span class="network-badge ${networkBadgeClass}">${networkName}</span>
        </div>
    `;
    
    if (!isCorrectNetwork) {
        walletStatus.innerHTML += `<div style="margin-top: 0.5rem; color: var(--error);">Please switch to ${getNetworkName(selectedNetwork)}</div>`;
    }
}

/**
 * Get network name from chain ID
 */
function getNetworkName(chainId) {
    const names = {
        1: 'Ethereum',
        8453: 'Base',
        84532: 'Base Sepolia',
        11155111: 'Sepolia',
        31337: 'Localhost'
    };
    return names[chainId] || `Chain ${chainId}`;
}

/**
 * Set up contract instance
 */
async function setupContract() {
    const selectedNetwork = parseInt(networkSelect.value);
    const contractAddress = CONTRACT_ADDRESSES[selectedNetwork];
    
    if (!contractAddress) {
        submitBtn.disabled = true;
        withdrawBtn.disabled = true;
        paymentStatus.innerHTML = `<span class="error">No contract deployed on ${getNetworkName(selectedNetwork)}</span>`;
        return;
    }
    
    if (currentChainId !== selectedNetwork) {
        submitBtn.disabled = true;
        return;
    }
    
    try {
        contract = new ethers.Contract(contractAddress, ABI, signer);
        submitBtn.disabled = false;
        
        // Check if user is owner
        const ownerAddress = await contract.owner();
        withdrawBtn.disabled = currentAddress.toLowerCase() !== ownerAddress.toLowerCase();
        
        paymentStatus.innerHTML = '';
    } catch (error) {
        console.error('Contract setup error:', error);
        paymentStatus.innerHTML = `<span class="error">Contract error: ${error.message}</span>`;
        submitBtn.disabled = true;
    }
}

/**
 * Switch to selected network
 */
async function switchNetwork(chainId) {
    if (!walletProvider) return;
    
    const hexChainId = '0x' + chainId.toString(16);
    
    try {
        await walletProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId }]
        });
    } catch (switchError) {
        // Chain not added - try to add it
        if (switchError.code === 4902 && NETWORK_CONFIG[chainId]) {
            try {
                await walletProvider.request({
                    method: 'wallet_addEthereumChain',
                    params: [NETWORK_CONFIG[chainId]]
                });
            } catch (addError) {
                console.error('Failed to add network:', addError);
            }
        }
    }
}

/**
 * Handle payment and form submission
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!contract) {
        alert("Please connect your wallet first!");
        return;
    }
    
    const question = document.getElementById('question').value;
    
    try {
        paymentStatus.innerHTML = "Awaiting payment confirmation...";
        submitBtn.disabled = true;
        
        // Call the pay function with 0.001 ETH
        const tx = await contract.pay({
            value: ethers.utils.parseEther("0.001")
        });
        
        const explorerUrl = getExplorerUrl(currentChainId, tx.hash);
        paymentStatus.innerHTML = `Payment pending: <a href="${explorerUrl}" target="_blank">View Tx</a>`;
        
        await tx.wait();
        paymentStatus.innerHTML = `<span class="info">Payment confirmed! Submitting question...</span>`;
        
        // Submit to backend
        responseDiv.innerHTML = 'Thinking...';
        const response = await fetch('http://localhost:8000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question }),
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            responseDiv.innerText = data.answer;
        } else {
            responseDiv.innerText = 'Error: ' + data.message;
        }
    } catch (error) {
        console.error(error);
        paymentStatus.innerHTML = `<span class="error">Payment failed: ${error.message}</span>`;
    } finally {
        submitBtn.disabled = false;
    }
}

/**
 * Handle withdraw
 */
async function handleWithdraw() {
    if (!contract) return;
    
    try {
        paymentStatus.innerHTML = "Processing withdrawal...";
        withdrawBtn.disabled = true;
        
        const tx = await contract.withdraw();
        const explorerUrl = getExplorerUrl(currentChainId, tx.hash);
        paymentStatus.innerHTML = `Withdrawal pending: <a href="${explorerUrl}" target="_blank">View Tx</a>`;
        
        await tx.wait();
        paymentStatus.innerHTML = `<span class="info">Withdrawal successful!</span>`;
    } catch (error) {
        console.error(error);
        paymentStatus.innerHTML = `<span class="error">Withdrawal failed: ${error.message}</span>`;
    } finally {
        withdrawBtn.disabled = false;
    }
}

/**
 * Get block explorer URL for transaction
 */
function getExplorerUrl(chainId, txHash) {
    const explorers = {
        1: 'https://etherscan.io',
        8453: 'https://basescan.org',
        84532: 'https://sepolia.basescan.org',
        11155111: 'https://sepolia.etherscan.io',
        31337: null
    };
    
    const base = explorers[chainId];
    if (!base) return `javascript:alert('Tx Hash: ${txHash}')`;
    return `${base}/tx/${txHash}`;
}

// Event Listeners
connectBtn.addEventListener('click', connectWallet);
disconnectBtn.addEventListener('click', disconnectWallet);
chatForm.addEventListener('submit', handleSubmit);
withdrawBtn.addEventListener('click', handleWithdraw);

networkSelect.addEventListener('change', async (e) => {
    const newChainId = parseInt(e.target.value);
    if (currentChainId && currentChainId !== newChainId) {
        await switchNetwork(newChainId);
    }
    await setupContract();
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initWeb3Modal();
    
    // Auto-connect if previously connected
    if (web3Modal.cachedProvider) {
        connectWallet();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        detectWalletProviders,
        getNetworkName,
        getExplorerUrl,
        CONTRACT_ADDRESSES,
        ABI
    };
}
