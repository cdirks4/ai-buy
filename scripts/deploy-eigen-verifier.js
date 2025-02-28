const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying EigenLayerVerifier...");
  
  const EigenVerifier = await ethers.getContractFactory("EigenLayerVerifier");
  const verifier = await EigenVerifier.deploy();
  await verifier.waitForDeployment();

  const verifierAddress = await verifier.getAddress();
  console.log("EigenLayerVerifier deployed to:", verifierAddress);
  
  // Save the address to use it later
  console.log("\nAdd this to your .env.local file:");
  console.log(`NEXT_PUBLIC_EIGEN_ADDRESS=${verifierAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });