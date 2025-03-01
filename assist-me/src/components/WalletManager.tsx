"use client";

import { useEffect, useState } from "react";
import { agentKit } from "@/services/agentkit";
import FundWallet from "./FundWallet";

interface WalletManagerProps {
  userId: string;
}

export default function WalletManager({ userId }: WalletManagerProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFundSuccess = async () => {
    // Refresh the balance after successful funding
    if (address) {
      const newBalance = await agentKit.getBalance();
      setBalance(newBalance);
    }
  };

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const connected = await agentKit.connectWallet(userId, false);
        if (connected) {
          const address = agentKit.getWalletAddress();
          setAddress(address);
          const balance = await agentKit.getBalance();
          setBalance(balance);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize wallet"
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeWallet();
  }, [userId]);

  if (isLoading) {
    return <div>Loading wallet...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white/5 rounded-lg border border-white/10">
        <h2 className="text-xl font-semibold mb-4">Agent Wallet</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Address:</span>
            <span className="font-mono">{address || "Not connected"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Balance:</span>
            <span>{balance} ETH</span>
          </div>
        </div>
      </div>

      {address && (
        <FundWallet agentAddress={address} onSuccess={handleFundSuccess} />
      )}
    </div>
  );
}
