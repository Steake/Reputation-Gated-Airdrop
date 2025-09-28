// Deploy ReputationAirdropScaled contract
const { ethers } = require("hardhat");

async function main() {
  const tokenAddress = process.env.TOKEN_ADDRESS;
  if (!tokenAddress) {
    throw new Error("TOKEN_ADDRESS environment variable not set");
  }

  console.log("Deploying ReputationAirdropScaled...");
  console.log("Using token address:", tokenAddress);

  // Get deployer address to use as signer
  const [deployer] = await ethers.getSigners();

  // Contract parameters
  const campaign = ethers.keccak256(ethers.toUtf8Bytes("shadowgraph-reputation-airdrop-v1"));
  const floorScore = 600000;
  const capScore = 1000000;
  const minPayout = ethers.parseEther("100");
  const maxPayout = ethers.parseEther("1000");
  const curve = 1; // SQRT curve

  const ReputationAirdropScaled = await ethers.getContractFactory("ReputationAirdropScaled");
  const airdrop = await ReputationAirdropScaled.deploy(
    tokenAddress,
    deployer.address, // Use deployer as signer for testing
    campaign,
    floorScore,
    capScore,
    minPayout,
    maxPayout,
    curve
  );
  await airdrop.waitForDeployment();

  const address = await airdrop.getAddress();
  console.log("ReputationAirdropScaled deployed to:", address);

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
