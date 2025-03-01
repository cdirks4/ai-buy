import { ethers } from "ethers";
import { providerService } from "./provider";

export class WalletService {
  static async fundNewWallet(
    recipientAddress: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      const provider = await providerService.getProvider();
      const amountWei = ethers.parseEther(amount);

      // Check sender's balance
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      console.log("Balance:", ethers.formatEther(balance), "FLOW");
      console.log("Attempting to send:", amount, "FLOW");

      // Send transaction
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: amountWei,
        chainId: 545,
      });

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Failed to fund wallet:", error);
      throw error;
    }
  }
}
