import { ethers } from "ethers";
import { providerService } from "./provider";
import { uniswapService } from "./uniswap";
import { FUSIONX_V3_CONTRACTS, POOL_FEES } from "@/constants/contracts";
import { agentKit } from "./agentkit";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

const SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
];

interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  recipient: string;
  slippageTolerance?: number;
}

class SwapService {
  private async getTokenDetails(tokenAddress: string) {
    try {
      // First check if token exists in subgraph
      const tokens = await uniswapService.getTokens();
      const token = tokens.find(t => t.id.toLowerCase() === tokenAddress.toLowerCase());
      
      if (!token) {
        throw new Error(`Token ${tokenAddress} not found in FusionX pools`);
      }

      console.log("Found token in subgraph:", token);
      
      // Double check with on-chain data
      const provider = await providerService.getProvider();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const [decimals, symbol] = await Promise.all([
        tokenContract.decimals(),
        tokenContract.symbol(),
      ]);

      return { decimals, symbol };
    } catch (error) {
      console.error("Failed to get token details:", error);
      throw new Error("Invalid token address or contract");
    }
  }

  private async checkAllowance(
    tokenAddress: string,
    owner: string,
    spender: string,
    amount: bigint
  ): Promise<boolean> {
    const provider = await providerService.getProvider();
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const allowance = await token.allowance(owner, spender);
    return allowance >= amount;
  }

  async approveToken(
    tokenAddress: string,
    amount: string,
    spender: string = FUSIONX_V3_CONTRACTS.SWAP_ROUTER
  ): Promise<void> {
    const agentSigner = agentKit.getSigner();
    if (!agentSigner) throw new Error("Agent wallet not connected");

    const agentAddress = await agentSigner.getAddress();
    const { decimals } = await this.getTokenDetails(tokenAddress);
    const amountWei = ethers.parseUnits(amount, decimals);

    const hasAllowance = await this.checkAllowance(
      tokenAddress,
      agentAddress,
      spender,
      amountWei
    );

    if (!hasAllowance) {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, agentSigner);
      console.log(`Agent approving ${amount} tokens for ${spender}`);
      const tx = await token.approve(spender, amountWei);
      await tx.wait();
      console.log("Agent token approval confirmed");
    } else {
      console.log("Agent has sufficient allowance");
    }
  }

  async executeSwap({
    tokenIn,
    tokenOut,
    amount,
    recipient,
    slippageTolerance = 0.5,
  }: SwapParams) {
    try {
      if (!ethers.isAddress(tokenIn) || !ethers.isAddress(tokenOut)) {
        throw new Error("Invalid token addresses");
      }

      const agentSigner = agentKit.getSigner();
      if (!agentSigner) throw new Error("Agent wallet not connected");

      console.log("Agent executing swap with params:", {
        tokenIn,
        tokenOut,
        amount,
        recipient,
      });

      const { decimals: decimalsIn } = await this.getTokenDetails(tokenIn);

      const swapRouter = new ethers.Contract(
        FUSIONX_V3_CONTRACTS.SWAP_ROUTER,
        SWAP_ROUTER_ABI,
        agentSigner
      );

      const params = {
        tokenIn,
        tokenOut,
        fee: POOL_FEES.MEDIUM,
        recipient,
        deadline: Math.floor(Date.now() / 1000) + 1200,
        amountIn: ethers.parseUnits(amount, decimalsIn),
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      };

      const tx = await swapRouter.exactInputSingle(params, {
        gasLimit: 300000,
      });

      console.log("Agent swap transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Agent swap confirmed:", receipt.transactionHash);

      return receipt;
    } catch (error) {
      console.error("Agent swap execution failed:", error);
      throw error;
    }
  }
}

export const swapService = new SwapService();
