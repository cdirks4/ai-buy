export const networkConfig = {
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
  name: process.env.NEXT_PUBLIC_CHAIN,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  blockExplorer: process.env.NEXT_PUBLIC_BLOCK_EXPLORER,
  contracts: {
    token: process.env.NEXT_PUBLIC_TOKEN_CONTRACT,
  },
};
