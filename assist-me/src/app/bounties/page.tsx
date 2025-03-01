"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { PersonBountyService } from "@/services/personBounty";
import { ethers } from "ethers";
import Link from "next/link";

export default function BountiesPage() {
  const { authenticated } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bounties, setBounties] = useState<{
    id: string;
    personId: string;
    reward: string;
    isActive: boolean;
    creator: string;
  }[]>([]);

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use getAllBounties instead of counting
        const bounties = await PersonBountyService.getAllBounties();
        const activeBounties = bounties.map(bounty => ({
          id: bounty.id,
          personId: bounty.personId,
          reward: ethers.formatUnits(bounty.reward, 18),
          isActive: bounty.isActive,
          creator: bounty.creator
        }));

        setBounties(activeBounties);
      } catch (err) {
        console.error("Failed to fetch bounties:", err);
        setError("Failed to load bounties. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (authenticated) {
      fetchBounties();
    }
  }, [authenticated]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
          Active Bounties
        </h1>

        {!authenticated ? (
          <div className="text-center p-8 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
            <p className="text-gray-400 mb-4">
              Please connect your wallet to view bounties
            </p>
          </div>
        ) : loading ? (
          <div className="text-center p-8">
            <p className="text-gray-400">Loading bounties...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : bounties.length > 0 ? (
          <div className="grid gap-4">
            {bounties.map((bounty) => (
              <Link
                key={bounty.id}
                href={`/bounty/${bounty.id}`}
                className="block bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Reward</p>
                    <p className="text-lg font-medium text-blue-400">
                      {bounty.reward} FLOW
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-lg font-medium text-green-400">Active</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-400">Creator</p>
                    <p className="text-sm font-mono text-gray-300 break-all">
                      {bounty.creator}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
            <p className="text-gray-400">No active bounties found</p>
          </div>
        )}
      </div>
    </div>
  );
}