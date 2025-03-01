````markdown
# Face Verification Bounty Platform

A decentralized platform for creating and managing face-verification bounties using blockchain technology.

🎥 [Watch Demo Video](https://www.loom.com/share/36f8a82776474fe39ab4605d490627c2?sid=ea189b69-583d-4374-ae78-48e5f46732ec)

## Features

- Facial Recognition-based Bounty System
- Decentralized Identity Verification
- Secure IPFS Data Storage
- Smart Contract Integration
- Privacy-Preserving Face Matching
- Automated Reward Distribution

## Deployed Contracts

### Flow EVM Testnet

- PersonBounty Contract: [0x7a90bbC4D2278764DB01820Dd482d759428ddE91](https://evm-testnet.flowscan.io/address/0x7a90bbC4D2278764DB01820Dd482d759428ddE91)
- FaceRegistry Contract: [0x3E3490E3ad2F8de670B67Cd0704d00FdcfAb72f0](https://evm-testnet.flowscan.io/address/0x3E3490E3ad2F8de670B67Cd0704d00FdcfAb72f0)

### Zircuit Testnet

- PersonBounty Contract: [0xca5af4B9a6cd7dBDFdd039D28Cd198c529123B01](https://explorer.testnet.zircuit.com/address/0xca5af4B9a6cd7dBDFdd039D28Cd198c529123B01)
- FaceRegistry Contract: [0x5E9a18cDBE0cEf60d76538217226A31B8e964F5f](https://explorer.testnet.zircuit.com/address/0x5E9a18cDBE0cEf60d76538217226A31B8e964F5f)

## Prerequisites

- Node.js 18+
- Python 3.8+ (for face analysis)
- Metamask or compatible Web3 wallet
- OpenCV dependencies

## Quick Start

1. Clone the repository
2. Install dependencies:

```bash
npm install
```
````

````

3. Install Python dependencies:
```bash
pip install -r src/server/requirements.txt
````

4. Create .env file and configure:

- PRIVATE_KEY
- NEXT_PUBLIC_CONTRACT_ADDRESS
- PINATA_JWT
- NEXT_PUBLIC_RPC_URL

5. Start the development server:

```bash
npm run dev
```

## Project Structure

```plaintext
/
├── contracts/           # Smart contracts
│   ├── PersonBounty.sol
│   └── FaceRegistry.sol
├── scripts/            # Deployment scripts
├── src/
│   ├── server/        # Face analysis backend
│   └── components/    # Frontend components
└── assist-me/         # Next.js frontend app
```

## Core Features

### Face Verification

- Secure biometric data handling
- Privacy-preserving matching
- IPFS-based storage

### Bounty System

- Create bounties with rewards
- Verify and claim bounties
- Automated payment distribution

### Smart Contracts

- Decentralized identity management
- Secure reward distribution
- Transparent verification process

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
