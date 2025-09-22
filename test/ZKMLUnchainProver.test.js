const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZKMLUnchainProver", function () {
  let zkmlProver;
  let mockVerifier;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy MockVerifier
    const MockVerifier = await ethers.getContractFactory("MockVerifier");
    mockVerifier = await MockVerifier.deploy();
    await mockVerifier.waitForDeployment();

    // Deploy ZKMLUnchainProver
    const ZKMLUnchainProver = await ethers.getContractFactory("ZKMLUnchainProver");
    zkmlProver = await ZKMLUnchainProver.deploy(await mockVerifier.getAddress());
    await zkmlProver.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct verifier", async function () {
      expect(await zkmlProver.verifier()).to.equal(await mockVerifier.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await zkmlProver.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await zkmlProver.paused()).to.equal(false);
    });
  });

  describe("Circuit Parameters", function () {
    it("Should return correct circuit parameters", async function () {
      const params = await zkmlProver.getCircuitParameters();
      expect(params[0]).to.equal(16); // MAX_OPINIONS
      expect(params[1]).to.equal(4); // OPINION_SIZE
      expect(params[2]).to.equal(600000); // MIN_REPUTATION_THRESHOLD
      expect(params[3]).to.equal(1000000); // MAX_REPUTATION_SCORE
    });
  });

  describe("Reputation Proof Verification", function () {
    it("Should verify a valid reputation proof", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000]; // Valid reputation score

      await expect(zkmlProver.connect(user1).verifyReputationProof(proof, publicInputs))
        .to.emit(zkmlProver, "ReputationVerified")
        .withArgs(user1.address, 750000, anyValue, anyValue);

      // Check stored reputation
      const [reputation, timestamp] = await zkmlProver.getVerifiedReputation(user1.address);
      expect(reputation).to.equal(750000);
      expect(timestamp).to.be.gt(0);
    });

    it("Should reject proof with score below threshold", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [500000]; // Below MIN_REPUTATION_THRESHOLD

      await expect(
        zkmlProver.connect(user1).verifyReputationProof(proof, publicInputs)
      ).to.be.revertedWith("Invalid reputation score");
    });

    it("Should reject proof with score above maximum", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [1100000]; // Above MAX_REPUTATION_SCORE

      await expect(
        zkmlProver.connect(user1).verifyReputationProof(proof, publicInputs)
      ).to.be.revertedWith("Invalid reputation score");
    });

    it("Should prevent proof replay attacks", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000];

      // First verification should succeed
      await zkmlProver.connect(user1).verifyReputationProof(proof, publicInputs);

      // Second verification with same proof should fail
      await expect(
        zkmlProver.connect(user1).verifyReputationProof(proof, publicInputs)
      ).to.be.revertedWith("Proof already used");
    });

    it("Should reject empty proof", async function () {
      const proof = [];
      const publicInputs = [750000];

      await expect(
        zkmlProver.connect(user1).verifyReputationProof(proof, publicInputs)
      ).to.be.revertedWith("Empty proof");
    });
  });

  describe("Reputation Validity Check", function () {
    beforeEach(async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000];
      await zkmlProver.connect(user1).verifyReputationProof(proof, publicInputs);
    });

    it("Should return true for recent valid reputation", async function () {
      const isValid = await zkmlProver.isReputationValid(user1.address, 3600); // 1 hour
      expect(isValid).to.equal(true);
    });

    it("Should return false for non-existent reputation", async function () {
      const isValid = await zkmlProver.isReputationValid(user2.address, 3600);
      expect(isValid).to.equal(false);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to pause contract", async function () {
      await zkmlProver.connect(owner).pause();
      expect(await zkmlProver.paused()).to.equal(true);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(zkmlProver.connect(user1).pause()).to.be.revertedWith("Not authorized");
    });

    it("Should allow owner to transfer ownership", async function () {
      await zkmlProver.connect(owner).transferOwnership(user1.address);
      expect(await zkmlProver.owner()).to.equal(user1.address);
    });
  });
});

// Helper to match any value in events
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
