const { ethers } = require("hardhat");
const Safe = require('@safe-global/safe-core-sdk').default;
const EthersAdapter = require('@safe-global/safe-ethers-lib').default;
const SafeFactory = require('@safe-global/safe-factory').default;

async function main() {
  const airdropAddress = process.env.AIRDROP_ADDRESS;
  if (!airdropAddress) {
    throw new Error("AIRDROP_ADDRESS environment variable not set");
  }

  console.log("Configuring multisig for airdrop at:", airdropAddress);

  // Sample owners - in production, load from env or config
  const owners = [
    "0x742d35Cc6634C0532925a3b8D3D8f8f3eD8f8f3e", // Owner 1
    "0x8fD8f8f3eD8f8f3e742d35Cc6634C0532925a3b8", // Owner 2
    "0x3e742d35Cc6634C0532925a3b8D3D8f8f3eD8f8f"  // Owner 3
  ];
  const threshold = 2; // Require 2/3 signatures

  // Connect to signer (deployer)
  const [signer] = await ethers.getSigners();
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer
  });

  const safeFactory = await SafeFactory.create({
    ethAdapter
  });

  // Create Safe
  const safeAccountConfig = {
    owners: owners,
    threshold: threshold,
    __unsafeSkipHardhatForkingChecks: true // For local testing
  };

  const safeSdk = await safeFactory.deploySafe({ safeAccountConfig });
  const safeAddress = await safeSdk.getAddress();

  console.log("Multisig Safe deployed to:", safeAddress);

  // Transfer ownership of airdrop contract to the Safe
  const airdropContract = await ethers.getContractAt("ReputationAirdropZKScaled", airdropAddress);
  const tx = await airdropContract.transferOwnership(safeAddress);
  await tx.wait();

  console.log("Ownership transferred to multisig Safe at:", safeAddress);

  return safeAddress;
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