import pkg from "hardhat";
const { ethers } = pkg;

// Deploy on Polygon Mumbai: MockERC20, ZKMLOnChainVerifier, ReputationAirdropZKScaled

async function main() {
  // Deploy mock token for testing
  console.log("Deploying MockERC20...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("Mock Reputation Token", "MRT", ethers.parseEther("1000000"));
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("MockERC20 deployed to:", tokenAddress);

  // Deploy ZKMLOnChainVerifier
  console.log("Deploying ZKMLOnChainVerifier...");
  const ZKMLOnChainVerifier = await ethers.getContractFactory("ZKMLOnChainVerifier");
  const verifier = await ZKMLOnChainVerifier.deploy();
  await verifier.waitForDeployment();
  const zkmlAddress = await verifier.getAddress();
  console.log("ZKMLOnChainVerifier deployed to:", zkmlAddress);

  // Deploy ReputationAirdropZKScaled
  console.log("Deploying ReputationAirdropZKScaled...");
  console.log("Using token address:", tokenAddress);
  console.log("Using ZKML verifier address:", zkmlAddress);

  // Contract parameters (same as mainnet for consistency)
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
    maxReputationAge
  );
  await airdrop.waitForDeployment();

  const airdropAddress = await airdrop.getAddress();
  console.log("ReputationAirdropZKScaled deployed to:", airdropAddress);

  console.log("\n=== Polygon Mumbai Deployment Summary ===");
  console.log("Token (MockERC20):", tokenAddress);
  console.log("ZKMLOnChainVerifier:", zkmlAddress);
  console.log("ReputationAirdropZKScaled:", airdropAddress);
  console.log("Explorer: https://mumbai.polygonscan.com");

  return { tokenAddress, zkmlAddress, airdropAddress };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;