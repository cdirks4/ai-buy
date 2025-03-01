const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deployToHedera() {
  console.log("Deploying contracts to Hedera testnet...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy PersonBounty Contract
  console.log("Deploying PersonBounty contract...");
  const PersonBounty = await ethers.getContractFactory("PersonBounty");
  const personBounty = await PersonBounty.deploy();
  await personBounty.waitForDeployment();
  const personBountyAddress = await personBounty.getAddress();
  console.log("PersonBounty deployed to:", personBountyAddress);

  // Deploy FaceRegistry Contract
  console.log("Deploying FaceRegistry contract...");
  const FaceRegistry = await ethers.getContractFactory("FaceRegistration");
  const faceRegistry = await FaceRegistry.deploy();
  await faceRegistry.waitForDeployment();
  const faceRegistryAddress = await faceRegistry.getAddress();
  console.log("FaceRegistry deployed to:", faceRegistryAddress);

  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  const personBountyTx = await personBounty.deploymentTransaction();
  const faceRegistryTx = await faceRegistry.deploymentTransaction();
  await Promise.all([
    personBountyTx.wait(2),
    faceRegistryTx.wait(2)
  ]);

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("PersonBounty:", personBountyAddress);
  console.log("FaceRegistry:", faceRegistryAddress);
  console.log("\nView on Hedera Explorer:");
  console.log(`https://testnet.hashscan.io/contract/${personBountyAddress}`);
  console.log(`https://testnet.hashscan.io/contract/${faceRegistryAddress}`);
}

deployToHedera()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
