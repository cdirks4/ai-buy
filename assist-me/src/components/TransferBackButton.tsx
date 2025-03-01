"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { useAgentWallet } from "@/context/AgentWalletContext";

export function TransferBackButton() {
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { signer: agentWallet, isConnected } = useAgentWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransferBack = async () => {
    if (!authenticated || !wallets?.[0]) {
      await login();
      return;
    }

    if (!isConnected || !agentWallet) {
      setError("Agent wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userWallet = wallets[0];
      const provider = agentWallet.provider;

      // Fixed amount to send
      const amountToSend = ethers.parseEther("1");

      // Get agent wallet balance
      const balance = await provider.getBalance(agentWallet.address);
      console.log("Agent Wallet Balance:", balance.toString());

      // Check if we have enough balance
      if (balance <= amountToSend) {
        throw new Error("Insufficient balance in agent wallet");
      }

      // Set fixed gas price for Mantle
      const gasPrice = ethers.parseUnits("0.1", "gwei");
      console.log("Gas Price:", gasPrice.toString());

      const tx = await agentWallet.sendTransaction({
        to: userWallet.address,
        value: amountToSend,
        gasLimit: gasPrice + gasPrice,
        gasPrice,
        nonce: await provider.getTransactionCount(agentWallet.address),
      });

      await tx.wait();
      setError(null);
    } catch (err) {
      console.error("Transfer back error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to transfer funds back"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="mt-8 text-center">
      <button
        onClick={handleTransferBack}
        disabled={isLoading}
        className={`py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isLoading ? "Transferring..." : "Transfer Funds Back"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
