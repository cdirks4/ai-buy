const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deployToZircuit() {
  console.log("Deploying PersonBounty contract to Zircuit testnet...");

  // Deploy the contract without constructor arguments
  const PersonBounty = await ethers.getContractFactory("PersonBounty");
  const personBounty = await PersonBounty.deploy();
  await personBounty.waitForDeployment();

  const address = await personBounty.getAddress();
  console.log("PersonBounty deployed to:", address);

  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  const deployTx = await personBounty.deploymentTransaction();
  await deployTx.wait(3); // Wait for 3 block confirmations

  // Verify the contract
  console.log("Verifying contract on Zircuit testnet...");
  try {
    await hre.run("verify:verify", {
      address: address,
      contract: "contracts/PersonBounty.sol:PersonBounty",
      constructorArguments: [],
      network: "zircuitTestnet",
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Verification error:", error.message);
      console.log("You can try verifying manually with:");
      console.log(`npx hardhat verify --network zircuitTestnet ${address}`);
    }
  }

  console.log("Deployment complete!");
  console.log("Contract address:", address);
  console.log(
    "View on Zircuit Explorer:",
    `https://testnet.zircuitscan.io/address/${address}`
  );
}

async function deployToZkSync() {
  console.log("Deploying PersonBounty contract to zkSync Era Sepolia...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy the contract
  const PersonBounty = await ethers.getContractFactory("PersonBounty");
  const personBounty = await PersonBounty.deploy();

  console.log("Waiting for deployment transaction...");
  await personBounty.waitForDeployment();

  const address = await personBounty.getAddress();
  console.log("PersonBounty deployed to:", address);

  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  const deployTx = await personBounty.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(2); // Wait for 2 block confirmations
  }

  // Verify the contract
  console.log("Verifying contract on zkSync Era Sepolia...");
  try {
    await hre.run("verify:verify", {
      address: address,
      contract: "contracts/PersonBounty.sol:PersonBounty",
      constructorArguments: [],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.error("Verification error:", error);
    console.log("You can try verifying manually on zkSync Explorer");
    console.log(`https://sepolia.explorer.zksync.io/address/${address}`);
  }

  console.log("Deployment complete!");
  console.log("Contract address:", address);
  console.log(
    "View on zkSync Explorer:",
    `https://sepolia.explorer.zksync.io/address/${address}`
  );
}

// ... existing Flow deployment function remains unchanged ...

// Modified main function to allow choosing network
async function main() {
  const network = process.env.DEPLOY_NETWORK || "flow";

  switch (network) {
    case "zircuit":
      await deployToZircuit();
      break;
    case "zksync":
      await deployToZkSync();
      break;
    default:
      await deployToFlow();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
