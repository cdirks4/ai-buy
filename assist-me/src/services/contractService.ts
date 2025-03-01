import { ethers } from "ethers";
import { PersonBountyABI } from "@/constants/abi";
import { EigenService } from "./eigenService";

export class ContractService {
  private static CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  private static provider: ethers.Provider | null = null;

  static async getProvider() {
    if (!this.provider) {
      // Use the correct Flow EVM testnet URL
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

  static async getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
    if (!this.CONTRACT_ADDRESS) {
      throw new Error("Contract address not configured");
    }
    return new ethers.Contract(
      this.CONTRACT_ADDRESS,
      PersonBountyABI,
      signerOrProvider
    );
  }

  static async getSigner() {
    const provider = await this.getProvider();
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
    return wallet;
  }

  static async findMatchingBounty(faceData: any) {
    try {
      const provider = await this.getProvider();
      const contract = await this.getContract(provider);

      // Since we don't have getActiveBounties, we'll check the bounty for the person directly
      const bounty = await contract.bounties(faceData.id);

      if (bounty && bounty.isActive) {
        const person = await contract.people(bounty.personId);

        // Descale the stored embedding back to original range
        const embeddingScale = 1e6; // Must match the scale used in createPersonAndBounty
        const descaledEmbedding = person.faceEmbedding.map((n: any) => {
          const scaled = ethers.formatUnits(n, 0); // Get the raw number
          return parseFloat(scaled) / embeddingScale - 4; // Reverse the scaling and shifting
        });

        // Compare face embeddings
        const similarity = this.compareFaceEmbeddings(
          faceData.embedding,
          descaledEmbedding
        );

        if (similarity > 0.85) {
          return {
            personId: bounty.personId,
            reward: ethers.formatUnits(bounty.reward, 18),
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error finding matching bounty:", error);
      throw error;
    }
  }

  static async createPersonAndBounty(
    personId: string,
    faceData: any,
    reward: number
  ) {
    try {
      // Upload face data to IPFS
      const pinataData = {
        embedding: faceData.embedding,
        landmarks: faceData.landmarks,
        metadata: {
          timestamp: Date.now(),
          version: "1.0",
        },
      };

      // Upload to Pinata
      const formData = new FormData();
      const blob = new Blob([JSON.stringify(pinataData)], {
        type: "application/json",
      });
      const file = new File([blob], `face-data-${personId}.json`);
      formData.append("file", file);

      const pinataResponse = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
        }
      );

      if (!pinataResponse.ok) {
        throw new Error(`Pinata upload failed: ${pinataResponse.statusText}`);
      }

      const responseData = await pinataResponse.json();
      const ipfsHash = responseData.IpfsHash;

      // Continue with contract interaction
      const signer = await this.getSigner();
      const contract = await this.getContract(signer);

      // Convert detection score to contract format (use 18 decimals)
      const normalizedScore = ethers.parseUnits(
        faceData.det_score.toString(),
        18
      );

      // Create person with basic data
      const createPersonTx = await contract.createPerson(
        personId,
        ipfsHash,
        normalizedScore
      );
      await createPersonTx.wait();

      // Create bounty with the specified reward
      const parsedReward = ethers.parseUnits(reward.toString(), 18);
      const bountyTx = await contract.createBounty(personId, parsedReward, {
        value: parsedReward,
      });
      const receipt = await bountyTx.wait();

      return {
        personId,
        transactionHash: receipt.hash,
        ipfsHash,
      };
    } catch (error) {
      console.error("Error in createPersonAndBounty:", error);
      throw error;
    }
  }
}
