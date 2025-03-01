import { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { ContractService } from "@/services/contractService";
import { ethers } from "ethers";

export function useContract() {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSigner = async () => {
    const wallet = wallets[0];
    if (!wallet) throw new Error("No wallet connected");
    const provider = new ethers.BrowserProvider(wallet.provider);
    return provider.getSigner();
  };

  const createPerson = async (
    id: string,
    faceEmbedding: number[],
    landmarks: number[][],
    detectionScore: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const signer = await getSigner();
      return await ContractService.createPerson(
        signer,
        id,
        faceEmbedding,
        landmarks,
        detectionScore
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create person");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createBounty = async (personId: string, reward: string) => {
    setLoading(true);
    setError(null);
    try {
      const signer = await getSigner();
      return await ContractService.createBounty(signer, personId, reward);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bounty");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPerson,
    createBounty,
    loading,
    error
  };
}