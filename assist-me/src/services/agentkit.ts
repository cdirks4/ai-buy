import { ethers } from "ethers";
import { storageService } from "./storage";
import { providerService } from "./provider";
import { FundingService } from "./funding";
import { WalletService } from "./wallet";
import { swapService } from "./swapService";

interface WalletHealth {
  isConnected: boolean;
  balance: string;
  allowance: string;
}

export class AgentKitService {
  private wallet: ethers.Wallet | null = null;
  private _provider: ethers.Provider | null = null;

  get provider(): ethers.Provider | null {
    return this._provider;
  }

  getSigner(): ethers.Wallet {
    if (!this.wallet) {
      throw new Error("Agent wallet not connected");
    }
    return this.wallet;
  }

  async connectWallet(
    userId: string,
    createIfNotExist: boolean = true
  ): Promise<boolean> {
    try {
      if (this.wallet) {
        return true;
      }

      const existingWallet = storageService.getWalletByUserId(userId);
      const provider = await this.ensureProvider();

      if (existingWallet) {
        try {
          const privateKey = await this.decryptPrivateKey(
            existingWallet.encryptedPrivateKey
          );

          if (!privateKey.match(/^0x[0-9a-fA-F]{64}$/)) {
            if (!createIfNotExist) return false;
          }

          this.wallet = new ethers.Wallet(privateKey, provider);
          storageService.updateLastAccessed(this.wallet.address);
          return true;
        } catch (error) {
          if (!createIfNotExist) {
            return false;
          }
        }
      }

      if (createIfNotExist) {
        const newWallet = ethers.Wallet.createRandom().connect(provider);
        this.wallet = newWallet;

        const encryptedKey = await this.encryptPrivateKey(
          newWallet.privateKey,
          userId
        );

        storageService.storeWallet({
          address: newWallet.address,
          encryptedPrivateKey: encryptedKey,
          userId,
          createdAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
        });

        // Fund new wallet with FLOW instead of MNT
        if (this.wallet) {
          await WalletService.fundNewWallet(this.wallet.address, "0.1", signer);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  }

  private async encryptPrivateKey(
    privateKey: string,
    userId: string
  ): Promise<string> {
    return btoa(`${privateKey}:${userId}`);
  }

  private async decryptPrivateKey(encryptedKey: string): Promise<string> {
    try {
      const decoded = atob(encryptedKey);
      const [privateKey, userId] = decoded.split(":");

      if (!privateKey || !userId) {
        throw new Error("Invalid encrypted key format");
      }

      return privateKey;
    } catch (error) {
      throw new Error("Failed to decrypt wallet key");
    }
  }

  private async ensureProvider(): Promise<ethers.Provider> {
    try {
      if (!this._provider) {
        this._provider = await providerService.getProvider();
      }
      return this._provider;
    } catch (error) {
      throw new Error("Could not establish network connection");
    }
  }

  async getBalance(): Promise<string> {
    try {
      if (!this.wallet) {
        return "0";
      }

      const provider = await this.ensureProvider();
      const balance = await provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      return "0";
    }
  }

  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  // Remove the swapTokens method
  // Remove any Uniswap-related methods

  // Keep only the core wallet functionality:
  // - connectWallet
  // - getBalance
  // - transferFunds
  // - signContract
  // - transferBackToPrivyWallet
}

export const agentKit = new AgentKitService();

// Example usage:
/*
const tx = await agentKit.signContract(
  "0xContractAddress",
  ContractABI,
  "methodName",
  [param1, param2]
);
await tx.wait();
*/
