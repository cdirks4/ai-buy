import { useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { ContractService } from "@/services/contractService";
import { FaceApiService } from "@/services/faceApi";
import { ethers } from "ethers";

const SIMILARITY_THRESHOLD = 0.85;

export type UniquenessStatus =
  | "checking"
  | "unique"
  | "duplicate"
  | "error"
  | null;

export function useContract() {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uniquenessStatus, setUniquenessStatus] =
    useState<UniquenessStatus>(null);

  const getSigner = async () => {
    const wallet = wallets[0];
    if (!wallet) throw new Error("No wallet connected");
    const provider = new ethers.BrowserProvider(wallet.provider);
    return provider.getSigner();
  };

  const checkFaceUniqueness = useCallback(
    async (
      faceEmbedding: Float32Array,
      currentIpfsHash?: string
    ): Promise<boolean> => {
      try {
        console.log("Starting face uniqueness check...");
        setUniquenessStatus("checking");

        const signer = await getSigner();
        const contract = await ContractService.getContract(signer);

        const registrationsCount = await contract.totalRegistrants();
        const count = Number(registrationsCount);

        if (count === 0) {
          setUniquenessStatus("unique");
          return true;
        }

        // Convert embedding to blob for API
        const faceBuffer = new Uint8Array(faceEmbedding.buffer);
        const faceBlob = new Blob([faceBuffer], {
          type: "application/octet-stream",
        });

        // Check each registration
        for (let i = 0; i < count; i++) {
          const registrantAddress = await contract.registrants(i);
          const registration = await contract.getRegistration(
            registrantAddress
          );

          // Skip invalid or own registrations
          if (
            !registration.ipfsHash ||
            registration.ipfsHash === "" ||
            registrantAddress.toLowerCase() ===
              wallets[0].address.toLowerCase() ||
            (currentIpfsHash && registration.ipfsHash === currentIpfsHash)
          ) {
            continue;
          }

          // Compare faces
          const formData = new FormData();
          formData.append("file", new File([faceBlob], "face.bin"));
          formData.append("ipfs_hash", registration.ipfsHash);
          formData.append("threshold", SIMILARITY_THRESHOLD.toString());

          const result = await FaceApiService.compareFaceWithIpfs(formData);

          if (result.success && result.similarity > SIMILARITY_THRESHOLD) {
            setUniquenessStatus("duplicate");
            return false;
          }
        }

        setUniquenessStatus("unique");
        return true;
      } catch (err) {
        console.error("Error checking face uniqueness:", err);
        setError(
          err instanceof Error ? err.message : "Failed to check face uniqueness"
        );
        setUniquenessStatus("error");
        return false;
      }
    },
    [wallets, getSigner]
  );

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
    checkFaceUniqueness,
    loading,
    error,
    uniquenessStatus,
  };
}
