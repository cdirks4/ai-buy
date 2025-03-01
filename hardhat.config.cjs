require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    flowEvmTestnet: {
      url: "https://testnet.evm.nodes.onflow.org",
      chainId: 545,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 60000,
      gasPrice: 1000000000, // 1 gwei
    },
    zircuitTestnet: {
      url: "https://rpc.testnet.zircuit.com",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 48899,
      gasPrice: "auto",
      verify: {
        etherscan: {
          apiUrl: "https://explorer.testnet.zircuit.com/api",
        },
      },
    },
    zkSyncTestnet: {
      url: "https://sepolia.era.zksync.dev",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 280, // Fix: Changed from 300 to 280
      zksync: true,
      ethNetwork: "sepolia",
      verifyURL:
        "https://explorer.sepolia.era.zksync.dev/contract_verification",
    },
    hederaTestnet: {
      url: "https://testnet.hashio.io/api",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 296,
      gasPrice: "auto",
    },
  },

  etherscan: {
    apiKey: {
      flowEvmTestnet: "any",
      zircuitTestnet: "any",
      hederaTestnet: "any",
    },
    customChains: [
      {
        network: "flowEvmTestnet",
        chainId: 545,
        urls: {
          apiURL: "https://evm-testnet.flowscan.io/api",
          browserURL: "https://evm-testnet.flowscan.io",
        },
      },
      {
        network: "zircuitTestnet",
        chainId: 48899,
        urls: {
          apiURL: "https://explorer.testnet.zircuit.com/api",
          browserURL: "https://explorer.testnet.zircuit.com",
        },
      },
      {
        network: "zkSyncTestnet",
        chainId: 300,
        urls: {
          apiURL: "https://explorer.sepolia.era.zksync.dev/api",
          browserURL: "https://sepolia.explorer.zksync.io",
        },
      },
      {
        network: "hederaTestnet",
        chainId: 296,
        urls: {
          apiURL: "https://testnet.hashscan.io/api",
          browserURL: "https://testnet.hashscan.io",
        },
      },
    ],
  },
};
