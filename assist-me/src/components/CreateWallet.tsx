"use client";

import { useState } from "react";
import { useAgentWallet } from "@/context/AgentWalletContext";

interface CreateWalletProps {
  userId: string;
  onWalletCreated?: (address: string) => void;
}

export default function CreateWallet({ userId, onWalletCreated }: CreateWalletProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connect, address } = useAgentWallet();

  const handleCreateWallet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await connect(userId);
      if (address) {
        onWalletCreated?.(address);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white/5 rounded-lg border border-white/10">
      <h2 className="text-xl font-semibold mb-4">Create Agent Wallet</h2>
      <p className="text-gray-400 mb-4">
        Create a new agent wallet to manage your DeFi transactions on Mantle.
      </p>
      <button
        onClick={handleCreateWallet}
        disabled={isLoading}
        className={`w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Creating Wallet...' : 'Create Wallet'}
      </button>
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
