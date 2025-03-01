const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const network = hre.network.name;

  // Deploy PersonBounty Contract
  console.log(`Deploying PersonBounty contract to ${network}...`);
  const PersonBounty = await ethers.getContractFactory("PersonBounty");
  const personBounty = await PersonBounty.deploy();
  await personBounty.waitForDeployment();
  const personBountyAddress = await personBounty.getAddress();
  console.log("PersonBounty deployed to:", personBountyAddress);

  // Deploy FaceRegistry Contract
  console.log(`Deploying FaceRegistry contract to ${network}...`);
  const FaceRegistry = await ethers.getContractFactory("FaceRegistration");
  const faceRegistry = await FaceRegistry.deploy();
  await faceRegistry.waitForDeployment();
  const faceRegistryAddress = await faceRegistry.getAddress();
  console.log("FaceRegistry deployed to:", faceRegistryAddress);

  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  const personBountyTx = await personBounty.deploymentTransaction();
  const faceRegistryTx = await faceRegistry.deploymentTransaction();
  await Promise.all([personBountyTx.wait(3), faceRegistryTx.wait(3)]);

  // Verify PersonBounty contract
  console.log(`Verifying PersonBounty contract on ${network}...`);
  if (network === "zircuitTestnet") {
    console.log("Automatic verification not supported for Zircuit Testnet.");
    console.log("Please verify manually using:");
    console.log(
      `npx hardhat verify --network zircuitTestnet ${personBountyAddress}`
    );
    console.log("Or verify directly on the explorer:");
    console.log(
      `https://explorer.testnet.zircuit.com/address/${personBountyAddress}#code`
    );
  } else {
    try {
      await hre.run("verify:verify", {
        address: personBountyAddress,
        contract: "contracts/PersonBounty.sol:PersonBounty",
        constructorArguments: [],
      });
      console.log("PersonBounty contract verified successfully!");
    } catch (error) {
      console.error("PersonBounty verification error:", error);
      console.log(
        `npx hardhat verify --network ${network} ${personBountyAddress}`
      );
    }
  }

  // Verify FaceRegistry contract
  console.log(`Verifying FaceRegistry contract on ${network}...`);
  if (network === "zircuitTestnet") {
    console.log("Automatic verification not supported for Zircuit Testnet.");
    console.log("Please verify manually using:");
    console.log(
      `npx hardhat verify --network zircuitTestnet ${faceRegistryAddress}`
    );
    console.log("Or verify directly on the explorer:");
    console.log(
      `https://explorer.testnet.zircuit.com/address/${faceRegistryAddress}#code`
    );
  } else {
    try {
      await hre.run("verify:verify", {
        address: faceRegistryAddress,
        contract: "contracts/FaceRegistry.sol:FaceRegistration",
        constructorArguments: [],
      });
      console.log("FaceRegistry contract verified successfully!");
    } catch (error) {
      console.error("FaceRegistry verification error:", error);
      console.log(
        `npx hardhat verify --network ${network} ${faceRegistryAddress}`
      );
    }
  }

  // Set explorer URL based on network
  let explorerUrl;
  switch (network) {
    case "zircuitTestnet":
      explorerUrl = `https://explorer.testnet.zircuit.com/address/`;
      break;
    case "zkSyncTestnet":
      explorerUrl = `https://sepolia.explorer.zksync.io/address/`;
      break;
    case "flowEvmTestnet":
      explorerUrl = `https://evm-testnet.flowscan.io/address/`;
      break;
    case "hederaTestnet":
      explorerUrl = `https://testnet.hashscan.io/`;
      break;
    default:
      explorerUrl = `Block explorer URL not configured for ${network}`;
  }

  // Add network-specific verification handling
  const verifyContract = async (
    address,
    contractPath,
    constructorArgs = []
  ) => {
    if (network === "zircuitTestnet") {
      console.log("Automatic verification not supported for Zircuit Testnet.");
      console.log(
        `Verify manually at: https://explorer.testnet.zircuit.com/address/${address}#code`
      );
      return;
    }

    if (network === "hederaTestnet") {
      console.log("Automatic verification not supported for Hedera Testnet.");
      console.log(
        `Verify manually at: https://testnet.hashscan.io/${address}#code`
      );
      return;
    }

    try {
      await hre.run("verify:verify", {
        address: address,
        contract: contractPath,
        constructorArguments: constructorArgs,
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.error("Verification error:", error);
      console.log(`npx hardhat verify --network ${network} ${address}`);
    }
  };

  // Verify contracts
  console.log(`\nVerifying contracts on ${network}...`);
  await verifyContract(
    personBountyAddress,
    "contracts/PersonBounty.sol:PersonBounty"
  );
  await verifyContract(
    faceRegistryAddress,
    "contracts/FaceRegistry.sol:FaceRegistration"
  );

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("PersonBounty Contract:", personBountyAddress);
  console.log("FaceRegistry Contract:", faceRegistryAddress);
  console.log("\nView on Explorer:");
  console.log("PersonBounty:", `${explorerUrl}${personBountyAddress}`);
  console.log("FaceRegistry:", `${explorerUrl}${faceRegistryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
