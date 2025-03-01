import { useState } from "react";
import { PersonBountyService } from "@/services/personBounty";
import * as fcl from "@onflow/fcl";

export function usePersonBounty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPerson = async (
    id: string,
    faceEmbedding: number[],
    landmarks: number[][],
    detectionScore: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await PersonBountyService.createPerson(
        id,
        faceEmbedding,
        landmarks,
        detectionScore
      );
      return tx;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create person");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createBounty = async (personId: string, reward: number) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await PersonBountyService.createBounty(personId, reward);
      return tx;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bounty");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPerson = async (id: string) => {
    try {
      return await PersonBountyService.getPerson(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get person");
      throw err;
    }
  };

  const getBounty = async (personId: string) => {
    try {
      return await PersonBountyService.getBounty(personId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get bounty");
      throw err;
    }
  };

  return {
    createPerson,
    createBounty,
    getPerson,
    getBounty,
    loading,
    error,
  };
}
