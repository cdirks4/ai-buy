import { ethers } from "ethers";

class ProviderService {
  private provider: ethers.Provider | null = null;

  async getProvider(): Promise<ethers.Provider> {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(
        "https://testnet.evm.nodes.onflow.org",
        {
          name: "Flow EVM Testnet",
          chainId: 545,
        }
      );
    }
    return this.provider;
  }
}

export const providerService = new ProviderService();
