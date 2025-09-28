// Deploy ZKMLOnChainVerifier contract
const { ethers } = require("hardhat");

async function main() {
  const verifierAddress = process.env.VERIFIER_ADDRESS;
  if (!verifierAddress) {
    throw new Error("VERIFIER_ADDRESS environment variable not set");
  }

  console.log("Deploying MockSemaphoreVerifier...");
  const MockSemaphoreVerifier = await ethers.getContractFactory("MockSemaphoreVerifier");
  const semaphoreVerifier = await MockSemaphoreVerifier.deploy();
  await semaphoreVerifier.waitForDeployment();
  const semaphoreAddress = await semaphoreVerifier.getAddress();
  console.log("MockSemaphoreVerifier deployed to:", semaphoreAddress);

  console.log("Deploying ZKMLOnChainVerifier...");
  console.log("Using verifier address:", verifierAddress);
  console.log("Using semaphore verifier address:", semaphoreAddress);

  const ZKMLOnChainVerifier = await ethers.getContractFactory("ZKMLOnChainVerifier");
  const zkmlVerifier = await ZKMLOnChainVerifier.deploy(verifierAddress, semaphoreAddress, 1); // groupId = 1 for demo
  await zkmlVerifier.waitForDeployment();

  const address = await zkmlVerifier.getAddress();
  console.log("ZKMLOnChainVerifier deployed to:", address);

  return address;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
