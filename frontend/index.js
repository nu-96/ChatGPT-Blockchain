const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Updated with deployed contract address
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
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "owner",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address payable"
            }
        ],
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
            {
                "name": "from",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "amount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "Withdrawal",
        "inputs": [
            {
                "name": "to",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "amount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    }
];

let provider;
let signer;
let contract;

const urlParams = new URLSearchParams(window.location.search);
const MOCK_WALLET = urlParams.get('mock_wallet') === 'true';

const connectBtn = document.getElementById('connect-btn');
const submitBtn = document.getElementById('submit-btn');
const withdrawBtn = document.getElementById('withdraw-btn');
const walletStatus = document.getElementById('wallet-status');
const paymentStatus = document.getElementById('payment-status');
const chatForm = document.getElementById('chat-form');
const responseDiv = document.getElementById('response');

// Simplified connection logic for better wallet compatibility (Phantom/MetaMask)
async function connectWallet() {
    if (MOCK_WALLET) {
        console.log("MOCK_WALLET mode active");
        const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

        walletStatus.innerHTML = `Connected (MOCK): <span class="info">${address.substring(0, 6)}...${address.substring(38)}</span>`;
        connectBtn.innerText = "Wallet Connected";
        submitBtn.disabled = false;

        contract = {
            owner: async () => "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            pay: async () => ({ hash: "0xMockTxHash", wait: async () => { } }),
            withdraw: async () => ({ hash: "0xMockTxHash", wait: async () => { } })
        };

        withdrawBtn.disabled = false;
        return;
    }

    const ethereumProvider = window.phantom?.ethereum || window.ethereum;

    if (typeof ethereumProvider !== 'undefined') {
        try {
            await ethereumProvider.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(ethereumProvider);
            signer = provider.getSigner();
            const address = await signer.getAddress();

            const { chainId } = await provider.getNetwork();
            if (chainId !== 11155111) {
                walletStatus.innerHTML = `
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin-top: 10px;">
                        <span class="error" style="font-weight: bold;">Wrong Network Detected</span><br>
                        <span style="font-size: 0.9rem; color: #9ca3af;">Please switch your wallet to <b>Sepolia Testnet</b> (Chain ID: 11155111).</span>
                    </div>
                `;
                return;
            }

            contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

            walletStatus.innerHTML = `Connected: <span class="info">${address.substring(0, 6)}...${address.substring(38)}</span>`;
            connectBtn.innerText = "Wallet Connected";
            submitBtn.disabled = false;

            // Check if user is owner to enable withdraw button
            const ownerAddress = await contract.owner();
            if (address.toLowerCase() === ownerAddress.toLowerCase()) {
                withdrawBtn.disabled = false;
            }
        } catch (error) {
            console.error(error);
            let errorMessage = error.message;
            if (error.code === 'CALL_EXCEPTION') {
                errorMessage = "Call Exception: Are you on the right network? Check if code exists at the contract address.";
            }
            walletStatus.innerHTML = `<span class="error">Connection failed: ${errorMessage}</span>`;
        }
    } else {
        walletStatus.innerHTML = `<span class="error">No Ethereum wallet (MetaMask/Phantom) detected!</span>`;
    }
}

async function handleWithdraw() {
    if (!contract) return;
    try {
        paymentStatus.innerHTML = "Processing withdrawal...";
        const tx = await contract.withdraw();
        paymentStatus.innerHTML = `Withdrawal pending: <a href="https://etherscan.io/tx/${tx.hash}" target="_blank">View Tx</a>`;
        await tx.wait();
        paymentStatus.innerHTML = `<span class="info">Withdrawal successful!</span>`;
    } catch (error) {
        console.error(error);
        paymentStatus.innerHTML = `<span class="error">Withdrawal failed: ${error.message}</span>`;
    }
}

chatForm.addEventListener('submit', async (e) => {
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

        paymentStatus.innerHTML = `Payment pending: <a href="#" onclick="alert('Tx Hash: ${tx.hash}')">View Tx</a>`;

        await tx.wait();
        paymentStatus.innerHTML = `<span class="info">Payment confirmed! Submitting question...</span>`;

        // Now submit to backend
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
        submitBtn.disabled = false;
    }
});

connectBtn.addEventListener('click', connectWallet);
withdrawBtn.addEventListener('click', handleWithdraw);
