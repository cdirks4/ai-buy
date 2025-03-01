"use client";

import { useState, useEffect } from "react";
import { agentKit } from "@/services/agentkit";
import { ethers } from "ethers";

export default function WalletBalance({ address }: { address: string }) {
  const [balance, setBalance] = useState<string>("0");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBalance = async () => {
    try {
      const provider = await agentKit.provider;
      if (!provider) return;

      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBalance();
    setIsRefreshing(false);
  };

  return (
    <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Balance</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {Number(balance).toFixed(4)} FLOW
      </p>
    </div>
  );
}
