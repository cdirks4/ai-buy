"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState } from "react";
import { ethers } from "ethers";
import { FundingService } from "@/services/funding";

interface FundWalletProps {
  agentAddress: string;
  onSuccess?: () => void;
}

export default function FundWallet({
  agentAddress,
  onSuccess,
}: FundWalletProps) {
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [amount, setAmount] = useState("0.1"); // Default amount
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFund = async () => {
    if (!authenticated || !wallets?.[0]) {
      await login();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await FundingService.fundNewWallet(
        agentAddress,
        wallets[0]
      );
      
      if (success) {
        onSuccess?.();
      } else {
        setError("Failed to fund wallet");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send funds");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white/5 rounded-lg border border-white/10">
      <h2 className="text-xl font-semibold mb-4">Fund Agent Wallet</h2>
      <div className="space-y-4">
        <button
          onClick={handleFund}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors
            ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {!authenticated
            ? "Connect Wallet"
            : isLoading
            ? "Funding..."
            : "Fund Wallet"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
