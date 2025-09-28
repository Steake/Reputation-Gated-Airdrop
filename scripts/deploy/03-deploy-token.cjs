// Deploy MockERC20 token contract
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying MockERC20...");

  // Deploy with 1M tokens, 18 decimals
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy(
    "Shadowgraph Token",
    "SHADOW",
    18,
    ethers.parseEther("1000000") // 1M tokens
  );
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("MockERC20 deployed to:", address);

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
