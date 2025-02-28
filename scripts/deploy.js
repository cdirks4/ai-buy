const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying PersonBounty contract to Flow EVM testnet...");

  const eigenVerifierAddress = "0x385532b29A6F01EB8AA641219e18BEDbCaaC5B08";

  // Deploy the contract with the verifier address
  const PersonBounty = await ethers.getContractFactory("PersonBounty");
  const personBounty = await PersonBounty.deploy(eigenVerifierAddress);
  await personBounty.waitForDeployment();

  const address = await personBounty.getAddress();
  console.log("PersonBounty deployed to:", address);

  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  const deployTx = await personBounty.deploymentTransaction();
  await deployTx.wait(3); // Wait for 3 block confirmations

  // Verify the contract
  console.log("Verifying contract on Flow EVM testnet...");
  try {
    await hre.run("verify:verify", {
      address: address,
      contract: "contracts/PersonBounty.sol:PersonBounty",
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
