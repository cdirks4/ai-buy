"use client";
import { useState, useEffect, Suspense } from "react";
import { usePrivy, useUser } from "@privy-io/react-auth";
import { useContract } from "@/hooks/useContract";
import Image from "next/image";
import { usePersonBounty } from "@/hooks/usePersonBounty";
import { useSearchParams } from "next/navigation";
import { PersonBountyService } from "@/services/personBounty";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { useWallets } from "@privy-io/react-auth";
import { FaceApiService } from "@/services/faceApi";
import toast from "react-hot-toast";
import { useAgentWallet } from "@/hooks/useAgentWallet";
import { Button } from "@/components/ui/Button";

// Create a separate component for the verification content
function VerifyContent() {
  const router = useRouter();
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { loading: bountyLoading } = usePersonBounty();
  const searchParams = useSearchParams();
  const bountyId = searchParams.get("bountyId");
  const [isClaimLoading, setIsClaimLoading] = useState(false);

  const { isConnected: isAgentConnected, signer: agentSigner } =
    useAgentWallet();

  const handleClaimBounty = async () => {
    if (!bountyData || isClaimLoading || !user?.id) return;

    try {
      setIsClaimLoading(true);

      if (!isAgentConnected || !agentSigner) {
        throw new Error("Agent wallet not connected");
      }

      // Check agent wallet balance first
      const balance = await agentSigner.provider.getBalance(
        agentSigner.address
      );
      const minBalance = ethers.parseUnits("0.01", "ether");

      if (balance < minBalance) {
        toast.error(`Insufficient funds in agent wallet. Required: 0.01 FLOW`);
        return;
      }

      // Use redeemBountyAsAgent instead of redeemBounty
      await PersonBountyService.redeemBountyAsAgent(bountyId!, user.id);

      toast.success("Bounty claimed successfully!");
      // router.push("/dashboard");
    } catch (error) {
      console.error("Failed to claim bounty:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to claim bounty"
      );
    } finally {
      setIsClaimLoading(false);
    }
  };

  const { createPerson, loading: contractLoading } = useContract();
  const [isVerifying, setIsVerifying] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    matched: boolean;
    bountyAmount?: string;
    personId?: string;
    comparisonDetails: any[];
    bestMatch: any;
  } | null>(null);

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cleanup previous URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const [bountyData, setBountyData] = useState<any>(null);

  // Fetch bounty data when component mounts
  useEffect(() => {
    const fetchBountyData = async () => {
      if (!bountyId) return;
      try {
        const data = await PersonBountyService.getBounty(bountyId);
        setBountyData(data);
      } catch (error) {
        console.error("Failed to fetch bounty data:", error);
        toast.error("Failed to fetch bounty data");
      }
    };

    if (authenticated && bountyId) {
      fetchBountyData();
    }
  }, [authenticated, bountyId]);

  const handleVerify = async (file: File) => {
    try {
      setIsVerifying(true);
      if (!bountyId) {
        toast.error("No bounty ID provided");
        return;
      }

      // Get the user's wallet address
      const userWallet = wallets[0]?.address;
      if (!userWallet) {
        toast.error("Please connect your wallet first");
        return;
      }

      const result = await PersonBountyService.verifyBounty(
        bountyId,
        file,
        userWallet
      );
      setVerificationResult(result);

      if (result.match) {
        if (result.redeemed) {
          toast.success("Bounty claimed successfully!");
        } else {
          toast.error("Face matched but bounty claim failed");
        }
      } else {
        toast.error("Face did not match the bounty target");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(
        error instanceof Error ? error.message : "Verification failed"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
          Verify Bounty Match
        </h1>

        {!authenticated ? (
          <div className="text-center p-8 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
            <p className="text-gray-400 mb-4">
              Please connect your wallet to continue
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-xl backdrop-blur-sm">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50/10 file:text-blue-400 hover:file:bg-blue-50/20"
                />
              </div>
              {previewUrl && (
                <div className="relative w-full h-64 mb-4">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              )}

              <Button
                onClick={() => selectedImage && handleVerify(selectedImage)}
                disabled={!selectedImage || isVerifying}
                variant={
                  !selectedImage || isVerifying ? "secondary" : "default"
                }
                className="w-full"
              >
                {isVerifying ? "Verifying..." : "Verify Photo"}
              </Button>
            </div>

            {verificationResult && (
              <div
                className={`p-6 rounded-xl border backdrop-blur-sm ${
                  verificationResult.matched
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
                }`}
              >
                {verificationResult.matched ? (
                  <>
                    <h3 className="text-green-400 font-medium mb-2">
                      Match Found!
                    </h3>
                    <p className="text-gray-300">
                      Bounty Amount: {verificationResult.bountyAmount} FLOW
                    </p>
                    <Button
                      onClick={handleClaimBounty}
                      disabled={isClaimLoading}
                      variant="default"
                      className="mt-4 w-full"
                    >
                      {isClaimLoading ? "Claiming..." : "Claim Bounty"}
                    </Button>
                  </>
                ) : (
                  <p className="text-red-400">No matching bounty found.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
