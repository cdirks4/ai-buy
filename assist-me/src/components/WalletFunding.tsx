"use client";

import { useState } from "react";
import { agentKit } from "@/services/agentkit";
import { ethers } from "ethers";

export default function WalletFunding() {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFund = async () => {
    if (!amount || isLoading) return;
    setIsLoading(true);

    try {
      const signer = agentKit.getSigner();
      const tx = await signer.sendTransaction({
        to: await signer.getAddress(),
        value: ethers.parseEther(amount),
      });

      await tx.wait();
      alert("Successfully funded wallet!");
      setAmount("");
    } catch (error) {
      console.error("Funding failed:", error);
      alert(
        `Failed to fund: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-white/5">
      <h3 className="text-lg font-medium mb-4">Fund Wallet</h3>
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in FLOW"
          className="flex-1 px-3 py-2 bg-black/20 rounded"
        />
        <button
          onClick={handleFund}
          disabled={!amount || isLoading}
          className="px-4 py-2 bg-blue-500 rounded disabled:opacity-50"
        >
          {isLoading ? "Funding..." : "Fund"}
        </button>
      </div>
    </div>
  );
}
