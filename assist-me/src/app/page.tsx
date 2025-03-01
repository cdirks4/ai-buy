"use client";
import Image from "next/image";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useContract } from "@/hooks/useContract";

export default function Home() {
  const { login, authenticated } = usePrivy();
  const { loading } = useContract();

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Image
              src="/better-hd.png"
              alt="PersonBounty Logo"
              width={120}
              height={120}
              className="mb-4"
            />
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
            Person Bounty Platform
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Create and manage person bounties with AI-powered facial recognition
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Wallet Connection */}
          <div className="card bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold mb-6">Get Started</h2>
            {!authenticated ? (
              <button
                onClick={() => login()}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h3 className="text-green-400 font-medium mb-2">
                  Wallet Connected!
                </h3>
                <p className="text-sm text-gray-400">
                  You can now create and manage bounties
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Features */}
          <div className="space-y-6">
            <div className="card bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-semibold mb-4">
                AI-Powered Recognition
              </h3>
              <p className="text-gray-400">
                Advanced facial recognition technology to verify identities
                securely and accurately
              </p>
            </div>

            <div className="card bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-semibold mb-4">
                Decentralized Bounties
              </h3>
              <p className="text-gray-400">
                Create and manage bounties using smart contracts on the
                blockchain
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
