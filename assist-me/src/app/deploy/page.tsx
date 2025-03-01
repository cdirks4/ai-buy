"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useContract } from "@/hooks/useContract";
import Image from "next/image";

export default function DeployBountyPage() {
  const { authenticated } = usePrivy();
  const { createPerson, createBounty, loading } = useContract();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reward, setReward] = useState<string>("0.1");
  const [deploymentStatus, setDeploymentStatus] = useState<{
    success?: boolean;
    message?: string;
    bountyId?: string;
  } | null>(null);

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

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);
    if (typeof window !== "undefined") {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleDeploy = async () => {
    if (!selectedImage) return;

    try {
      setDeploymentStatus(null);

      // Create form data with both image and reward
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("reward", reward);

      // Create person and bounty in one transaction
      const response = await fetch("/api/deploy", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to deploy bounty");
      }

      const result = await response.json();

      setDeploymentStatus({
        success: true,
        message: "Bounty deployed successfully!",
        bountyId: result.personId,
      });
    } catch (error) {
      console.error("Deployment failed:", error);
      setDeploymentStatus({
        success: false,
        message: error instanceof Error ? error.message : "Failed to deploy bounty",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
          Deploy New Bounty
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
                  Upload Target Photo
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

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reward Amount (FLOW)
                </label>
                <input
                  type="number"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  step="0.1"
                  min="0.1"
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-gray-300"
                />
              </div>

              <button
                onClick={handleDeploy}
                disabled={!selectedImage || loading}
                className={`w-full py-3 px-4 ${
                  !selectedImage || loading
                    ? "bg-blue-600/50 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } rounded-lg transition-colors text-white font-medium`}
              >
                {loading ? "Deploying..." : "Deploy Bounty"}
              </button>
            </div>

            {deploymentStatus && (
              <div
                className={`p-6 rounded-xl ${
                  deploymentStatus.success
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
                } border backdrop-blur-sm`}
              >
                <p
                  className={`font-medium ${
                    deploymentStatus.success ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {deploymentStatus.message}
                </p>
                {deploymentStatus.bountyId && (
                  <a
                    href={`/bounty/${deploymentStatus.bountyId}`}
                    className="mt-4 inline-block text-blue-400 hover:text-blue-300"
                  >
                    View Bounty Details →
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
