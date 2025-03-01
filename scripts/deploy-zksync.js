const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying PersonBounty contract to zkSync Era Sepolia...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get the contract factory
  const PersonBounty = await ethers.getContractFactory("PersonBounty");

  // Deploy without transaction overrides first
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
    console.log("You can try verifying manually on the zkSync Explorer");
  }

  console.log("Deployment complete!");
  console.log("Contract address:", address);
  console.log(
    "View on zkSync Explorer:",
    `https://sepolia.explorer.zksync.io/address/${address}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
