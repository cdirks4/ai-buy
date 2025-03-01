import { ethers } from "ethers";
import { agentKit } from "./agentkit";
import { PersonBountyABI } from "@/constants/abi";
import axios from "axios";

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

  static async getPerson(id: string) {
    try {
      console.log("Getting person data for ID:", id);
      const provider = await this.getProvider();
      const contract = new ethers.Contract(
        this.CONTRACT_ADDRESS!,
        this.ABI,
        provider
      );

      const personData = await contract.people(id);
      console.log("Raw person data from contract:", {
        id: personData[0],
        ipfsHash: personData[1],
        detectionScore: personData[2],
        createdAt: personData[3],
      });

      // Fetch face data from Pinata
      const ipfsHash = personData[1];
      if (!ipfsHash) {
        throw new Error("No IPFS hash found for person");
      }

      let faceData = null;
      try {
        console.log("Fetching IPFS data with hash:", ipfsHash);
        faceData = await this.getFromPinata(ipfsHash);
        console.log("Face data from IPFS:", {
          embeddingLength: faceData?.embedding?.length || 0,
          hasLandmarks: !!faceData?.landmarks,
        });
      } catch (ipfsError) {
        console.error("Failed to fetch IPFS data:", ipfsError);
        // Continue without face data
      }

      return {
        id: personData[0],
        ipfsHash: personData[1],
        detectionScore: parseFloat(ethers.formatUnits(personData[2], 18)),
        createdAt: personData[3].toString(),
        faceData,
      };
    } catch (error) {
      console.error("Error getting person:", error);
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
      console.log("Verifying bounty:", { bountyId });

      // Get bounty data first
      const bountyData = await this.getBounty(bountyId);
      if (!bountyData || !bountyData.isActive) {
        throw new Error("Bounty not found or inactive");
      }

      // Get person data using the existing getPerson method
      const personData = await this.getPerson(bountyData.personId);
      if (!personData || !personData.ipfsHash) {
        throw new Error("Person data or IPFS hash not found");
      }

      // Create form data for the Modal endpoint
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("ipfs_hash", personData.ipfsHash);
      formData.append("threshold", "0.5");

      // Call the Modal endpoint for face comparison
      const result = await FaceApiService.compareFaceWithIpfs(formData);

      if (!result.success) {
        throw new Error(result.error || "Face verification failed");
      }

      return {
        success: true,
        match: result.match,
        similarity: result.similarity,
        bountyData: {
          personId: bountyData.personId,
          reward: bountyData.reward,
          isActive: bountyData.isActive,
        },
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
    const signer = agentKit.getSigner();
    const contract = new ethers.Contract(
      this.CONTRACT_ADDRESS,
      this.ABI,
      signer
    );
    const tx = await contract.redeemBounty(bountyId, redeemer);
    return tx.wait();
  }

  static async getAllBounties() {
    const provider = await agentKit.provider;
    const contract = new ethers.Contract(
      this.CONTRACT_ADDRESS,
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
