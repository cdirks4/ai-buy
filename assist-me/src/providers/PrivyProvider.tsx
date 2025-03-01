"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useEffect } from "react";

interface PrivyProviderWrapperProps {
  children: React.ReactNode;
}

export function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#4287f5",
          showWalletLoginFirst: true,
        },
        defaultChain: {
          id: 545,
          name: "Flow EVM Testnet",
          rpcUrls: ["https://testnet.evm.nodes.onflow.org"],
          blockExplorer: "https://testnet.flowscan.org",
          nativeCurrency: {
            name: "Flow",
            symbol: "FLOW",
            decimals: 18,
          },
        },
        supportedChains: [
          {
            id: 545,
            name: "Flow EVM Testnet",
            rpcUrls: ["https://testnet.evm.nodes.onflow.org"],
            blockExplorers: {
              default: { url: "https://testnet.flowscan.org" },
            },
            nativeCurrency: {
              name: "Flow",
              symbol: "FLOW",
              decimals: 18,
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
