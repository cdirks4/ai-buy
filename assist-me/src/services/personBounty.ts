import { ethers } from "ethers";
import { agentKit } from "./agentkit";
import { PersonBountyABI } from "@/constants/abi";
import axios from "axios";
import { FaceApiService } from "./faceApi";

export class PersonBountyService {
  private static PINATA_JWT = process.env.PINATA_JWT;
  private static PINATA_API_URL = "https://api.pinata.cloud";
  private static PINATA_GATEWAY =
    "https://gray-accepted-thrush-827.mypinata.cloud";
  private static CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  private static ABI = PersonBountyABI;

  private static async uploadToPinata(data: any): Promise<string> {
    console.log("Uploading to Pinata:", {
      dataSize: JSON.stringify(data).length,
      embeddingLength: data.embedding.length,
      landmarksLength: data.landmarks.length,
      sample: {
        embedding: data.embedding.slice(0, 5),
        landmarks: data.landmarks.slice(0, 2),
      },
    });

    const formData = new FormData();
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const file = new File([blob], `face-data-${Date.now()}.json`);
    formData.append("file", file);

    const response = await axios.post(
      `${this.PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${this.PINATA_JWT}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Pinata upload successful:", {
      ipfsHash: response.data.IpfsHash,
      timestamp: new Date().toISOString(),
    });

    return response.data.IpfsHash;
  }

  private static async getFromPinata(ipfsHash: string): Promise<any> {
    console.log("Fetching from Pinata:", { ipfsHash });
    const response = await axios.get(`${this.PINATA_GATEWAY}/ipfs/${ipfsHash}`);
    console.log("Pinata fetch successful:", {
      dataSize: JSON.stringify(response.data).length,
      embeddingLength: response.data.embedding?.length,
      landmarksLength: response.data.landmarks?.length,
    });
    return response.data;
  }

  private static async getProvider() {
    return new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_FLOW_RPC_URL ||
        "https://testnet.evm.nodes.onflow.org",
      {
        name: "Flow EVM Testnet",
        chainId: 545,
      }
    );
  }

  static async createPerson(
    id: string,
    faceEmbedding: number[],
    landmarks: number[][],
    detectionScore: number
  ) {
    const faceData = {
      embedding: faceEmbedding,
      landmarks: landmarks,
    };

    const ipfsHash = await this.uploadToPinata(faceData);

    const signer = agentKit.getSigner();
    const contract = new ethers.Contract(
      this.CONTRACT_ADDRESS,
      this.ABI,
      signer
    );

    const parsedScore = ethers.parseUnits(detectionScore.toString(), 18);

    const tx = await contract.createPerson(id, ipfsHash, parsedScore);
    return tx.wait();
  }

  static async getPerson(personId: string) {
    const provider = await agentKit.provider;
    const contract = new ethers.Contract(
      this.CONTRACT_ADDRESS!,
      this.ABI,
      provider
    );

    try {
      const personData = await contract.people(personId);
      return {
        id: personId,
        ipfsHash: personData.ipfsHash,
        detectionScore: personData.detectionScore,
        createdAt: personData.createdAt,
      };
    } catch (error) {
      console.error("Error fetching person:", error);
      throw error;
    }
  }

  static async createBounty(personId: string, reward: string) {
    try {
      console.log("Creating bounty:", { personId, reward });

      if (!reward || isNaN(Number(reward))) {
        throw new Error("Invalid reward amount");
      }

      const signer = agentKit.getSigner();
      const contract = new ethers.Contract(
        this.CONTRACT_ADDRESS,
        this.ABI,
        signer
      );

      const parsedReward = ethers.parseUnits(reward.toString(), 18);
      console.log("Parsed reward:", parsedReward.toString());

      const tx = await contract.createBounty(personId, parsedReward, {
        value: parsedReward,
      });

      console.log("Bounty creation transaction sent:", tx.hash);
      return tx.wait();
    } catch (error) {
      console.error("Error creating bounty:", error);
      throw error;
    }
  }

  static async findWalletByFace(embedding: number[]): Promise<string | null> {
    try {
      console.log("Searching for wallet by face embedding...");
      const provider = await this.getProvider();
      const contract = new ethers.Contract(
        this.CONTRACT_ADDRESS!,
        this.ABI,
        provider
      );

      // Call the contract method to find the most similar face
      const result = await contract.findMostSimilarFace(embedding);

      console.log("Registry search result:", {
        walletAddress: result.walletAddress,
        similarity: result.similarity,
        threshold: result.threshold,
      });

      // Return the wallet address if similarity is above threshold
      if (result.similarity > result.threshold) {
        return result.walletAddress;
      }

      return null;
    } catch (error) {
      console.error("Error searching face registry:", error);
      return null;
    }
  }

  static async verifyBounty(bountyId: string, imageFile: File) {
    try {
      console.log("Starting bounty verification:", { bountyId });

      // Get bounty data first
      const bountyData = await this.getBounty(bountyId);

      console.log("Got bounty data:", {
        bountyId,
        personId: bountyData.personId,
        ipfsHash: bountyData.ipfsHash,
        hasIpfsHash: Boolean(bountyData.ipfsHash),
      });

      if (!bountyData.ipfsHash) {
        throw new Error(`No IPFS hash found for bounty ${bountyId}'s person`);
      }

      // Create form data for verification
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("ipfs_hash", bountyData.ipfsHash);
      formData.append("threshold", "0.6");

      console.log("Sending verification request with:", {
        ipfsHash: bountyData.ipfsHash,
        hasFile: Boolean(imageFile),
        fileSize: imageFile.size,
      });

      // Use FaceApiService to compare faces
      const result = await FaceApiService.compareTwoFacesWithIpfs(formData);

      console.log("Face comparison results:", {
        success: result.success,
        totalFaces: result.faces?.length,
        bestMatch: result.best_match,
      });

      if (!result.success) {
        throw new Error(result.error || "Face comparison failed");
      }

      // If we have a match, try to find the wallet in the registry
      let registryMatch = null;
      if (
        result.success &&
        result.best_match?.match &&
        result.best_match.embedding
      ) {
        try {
          const walletAddress = await this.findWalletByFace(
            result.best_match.embedding
          );
          if (walletAddress) {
            registryMatch = { wallet_address: walletAddress };
            console.log("Found matching wallet in registry:", walletAddress);

            // Automatically redeem the bounty
            await this.redeemBountyAsAgent(bountyId, walletAddress);
            return {
              success: true,
              match: true,
              bountyData,
              comparisonDetails: result.faces || [],
              bestMatch: result.best_match,
              registryMatch,
              redeemed: true,
            };
          }
        } catch (error) {
          console.error("Error searching face registry:", error);
        }
      }

      return {
        success: true,
        match: result.best_match?.match || false,
        bountyData,
        comparisonDetails: result.faces || [],
        bestMatch: result.best_match,
        registryMatch,
        redeemed: false,
      };
    } catch (error) {
      console.error("Error verifying bounty:", error);
      throw error;
    }
  }

  static async getBounty(bountyId: string) {
    try {
      const provider = await agentKit.provider;
      const contract = new ethers.Contract(
        this.CONTRACT_ADDRESS!,
        this.ABI,
        provider
      );

      // Get bounty data
      const bountyData = await contract.bounties(bountyId);
      console.log("Retrieved bounty data:", {
        bountyId,
        personId: bountyData.personId.toString(),
        isActive: bountyData.isActive,
      });

      // Get person data to get the IPFS hash
      const personId = bountyData.personId;
      const personData = await contract.people(personId);

      console.log("Retrieved person data:", {
        personId: personId.toString(),
        ipfsHash: personData.ipfsHash,
        hasIpfsHash: Boolean(personData.ipfsHash),
      });

      if (!personData.ipfsHash) {
        throw new Error(`No IPFS hash found for person ID ${personId}`);
      }

      return {
        id: bountyId,
        personId: personId.toString(),
        reward: bountyData.reward,
        isActive: bountyData.isActive,
        creator: bountyData.creator,
        createdAt: bountyData.createdAt.toString(),
        ipfsHash: personData.ipfsHash, // This should be a string from the contract
      };
    } catch (error) {
      console.error("Error fetching bounty:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to fetch bounty #${bountyId}: ${errorMessage}`);
    }
  }

  static async getPersonBounties(personId: string) {
    const provider = await agentKit.provider;
    const contract = new ethers.Contract(
      this.CONTRACT_ADDRESS,
      this.ABI,
      provider
    );
    return contract.getPersonBounties(personId);
  }

  static async redeemBountyAsAgent(bountyId: string, redeemer: string) {
    try {
      const signer = agentKit.getSigner();
      const contract = new ethers.Contract(
        this.CONTRACT_ADDRESS!,
        this.ABI,
        signer
      );

      // Get current balance
      const balance = await signer.provider.getBalance(
        await signer.getAddress()
      );
      console.log(
        "Current wallet balance:",
        ethers.formatEther(balance),
        "FLOW"
      );

      // Set gas parameters
      const gasPrice = ethers.parseUnits("0.1", "gwei");
      const gasLimit = 300000; // Fixed gas limit

      // Convert redeemer to a valid address format
      let redeemerAddress: string;
      try {
        // If it's already a valid address, this will normalize it
        redeemerAddress = ethers.getAddress(redeemer);
      } catch (err) {
        // If it's not a valid address, create one from the user ID
        // This is a deterministic way to create an address from a user ID
        const hashedId = ethers.id(redeemer); // keccak256 hash of the user ID
        redeemerAddress = ethers.getAddress(hashedId.slice(0, 42)); // Take first 40 chars + '0x'
      }

      console.log("Redeeming bounty with params:", {
        bountyId: BigInt(bountyId),
        redeemer: redeemerAddress,
        gasPrice: gasPrice.toString(),
        gasLimit,
      });

      // Execute transaction with fixed parameters
      const tx = await contract.redeemBounty(
        BigInt(bountyId),
        redeemerAddress,
        {
          gasPrice,
          gasLimit,
        }
      );

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      return receipt;
    } catch (error) {
      console.error("Error redeeming bounty:", error);
      throw error;
    }
  }

  static async redeemBounty(bountyId: string, redeemer: string) {
    try {
      const signer = agentKit.getSigner();
      const contract = new ethers.Contract(
        this.CONTRACT_ADDRESS!,
        this.ABI,
        signer
      );

      // Get current balance
      const balance = await signer.provider.getBalance(
        await signer.getAddress()
      );
      console.log(
        "Current wallet balance:",
        ethers.formatEther(balance),
        "FLOW"
      );

      // Set gas parameters
      const gasPrice = ethers.parseUnits("0.1", "gwei");
      const gasLimit = 300000; // Fixed gas limit

      // Ensure redeemer is a valid address
      let redeemerAddress = redeemer;
      if (!ethers.isAddress(redeemer)) {
        console.warn(
          "Invalid redeemer address format, attempting to convert..."
        );
        try {
          redeemerAddress = ethers.getAddress(redeemer);
        } catch (err) {
          throw new Error(`Invalid redeemer address: ${redeemer}`);
        }
      }

      console.log("Redeeming bounty with params:", {
        bountyId: BigInt(bountyId),
        redeemer: redeemerAddress,
        gasPrice: gasPrice.toString(),
        gasLimit,
      });

      // Execute transaction with fixed parameters
      const tx = await contract.redeemBounty(
        BigInt(bountyId),
        redeemerAddress,
        {
          gasPrice,
          gasLimit,
        }
      );

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      return receipt;
    } catch (error) {
      console.error("Error redeeming bounty:", error);
      throw error;
    }
  }

  static async getAllBounties() {
    const provider = await agentKit.provider;
    const contract = new ethers.Contract(
      this.CONTRACT_ADDRESS!,
      this.ABI,
      provider
    );

    try {
      // Get all bounty events
      const filter = contract.filters.BountyCreated();
      const events = await contract.queryFilter(filter);
      const bounties = [];

      // Fetch each bounty's details
      for (const event of events) {
        const bountyId = event.args.bountyId;
        try {
          const bountyData = await contract.bounties(bountyId);
          if (bountyData.isActive) {
            bounties.push({
              id: bountyId.toString(),
              personId: bountyData.personId,
              reward: bountyData.reward,
              isActive: bountyData.isActive,
              creator: bountyData.creator,
              createdAt: bountyData.createdAt,
            });
          }
        } catch (err) {
          console.error(`Error fetching bounty ${bountyId}:`, err);
        }
      }

      return bounties;
    } catch (error) {
      console.error("Error fetching bounties:", error);
      throw new Error("Failed to fetch bounties");
    }
  }
}
