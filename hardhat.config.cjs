require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: process.env.VITE_RPC_URL || "http://127.0.0.1:8546",
      chainId: 1337,
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
        "0x7c852118294e09e9a9ed03243eff960ed04846a7b6ced37d0d4f241836fdef4d",
        "0x47e179ec197488593b187f80a00eb0da3f4b7d65b0e71447f2e42d537d0ce7a7",
        "0x8c52c97e7e8496353d6e826e7a8e9cdf1accfdfd89ac16c793752e075e26c7d7",
        "0x6576791ab547384755c028fe0159fb8c735f6ab04b81401233d2a34fb3cf54f1",
        "0x82d052c865435c0a4b4210cc00fa23d9000f18dbcfdddf2476f624f33f7a8a95",
        "0xaa3a7572565d28c3ba16c07d089e0b05d98198543b20de67a40793d58d5f8a33",
        "0x0dbbe8e4ae425a6d2687f1a7e3ba17e3c66f55a22084e4c459fc0a5b1b403542",
      ],
    },
    sepolia: {
      url: process.env.VITE_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
