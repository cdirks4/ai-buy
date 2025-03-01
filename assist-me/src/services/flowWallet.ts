import * as fcl from "@onflow/fcl";
import { ec as EC } from "elliptic";
import { SHA3 } from "sha3";

const ec = new EC('p256');

export class FlowWalletService {
  private static STORAGE_KEY = "flow_wallet";

  static async setupAccount() {
    try {
      // Generate key pair
      const keyPair = ec.genKeyPair();
      const privateKey = keyPair.getPrivate().toString('hex');
      const publicKey = keyPair.getPublic('hex').replace(/^04/, '');

      // Store the private key securely
      localStorage.setItem(this.STORAGE_KEY, privateKey);

      // Configure FCL
      fcl.config()
        .put("accessNode.api", "https://rest-testnet.onflow.org")
        .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")
        .put("app.detail.title", "PersonBounty")
        .put("app.detail.icon", "https://placekitten.com/g/200/200")
        .put("fcl.accountProof.enabled", true);

      return { publicKey };
    } catch (error) {
      console.error("Failed to setup Flow account:", error);
      throw error;
    }
  }

  static async signTransaction(message: string) {
    const privateKey = localStorage.getItem(this.STORAGE_KEY);
    if (!privateKey) throw new Error("No wallet found");

    const key = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'));
    const hasher = new SHA3(256);
    const msg = hasher.update(Buffer.from(message, 'hex')).digest();
    const sig = key.sign(msg);
    
    return Buffer.from(sig.toDER()).toString('hex');
  }

  static async getCurrentUser() {
    return fcl.currentUser().snapshot();
  }

  static async authenticate() {
    return fcl.authenticate();
  }

  static async unauthenticate() {
    return fcl.unauthenticate();
  }
}