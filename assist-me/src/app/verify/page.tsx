"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
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

export default function VerifyPage() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { loading: bountyLoading } = usePersonBounty();
  const searchParams = useSearchParams();
  const bountyId = searchParams.get("bountyId");
  const [isClaimLoading, setIsClaimLoading] = useState(false);

  const handleClaimBounty = async () => {
    if (!bountyData || isClaimLoading) return;

    try {
      setIsClaimLoading(true);
      const wallet = wallets[0];
      if (!wallet) throw new Error("No wallet connected");

      // Get the raw provider first
      const ethereumProvider = await wallet.getEthereumProvider();
      if (!ethereumProvider) throw new Error("No Ethereum provider available");

      // Switch to Flow EVM network first
      await ethereumProvider
        .request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x221" }], // 545 in hex
        })
        .catch(async (switchError) => {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await ethereumProvider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x221",
                  chainName: "Flow EVM Testnet",
                  nativeCurrency: {
                    name: "Flow",
                    symbol: "FLOW",
                    decimals: 18,
                  },
                  rpcUrls: ["https://testnet.evm.nodes.onflow.org"],
                  blockExplorerUrls: ["https://testnet.flowscan.org"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        });

      // Initialize provider after ensuring correct network
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      const contract = await ContractService.getContract(signer);

      // Convert bountyId to BigInt for contract interaction
      const tx = await contract.claimBounty(BigInt(bountyId));
      await tx.wait();

      router.push("/bounties");
    } catch (error) {
      console.error("Failed to claim bounty:", error);
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

    // Cleanup previous URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);
    // Create object URL only on client side
    if (typeof window !== "undefined") {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const [bountyData, setBountyData] = useState<{
    personId: string;
    reward: string;
    isActive: boolean;
  } | null>(null);

  // Fetch bounty data when component mounts
  useEffect(() => {
    const fetchBountyData = async () => {
      if (!bountyId) return;
      try {
        const data = await PersonBountyService.getBounty(bountyId);
        setBountyData({
          personId: data.personId,
          reward: ethers.formatUnits(data.reward, 18),
          isActive: data.isActive,
        });
      } catch (err) {
        console.error("Failed to fetch bounty:", err);
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

      if (!isAgentConnected || !agentSigner) {
        throw new Error("Agent wallet not connected");
      }

      // Get the IPFS data for the bounty
      const personData = await PersonBountyService.getPerson(
        bountyData.personId
      );
      if (!personData || !personData.ipfsHash) {
        throw new Error("No IPFS data found for this bounty");
      }

      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("ipfs_hash", personData.ipfsHash);
      formData.append("threshold", "0.5");

      const result = await FaceApiService.compareFaceWithIpfs(formData);

      if (result.success && result.match) {
        // Get the user's wallet address
        const userWallet = wallets[0];
        if (!userWallet) throw new Error("User wallet not connected");

        // Agent redeems the bounty on behalf of the user
        await PersonBountyService.redeemBountyAsAgent(
          bountyId!,
          userWallet.address
        );

        toast.success("Bounty claimed successfully!");
        router.push("/bounties");
      } else {
        toast.error("Face verification failed");
      }
    } catch (error) {
      console.error("Verification/claiming failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to verify and claim bounty"
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
            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
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
              <button
                onClick={handleVerify}
                disabled={!selectedImage || isVerifying}
                className={`w-full py-3 px-4 ${
                  !selectedImage || isVerifying
                    ? "bg-blue-600/50 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } rounded-lg transition-colors text-white font-medium`}
              >
                {isVerifying ? "Verifying..." : "Verify Photo"}
              </button>
            </div>
            {verificationResult && (
              <div
                className={`p-6 rounded-xl ${
                  verificationResult.matched
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
                } border backdrop-blur-sm`}
              >
                {verificationResult.matched ? (
                  <>
                    <h3 className="text-green-400 font-medium mb-2">
                      Match Found!
                    </h3>
                    <p className="text-gray-300">
                      Bounty Amount: {verificationResult.bountyAmount} FLOW
                    </p>

                    {verificationResult?.matched && (
                      <button
                        onClick={handleClaimBounty}
                        disabled={isClaimLoading}
                        className="mt-4 w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors text-white font-medium"
                      >
                        {isClaimLoading ? "Claiming..." : "Claim Bounty"}
                      </button>
                    )}
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
