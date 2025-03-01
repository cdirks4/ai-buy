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

  static async verifyBounty(bountyId: string, imageFile: File) {
    try {
      // Get bounty data first
      const bountyData = await this.getBounty(bountyId);
      if (!bountyData) {
        throw new Error("Bounty not found");
      }

      // Get the person data to get the IPFS hash
      const personData = await this.getPerson(bountyData.personId);
      if (!personData || !personData.ipfsHash) {
        throw new Error("Person data or IPFS hash not found");
      }

      // Create form data for verification
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("ipfs_hash", personData.ipfsHash);
      formData.append("threshold", "0.6"); // Adjust threshold as needed

      console.log("Verifying with data:", {
        bountyId,
        personId: bountyData.personId,
        ipfsHash: personData.ipfsHash,
      });

      // Use FaceApiService to compare faces
      const result = await FaceApiService.compareFaceWithIpfs(formData);

      return {
        success: true,
        match: result.match,
        bountyData,
      };
    } catch (error) {
      console.error("Error verifying bounty:", error);
      throw error;
    }
  }

  static async getBounty(bountyId: string) {
    const provider = await agentKit.provider;
    const contract = new ethers.Contract(
      this.CONTRACT_ADDRESS,
      this.ABI,
      provider
    );

    try {
      // Use the bounties mapping directly with numeric bountyId
      const bountyData = await contract.bounties(bountyId);
      return {
        personId: bountyData.personId,
        reward: bountyData.reward,
        isActive: bountyData.isActive,
        creator: bountyData.creator,
        createdAt: bountyData.createdAt,
        bountyId: bountyId,
      };
    } catch (error) {
      console.error("Error fetching bounty:", error);
      throw new Error(`Failed to fetch bounty #${bountyId}`);
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
      // Use agentKit instead of direct private key
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

      // Set gas price
      const gasPrice = ethers.parseUnits("0.1", "gwei");

      // Execute transaction directly without gas estimation
      const tx = await contract.redeemBounty(BigInt(bountyId), redeemer, {
        gasPrice,
        gasLimit: 300000, // Set a fixed gas limit
      });

      console.log("Transaction sent:", tx.hash);
      return await tx.wait();
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

      // Set gas price
      const gasPrice = ethers.parseUnits("0.1", "gwei");

      // Execute transaction directly without ENS resolution
      const tx = await contract.redeemBounty(BigInt(bountyId), redeemer, {
        gasPrice,
        gasLimit: 300000, // Set a fixed gas limit since estimation fails
      });

      console.log("Transaction sent:", tx.hash);
      return await tx.wait();
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
