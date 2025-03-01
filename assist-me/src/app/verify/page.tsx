"use client";
import { useState, useEffect } from "react";
import { usePrivy, useUser } from "@privy-io/react-auth";
import { useContract } from "@/hooks/useContract";
import Image from "next/image";
import { usePersonBounty } from "@/hooks/usePersonBounty";
import { useSearchParams } from "next/navigation";
import { PersonBountyService } from "@/services/personBounty";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { useWallets } from "@privy-io/react-auth";
import { FaceApiService } from "@/services/faceApi"; // Add this import
import toast from "react-hot-toast";
// Add this import at the top with other imports
import { useAgentWallet } from "@/hooks/useAgentWallet";
import { Button } from "@/components/ui/Button";

export default function VerifyPage() {
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
      router.push("/dashboard");
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

  const handleVerify = async () => {
    if (!selectedImage || !bountyData || isVerifying) return;

    try {
      setIsVerifying(true);
      setVerificationResult(null); // Reset previous results

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

      // Use PersonBountyService to verify the bounty
      const result = await PersonBountyService.verifyBounty(
        bountyId!,
        selectedImage
      );

      if (result.success && result.match) {
        setVerificationResult({
          matched: true,
          bountyAmount: ethers.formatUnits(result.bountyData.reward, 18),
          personId: result.bountyData.personId,
        });
        toast.success("Face verification successful!");
      } else {
        setVerificationResult({
          matched: false,
        });
        toast.error("Face verification failed");
      }
    } catch (error) {
      console.error("Verification failed:", error);
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
                onClick={handleVerify}
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
