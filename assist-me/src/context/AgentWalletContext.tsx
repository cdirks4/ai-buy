"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { agentKit } from "@/services/agentkit";
import { ethers } from "ethers";
import { storageService } from "@/services/storage";

interface AgentWalletContextType {
  address: string | null;
  signer: ethers.Wallet | null;
  isConnected: boolean;
  error: string | null;
  connect: (userId: string) => Promise<void>;
  reconnect: () => Promise<void>;
  checkBalance: () => Promise<bigint>;
}

// Export the context so it can be imported directly
export const AgentWalletContext = createContext<AgentWalletContextType>({
  address: null,
  signer: null,
  isConnected: false,
  error: null,
  connect: async () => {},
  reconnect: async () => {},
  checkBalance: async () => 0n,
});

export function AgentWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Wallet | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBalance = async () => {
    try {
      if (!signer) {
        console.log("No signer available to check balance");
        return 0n;
      }
      const balance = await signer.provider.getBalance(signer.address);
      console.log("Agent wallet address:", signer.address);
      console.log("Current balance:", ethers.formatEther(balance), "FLOW");
      return balance;
    } catch (err) {
      console.error("Error checking balance:", err);
      return 0n;
    }
  };

  const connect = async (userId: string) => {
    try {
      const connected = await agentKit.connectWallet(userId, true);
      if (connected) {
        const address = agentKit.getWalletAddress();
        const signer = agentKit.getSigner();
        setAddress(address);
        setSigner(signer);
        setIsConnected(true);
        setError(null);

        // Check balance after connecting
        await checkBalance();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
      setIsConnected(false);
    }
  };

  const reconnect = async () => {
    try {
      // Get the last used wallet from storage
      const wallets = storageService.debugPrintWallets();
      if (wallets.length === 0) {
        return;
      }

      // Use the most recently accessed wallet
      const lastWallet = wallets.sort(
        (a, b) =>
          new Date(b.lastAccessed).getTime() -
          new Date(a.lastAccessed).getTime()
      )[0];

      const connected = await agentKit.connectWallet(lastWallet.userId, false);
      if (connected) {
        const address = agentKit.getWalletAddress();
        const signer = agentKit.getSigner();
        setAddress(address);
        setSigner(signer);
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to reconnect wallet:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reconnect wallet"
      );
      setIsConnected(false);
    }
  };

  // Try to reconnect on mount if there's a stored wallet
  useEffect(() => {
    reconnect();
  }, []);

  return (
    <AgentWalletContext.Provider
      value={{
        address,
        signer,
        isConnected,
        error,
        connect,
        reconnect,
        checkBalance,
      }}
    >
      {children}
    </AgentWalletContext.Provider>
  );
}
