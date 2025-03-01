# DeFi Assistant Platform

An AI-powered DeFi trading companion built on the Mantle Network that helps users interact with decentralized exchanges through natural language commands and provides real-time market insights.

> 🏆 Submitted to Sozu AI Virtual Hack Week 3

**Live Demo**: [https://assist-me-six.vercel.app/](https://assist-me-six.vercel.app/)

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Usage](#usage)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

# Face Verification Bounty Platform

A decentralized bounty platform built on Flow EVM that allows users to create and claim bounties using facial recognition verification.

> 🏆 Submitted to ETH Denver 2024

**Live Demo**: [https://assist-me-six.vercel.app/](https://assist-me-six.vercel.app/)

## Overview

The Face Verification Bounty Platform is a web3 application that combines biometric verification with blockchain technology to create a secure and innovative bounty system. Running on the Flow EVM testnet, it enables users to create bounties that can only be claimed by specific individuals, verified through facial recognition.

## Features

- **Facial Recognition Bounties**
  - Create bounties tied to facial biometrics
  - Secure face verification system
  - Privacy-focused data handling
  - Automated reward distribution

- **Decentralized Identity**
  - Biometric-based verification
  - Privacy-preserving face matching
  - Secure IPFS data storage
  - Zero-knowledge proof integration

- **Smart Contract Integration**
  - Automated bounty management
  - Secure reward distribution
  - Transparent verification process
  - Flow EVM compatibility

## Technology Stack

- **Frontend**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Blockchain**: Flow EVM
- **Authentication**: Privy
- **Storage**: IPFS via Pinata
- **Face Analysis**: Custom AI Model
- **Smart Contracts**: Solidity

## Quick Start

1. Clone and install:
```bash
git clone <repository-url>
cd assist-me
npm install
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_CHAIN_ID=5003
NEXT_PUBLIC_CHAIN=mantle-sepolia
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_BLOCK_EXPLORER=https://explorer.sepolia.mantle.xyz
NEXT_PUBLIC_TOKEN_CONTRACT=your-token-contract
```

## Usage

1. **Connect Wallet**
   - Click "Login" in the navigation bar
   - Choose email or wallet connection method
   - Authorize connection to Mantle Sepolia network

2. **Create AI Agent Wallet**
   - Navigate to the home page
   - Click "Create Wallet" in the Get Started section
   - Fund your wallet with test MNT

3. **Trading**
   - Use the chat interface to execute trades
   - Type natural language commands like:
     - "wrap 0.1 MNT"
     - "show top pools"
     - "check recent trades"

4. **Market Analysis**
   - Visit the Markets page for real-time analytics
   - View top liquidity pools
   - Monitor recent trading activity
   - Track token prices and volumes

## Architecture

The application follows a modular architecture:

- `src/app/*` - Next.js pages and API routes
- `src/components/*` - Reusable React components
- `src/services/*` - Core business logic and blockchain interactions
- `src/hooks/*` - Custom React hooks for data fetching
- `src/context/*` - Global state management
- `src/lib/*` - Utility functions and helpers
- `src/constants/*` - Configuration and contract constants

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
