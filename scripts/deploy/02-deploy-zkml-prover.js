// Deploy ZKMLUnchainProver contract
const { ethers } = require("hardhat");

async function main() {
  const verifierAddress = process.env.VERIFIER_ADDRESS;
  if (!verifierAddress) {
    throw new Error("VERIFIER_ADDRESS environment variable not set");
  }

  console.log("Deploying ZKMLUnchainProver...");
  console.log("Using verifier address:", verifierAddress);

  const ZKMLUnchainProver = await ethers.getContractFactory("ZKMLUnchainProver");
  const zkmlProver = await ZKMLUnchainProver.deploy(verifierAddress);
  await zkmlProver.waitForDeployment();

  const address = await zkmlProver.getAddress();
  console.log("ZKMLUnchainProver deployed to:", address);

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
