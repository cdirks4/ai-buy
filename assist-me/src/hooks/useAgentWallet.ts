"use client";

import { useContext } from "react";
import { AgentWalletContext } from "@/context/AgentWalletContext";

export function useAgentWallet() {
  const context = useContext(AgentWalletContext);
  if (!context) {
    throw new Error(
      "useAgentWallet must be used within an AgentWalletProvider"
    );
  }

  return context;
}
