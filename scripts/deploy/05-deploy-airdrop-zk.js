// Deploy ReputationAirdropZKScaled contract
const { ethers } = require("hardhat");

async function main() {
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const zkmlAddress = process.env.ZKML_ADDRESS;
  const priceFeedAddress = process.env.PRICE_FEED_ADDRESS;

  if (!tokenAddress) {
    throw new Error("TOKEN_ADDRESS environment variable not set");
  }
  if (!zkmlAddress) {
    throw new Error("ZKML_ADDRESS environment variable not set");
  }
  if (!priceFeedAddress) {
    throw new Error("PRICE_FEED_ADDRESS environment variable not set");
  }

  console.log("Deploying ReputationAirdropZKScaled...");
  console.log("Using token address:", tokenAddress);
  console.log("Using ZKML verifier address:", zkmlAddress);
  console.log("Using Chainlink price feed address:", priceFeedAddress);

  // Contract parameters
  const campaign = ethers.keccak256(ethers.toUtf8Bytes("shadowgraph-zk-airdrop-v1"));
  const floorScore = 600000;
  const capScore = 1000000;
  const minPayout = ethers.parseEther("100");
  const maxPayout = ethers.parseEther("1000");
  const curve = 1; // SQRT curve
  const maxReputationAge = 86400 * 7; // 7 days

  const ReputationAirdropZKScaled = await ethers.getContractFactory("ReputationAirdropZKScaled");
  const airdrop = await ReputationAirdropZKScaled.deploy(
    tokenAddress,
    zkmlAddress,
    campaign,
    floorScore,
    capScore,
    minPayout,
    maxPayout,
    curve,
    maxReputationAge,
    priceFeedAddress
  );
  await airdrop.waitForDeployment();

  const address = await airdrop.getAddress();
  console.log("ReputationAirdropZKScaled deployed to:", address);

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
