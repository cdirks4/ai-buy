const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying FaceRegistration contract to Flow EVM testnet...");

  // Deploy the contract without constructor arguments
  const FaceRegistry = await ethers.getContractFactory("FaceRegistration");
  const faceRegistry = await FaceRegistry.deploy();
  await faceRegistry.waitForDeployment();

  const address = await faceRegistry.getAddress();
  console.log("FaceRegistration deployed to:", address);

  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  const deployTx = await faceRegistry.deploymentTransaction();
  await deployTx.wait(3); // Wait for 3 block confirmations

  // Verify the contract
  console.log("Verifying contract on Flow EVM testnet...");
  try {
    await hre.run("verify:verify", {
      address: address,
      contract: "contracts/FaceRegistry.sol:FaceRegistration",
      constructorArguments: [],
      network: "flowEvmTestnet",
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Verification error:", error.message);
      console.log("You can try verifying manually with:");
      console.log(`npx hardhat verify --network flowEvmTestnet ${address}`);
    }
  }

  console.log("Deployment complete!");
  console.log("Contract address:", address);
  console.log(
    "View on Flow Explorer:",
    `https://evm-testnet.flowscan.io/address/${address}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
