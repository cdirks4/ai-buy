"use client";
import { useState, useEffect, use } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { usePersonBounty } from "@/hooks/usePersonBounty";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PersonBountyService } from "@/services/personBounty";
import { ethers } from "ethers";

export default function BountyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { getBounty } = usePersonBounty();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bountyData, setBountyData] = useState<{
    personId: string;
    reward: string;
    isActive: boolean;
    creator: string;
  } | null>(null);

  useEffect(() => {
    const fetchBountyData = async () => {
      try {
        setLoading(true);
        const data = await PersonBountyService.getBounty(resolvedParams.id);
        if (!data) {
          throw new Error(`No bounty found for ID: ${resolvedParams.id}`);
        }
        setBountyData({
          personId: data.personId,
          reward: ethers.formatUnits(data.reward, 18),
          isActive: data.isActive,
          creator: data.creator,
        });
      } catch (err) {
        console.error("Failed to fetch bounty:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch bounty");
      } finally {
        setLoading(false);
      }
    };

    if (authenticated && resolvedParams.id) {
      fetchBountyData();
    }
  }, [authenticated, resolvedParams.id]);

  const handleVerifyClick = () => {
    router.push(`/verify?bountyId=${resolvedParams.id}`);
  };

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center p-8 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
          <p className="text-gray-400 mb-4">
            Please connect your wallet to continue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
            Bounty Details
          </h1>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            Back
          </button>
        </div>

        {loading ? (
          <div className="text-center p-8">
            <p className="text-gray-400">Loading bounty details...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : bountyData ? (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p
                    className={`text-lg font-medium ${
                      bountyData.isActive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {bountyData.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Reward</p>
                  <p className="text-lg font-medium text-blue-400">
                    {bountyData.reward} ETH
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-400">Person ID</p>
                  <p className="text-sm font-mono text-gray-300 break-all">
                    {bountyData.personId}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-400">Creator</p>
                  <p className="text-sm font-mono text-gray-300 break-all">
                    {bountyData.creator}
                  </p>
                </div>
              </div>
            </div>

            {bountyData.isActive && (
              <button
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium"
                onClick={handleVerifyClick}
              >
                Verify Match
              </button>
            )}
          </div>
        ) : (
          <div className="text-center p-8 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
            <p className="text-gray-400">No bounty found</p>
          </div>
        )}
      </div>
    </div>
  );
}
