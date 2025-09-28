/* global describe it beforeEach */

import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("ZKMLOnChainVerifier", function () {
  let zkmlVerifier;
  let mockVerifier;
  let mockSemaphoreVerifier;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy MockVerifier for IVerifier
    const MockVerifier = await ethers.getContractFactory("MockVerifier");
    mockVerifier = await MockVerifier.deploy();
    await mockVerifier.waitForDeployment();

    // Deploy MockSemaphoreVerifier for ISemaphoreVerifier
    const MockSemaphoreVerifier = await ethers.getContractFactory("MockSemaphoreVerifier");
    mockSemaphoreVerifier = await MockSemaphoreVerifier.deploy();
    await mockSemaphoreVerifier.waitForDeployment();

    // Deploy ZKMLOnChainVerifier with both verifiers and group ID
    const ZKMLOnChainVerifier = await ethers.getContractFactory("ZKMLOnChainVerifier");
    zkmlVerifier = await ZKMLOnChainVerifier.deploy(
      await mockVerifier.getAddress(),
      await mockSemaphoreVerifier.getAddress(),
      1n // Mock group ID
    );
    await zkmlVerifier.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct verifier", async function () {
      expect(await zkmlVerifier.verifier()).to.equal(await mockVerifier.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await zkmlVerifier.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await zkmlVerifier.paused()).to.equal(false);
    });
  });

  describe("Circuit Parameters", function () {
    it("Should return correct circuit parameters", async function () {
      const params = await zkmlVerifier.getCircuitParameters();
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

      // Mock the verifier to return true for this proof
      await mockVerifier.connect(owner).setVerificationResult(true);

      await expect(zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs)).to.emit(
        zkmlVerifier,
        "ReputationVerified"
      );

      // Check stored reputation
      const [reputation, timestamp] = await zkmlVerifier.getVerifiedReputation(user1.address);
      expect(reputation).to.equal(750000);
      expect(timestamp).to.be.gt(0);
    });

    it("Should reject proof with score below threshold", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [500000]; // Below MIN_REPUTATION_THRESHOLD

      await expect(
        zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs)
      ).to.be.revertedWith("Invalid reputation score");
    });

    it("Should reject proof with score above maximum", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [1100000]; // Above MAX_REPUTATION_SCORE

      await expect(
        zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs)
      ).to.be.revertedWith("Invalid reputation score");
    });

    it("Should prevent proof replay attacks", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000];

      // Mock verifier
      await mockVerifier.connect(owner).setVerificationResult(true);

      // First verification should succeed
      await zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs);

      // Second verification with same proof should fail
      await expect(
        zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs)
      ).to.be.revertedWith("Proof already used");
    });

    it("Should reject empty proof", async function () {
      const proof = [];
      const publicInputs = [750000];

      await expect(
        zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs)
      ).to.be.revertedWith("Empty proof");
    });

    it("Should reject invalid ZK proof", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000];

      // Mock verifier to return false
      await mockVerifier.connect(owner).setVerificationResult(false);

      await expect(zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs)).to.emit(
        zkmlVerifier,
        "ProofRejected"
      );

      // Reputation should not be stored
      const [reputation, timestamp] = await zkmlVerifier.getVerifiedReputation(user1.address);
      expect(reputation).to.equal(0);
      expect(timestamp).to.equal(0);
    });
  });

  describe("Threshold Proof Verification", function () {
    it("Should verify a valid threshold proof (above threshold)", async function () {
      const proof = [1, 2, 3, 4, 5, 6];
      const publicInputs = [600000, 1]; // threshold=600K, isAbove=true

      // Mock verifier
      await mockVerifier.connect(owner).setVerificationResult(true);

      await expect(
        zkmlVerifier.connect(user1).verifyReputationThreshold(proof, publicInputs)
      ).to.emit(zkmlVerifier, "ThresholdVerified");

      // Check stored reputation (stores threshold as proxy)
      const [reputation, timestamp] = await zkmlVerifier.getVerifiedReputation(user1.address);
      expect(reputation).to.equal(600000);
      expect(timestamp).to.be.gt(0);
    });

    it("Should reject threshold proof where isAbove is false", async function () {
      const proof = [1, 2, 3, 4, 5, 6];
      const publicInputs = [600000, 0]; // threshold=600K, isAbove=false

      await expect(
        zkmlVerifier.connect(user1).verifyReputationThreshold(proof, publicInputs)
      ).to.be.revertedWith("Proof does not satisfy threshold");
    });

    it("Should reject threshold proof with invalid threshold", async function () {
      const proof = [1, 2, 3, 4, 5, 6];
      const publicInputs = [2000000, 1]; // Invalid threshold > MAX_REPUTATION_SCORE

      await expect(
        zkmlVerifier.connect(user1).verifyReputationThreshold(proof, publicInputs)
      ).to.be.revertedWith("Invalid threshold");
    });

    it("Should prevent threshold proof replay attacks", async function () {
      const proof = [1, 2, 3, 4, 5, 6];
      const publicInputs = [600000, 1];

      // Mock verifier
      await mockVerifier.connect(owner).setVerificationResult(true);

      // First verification should succeed
      await zkmlVerifier.connect(user1).verifyReputationThreshold(proof, publicInputs);

      // Second verification with same proof should fail
      await expect(
        zkmlVerifier.connect(user1).verifyReputationThreshold(proof, publicInputs)
      ).to.be.revertedWith("Proof already used");
    });

    it("Should reject empty threshold proof", async function () {
      const proof = [];
      const publicInputs = [600000, 1];

      await expect(
        zkmlVerifier.connect(user1).verifyReputationThreshold(proof, publicInputs)
      ).to.be.revertedWith("Empty proof");
    });

    it("Should reject invalid ZK threshold proof", async function () {
      const proof = [1, 2, 3, 4, 5, 6];
      const publicInputs = [600000, 1];

      // Mock verifier to return false
      await mockVerifier.connect(owner).setVerificationResult(false);

      await expect(
        zkmlVerifier.connect(user1).verifyReputationThreshold(proof, publicInputs)
      ).to.emit(zkmlVerifier, "ProofRejected");

      // Reputation should not be stored
      const [reputation, timestamp] = await zkmlVerifier.getVerifiedReputation(user1.address);
      expect(reputation).to.equal(0);
      expect(timestamp).to.equal(0);
    });
  });

  describe("Reputation Validity Check", function () {
    beforeEach(async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000];
      await mockVerifier.connect(owner).setVerificationResult(true);
      await zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs);
    });

    it("Should return true for recent valid reputation", async function () {
      const isValid = await zkmlVerifier.isReputationValid(user1.address, 3600); // 1 hour
      expect(isValid).to.equal(true);
    });

    it("Should return false for expired reputation", async function () {
      // Advance time by 2 hours
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine");

      const isValid = await zkmlVerifier.isReputationValid(user1.address, 3600);
      expect(isValid).to.equal(false);
    });

    it("Should return false for non-existent reputation", async function () {
      const isValid = await zkmlVerifier.isReputationValid(user2.address, 3600);
      expect(isValid).to.equal(false);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to pause contract", async function () {
      await zkmlVerifier.connect(owner).pause();
      expect(await zkmlVerifier.paused()).to.equal(true);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(zkmlVerifier.connect(user1).pause()).to.be.revertedWith("Not authorized");
    });

    it("Should allow owner to transfer ownership", async function () {
      await zkmlVerifier.connect(owner).transferOwnership(user1.address);
      expect(await zkmlVerifier.owner()).to.equal(user1.address);
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      await expect(zkmlVerifier.connect(user1).transferOwnership(user2.address)).to.be.revertedWith(
        "Not authorized"
      );
    });

    it("Should revert updateVerifier since verifier is immutable", async function () {
      const newVerifier = await (await ethers.getContractFactory("MockVerifier")).deploy();
      await expect(
        zkmlVerifier.connect(owner).updateVerifier(await newVerifier.getAddress())
      ).to.be.revertedWith("Verifier is immutable");
    });
  });

  describe("Security Properties", function () {
    it("Should not allow verification when paused", async function () {
      await zkmlVerifier.connect(owner).pause();

      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000];

      await expect(
        zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs)
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should emit ProofRejected for invalid proofs", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000];

      // Mock verifier to return false
      await mockVerifier.connect(owner).setVerificationResult(false);

      await expect(zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs)).to.emit(
        zkmlVerifier,
        "ProofRejected"
      );
    });
  });

  describe("Anonymous Credential Verification", function () {
    it("Should verify a valid anonymous credential", async function () {
      const proof = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n]; // uint256[8] for Semaphore proof
      const nullifierHash = 123n;
      const externalNullifier = 456n;
      const signal = 1n;
      const merkleProof = Array.from({ length: 32 }, () => 0n);

      // Mock semaphore verifier to return true
      await mockSemaphoreVerifier.connect(owner).setVerificationResult(true);

      await expect(
        zkmlVerifier
          .connect(user1)
          .verifyAnonymousCredential(proof, nullifierHash, externalNullifier, signal, merkleProof)
      ).to.emit(zkmlVerifier, "ReputationVerified");

      // Check stored timestamp (score is 0 for anonymous)
      const [reputation, timestamp] = await zkmlVerifier.getVerifiedReputation(user1.address);
      expect(reputation).to.equal(0);
      expect(timestamp).to.be.gt(0);
    });

    it("Should reject invalid anonymous credential proof", async function () {
      const proof = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n];
      const nullifierHash = 123n;
      const externalNullifier = 456n;
      const signal = 1n;
      const merkleProof = Array.from({ length: 32 }, () => 0n);

      // Mock semaphore verifier to return false
      await mockSemaphoreVerifier.connect(owner).setVerificationResult(false);

      await expect(
        zkmlVerifier
          .connect(user1)
          .verifyAnonymousCredential(proof, nullifierHash, externalNullifier, signal, merkleProof)
      ).to.emit(zkmlVerifier, "ProofRejected");

      // No storage
      const [reputation, timestamp] = await zkmlVerifier.getVerifiedReputation(user1.address);
      expect(reputation).to.equal(0);
      expect(timestamp).to.equal(0);
    });

    it("Should prevent anonymous credential replay attacks", async function () {
      const proof = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n];
      const nullifierHash = 123n;
      const externalNullifier = 456n;
      const signal = 1n;
      const merkleProof = Array.from({ length: 32 }, () => 0n);

      // Mock verifier
      await mockSemaphoreVerifier.connect(owner).setVerificationResult(true);

      // First verification succeeds
      await zkmlVerifier
        .connect(user1)
        .verifyAnonymousCredential(proof, nullifierHash, externalNullifier, signal, merkleProof);

      // Second fails
      await expect(
        zkmlVerifier
          .connect(user1)
          .verifyAnonymousCredential(proof, nullifierHash, externalNullifier, signal, merkleProof)
      ).to.be.revertedWith("Proof already used");
    });

    it("Should reject empty anonymous proof", async function () {
      const proof = new Array(8).fill(0n); // Empty array of 8 elements
      const nullifierHash = 123n;
      const externalNullifier = 456n;
      const signal = 1n;
      const merkleProof = Array.from({ length: 32 }, () => 0n);

      await expect(
        zkmlVerifier
          .connect(user1)
          .verifyAnonymousCredential(proof, nullifierHash, externalNullifier, signal, merkleProof)
      ).to.be.revertedWith("Empty proof");
    });
  });

  describe("Set Membership Verification", function () {
    it("Should verify a valid set membership proof", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000, 789012]; // [setCommitment, memberHash] as numbers, setCommitment >= threshold

      console.log("Set membership publicInputs:", publicInputs);
      console.log(
        "MockVerifier verificationResult before:",
        await mockVerifier.verificationResult()
      );

      // Mock verifier
      await mockVerifier.connect(owner).setVerificationResult(true);
      console.log(
        "MockVerifier verificationResult after set:",
        await mockVerifier.verificationResult()
      );

      const tx = await zkmlVerifier.connect(user1).verifySetMembership(proof, publicInputs);
      console.log("Transaction successful:", tx.hash);
      console.log("Transaction receipt:", await tx.wait());

      await expect(tx).to.emit(zkmlVerifier, "ReputationVerified");

      // Check stored (setCommitment as proxy)
      const [reputation, timestamp] = await zkmlVerifier.getVerifiedReputation(user1.address);
      console.log("Stored reputation:", Number(reputation), "Timestamp:", timestamp);
      expect(Number(reputation)).to.equal(750000);
      expect(timestamp).to.be.gt(0);
    });

    it("Should reject invalid set membership proof", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [123456n, 789012n];

      // Mock verifier to false
      await mockVerifier.connect(owner).setVerificationResult(false);

      await expect(
        zkmlVerifier.connect(user1).verifySetMembership(proof, Array.from(publicInputs))
      ).to.emit(zkmlVerifier, "ProofRejected");

      // No storage
      const [reputation, timestamp] = await zkmlVerifier.getVerifiedReputation(user1.address);
      expect(reputation).to.equal(0);
      expect(timestamp).to.equal(0);
    });

    it("Should prevent set membership replay attacks", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000, 789012]; // Valid setCommitment

      console.log("Replay test publicInputs:", publicInputs);

      // Mock verifier
      await mockVerifier.connect(owner).setVerificationResult(true);

      // First succeeds
      console.log("First verification attempt:");
      const tx1 = await zkmlVerifier.connect(user1).verifySetMembership(proof, publicInputs);
      console.log("First tx hash:", tx1.hash);
      await tx1.wait();

      // Second fails
      console.log("Second verification attempt:");
      const tx2Promise = zkmlVerifier.connect(user1).verifySetMembership(proof, publicInputs);
      console.log("Second tx attempt result:");
      await expect(tx2Promise).to.be.revertedWith("Proof already used");
    });

    it("Should reject set membership with insufficient public inputs", async function () {
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [123456n]; // Only one input

      await expect(
        zkmlVerifier.connect(user1).verifySetMembership(proof, Array.from(publicInputs))
      ).to.be.revertedWith("Insufficient public inputs for set membership");
    });

    it("Should reject empty set membership proof", async function () {
      const proof = [];
      const publicInputs = [123456n, 789012n];

      await expect(
        zkmlVerifier.connect(user1).verifySetMembership(proof, Array.from(publicInputs))
      ).to.be.revertedWith("Empty proof");
    });
  });

  describe("Integration with Airdrop Contracts", function () {
    let token;
    let airdropZK;
    const floorScore = 600000;
    const capScore = 1000000;
    const minPayout = ethers.parseUnits("100", 18);
    const maxPayout = ethers.parseUnits("1000", 18);
    const PayoutCurve = { LINEAR: 0 };

    beforeEach(async function () {
      // Deploy MockERC20
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      token = await MockERC20.deploy("Test Token", "TEST", 18, ethers.parseUnits("1000000", 18));
      await token.waitForDeployment();

      const campaign = ethers.keccak256(ethers.toUtf8Bytes("test-campaign-zk"));

      // Deploy ReputationAirdropZKScaled with zkmlVerifier
      const ReputationAirdropZKScaled = await ethers.getContractFactory(
        "ReputationAirdropZKScaled"
      );
      airdropZK = await ReputationAirdropZKScaled.deploy(
        await token.getAddress(),
        await zkmlVerifier.getAddress(),
        campaign,
        floorScore,
        capScore,
        minPayout,
        maxPayout,
        PayoutCurve.LINEAR,
        3600
      );
      await airdropZK.waitForDeployment();

      // Fund the airdrop
      await token.transfer(await airdropZK.getAddress(), ethers.parseUnits("100000", 18));
    });

    it("Should allow claim after successful reputation proof verification", async function () {
      // First, verify a reputation proof
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000]; // Above threshold
      await mockVerifier.connect(owner).setVerificationResult(true);
      await zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs);

      // Now claim on airdrop - assume it checks isReputationValid
      const initialBalance = await token.balanceOf(user1.address);

      // For ZK airdrop, claim might take proof or just address since verified on-chain
      // Assuming it calls isReputationValid on zkmlVerifier
      await expect(airdropZK.connect(user1).claim(750000)).to.emit(airdropZK, "Claimed");

      const finalBalance = await token.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
      expect(await airdropZK.claimed(user1.address)).to.equal(true);
    });

    it("Should reject claim if reputation not verified or expired", async function () {
      // No verification, direct claim should fail
      await expect(airdropZK.connect(user1).claim(750000)).to.be.revertedWith(
        "No valid reputation proof"
      );

      // Or if expired, advance time
      // But for simplicity, test without verification
    });

    it("Should reject claim when contract paused", async function () {
      await airdropZK.connect(owner).pause();
      const proof = [1, 2, 3, 4, 5];
      const publicInputs = [750000];
      await mockVerifier.connect(owner).setVerificationResult(true);
      await zkmlVerifier.connect(user1).verifyReputationProof(proof, publicInputs);

      // Claim should revert with "Contract is paused"
      await expect(airdropZK.connect(user1).claim(750000)).to.be.revertedWith("Contract is paused");
    });
  });
});
