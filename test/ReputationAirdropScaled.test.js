const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputationAirdropScaled", function () {
  let airdrop;
  let token;
  let owner;
  let signer;
  let user1;
  let user2;
  let campaign;

  const floorScore = 600000;
  const capScore = 1000000;
  const minPayout = ethers.parseUnits("100", 18);
  const maxPayout = ethers.parseUnits("1000", 18);
  const PayoutCurve = { LINEAR: 0, SQRT: 1, QUADRATIC: 2 };

  beforeEach(async function () {
    [owner, signer, user1, user2] = await ethers.getSigners();
    campaign = ethers.keccak256(ethers.toUtf8Bytes("test-campaign"));

    // Deploy MockERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Test Token", "TEST", 18, ethers.parseUnits("1000000", 18));
    await token.waitForDeployment();

    // Deploy ReputationAirdropScaled
    const ReputationAirdropScaled = await ethers.getContractFactory("ReputationAirdropScaled");
    airdrop = await ReputationAirdropScaled.deploy(
      await token.getAddress(),
      signer.address,
      campaign,
      floorScore,
      capScore,
      minPayout,
      maxPayout,
      PayoutCurve.LINEAR
    );
    await airdrop.waitForDeployment();

    // Fund the airdrop contract
    await token.transfer(await airdrop.getAddress(), ethers.parseUnits("100000", 18));
  });

  describe("Deployment", function () {
    it("Should set correct parameters", async function () {
      const params = await airdrop.getPayoutParameters();
      expect(params[0]).to.equal(floorScore);
      expect(params[1]).to.equal(capScore);
      expect(params[2]).to.equal(minPayout);
      expect(params[3]).to.equal(maxPayout);
      expect(params[4]).to.equal(PayoutCurve.LINEAR);
    });
  });

  describe("Payout Calculation", function () {
    it("Should return 0 for scores below floor", async function () {
      const payout = await airdrop.quotePayout(500000);
      expect(payout).to.equal(0);
    });

    it("Should return max payout for scores at or above cap", async function () {
      const payout1 = await airdrop.quotePayout(capScore);
      const payout2 = await airdrop.quotePayout(capScore + 100000);
      expect(payout1).to.equal(maxPayout);
      expect(payout2).to.equal(maxPayout);
    });

    it("Should calculate linear payout correctly", async function () {
      const midScore = (floorScore + capScore) / 2;
      const expectedPayout = (minPayout + maxPayout) / 2n;
      const actualPayout = await airdrop.quotePayout(midScore);

      // Allow for small rounding differences
      expect(actualPayout).to.be.closeTo(expectedPayout, ethers.parseUnits("1", 18));
    });
  });

  describe("Claiming", function () {
    it("Should allow valid claim with correct signature", async function () {
      const score = 750000;
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const circuitId = "test-circuit";
      const modelDigest = ethers.keccak256(ethers.toUtf8Bytes("model"));
      const inputDigest = ethers.keccak256(ethers.toUtf8Bytes("input"));

      // Create message hash
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "string", "bytes32", "bytes32", "uint256", "uint256"],
        [campaign, user1.address, circuitId, modelDigest, inputDigest, score, deadline]
      );

      // Sign the message
      const signature = await signer.signMessage(ethers.getBytes(messageHash));
      const { v, r, s } = ethers.Signature.from(signature);

      const initialBalance = await token.balanceOf(user1.address);

      await expect(
        airdrop.connect(user1).claim(circuitId, modelDigest, inputDigest, score, deadline, v, r, s)
      ).to.emit(airdrop, "Claimed");

      const finalBalance = await token.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
      expect(await airdrop.claimed(user1.address)).to.equal(true);
    });

    it("Should reject claim with invalid signature", async function () {
      const score = 750000;
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const circuitId = "test-circuit";
      const modelDigest = ethers.keccak256(ethers.toUtf8Bytes("model"));
      const inputDigest = ethers.keccak256(ethers.toUtf8Bytes("input"));

      // Create invalid signature (signed by wrong account)
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "string", "bytes32", "bytes32", "uint256", "uint256"],
        [campaign, user1.address, circuitId, modelDigest, inputDigest, score, deadline]
      );

      const signature = await user1.signMessage(ethers.getBytes(messageHash)); // Wrong signer
      const { v, r, s } = ethers.Signature.from(signature);

      await expect(
        airdrop.connect(user1).claim(circuitId, modelDigest, inputDigest, score, deadline, v, r, s)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should reject expired signature", async function () {
      const score = 750000;
      const deadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const circuitId = "test-circuit";
      const modelDigest = ethers.keccak256(ethers.toUtf8Bytes("model"));
      const inputDigest = ethers.keccak256(ethers.toUtf8Bytes("input"));

      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "string", "bytes32", "bytes32", "uint256", "uint256"],
        [campaign, user1.address, circuitId, modelDigest, inputDigest, score, deadline]
      );

      const signature = await signer.signMessage(ethers.getBytes(messageHash));
      const { v, r, s } = ethers.Signature.from(signature);

      await expect(
        airdrop.connect(user1).claim(circuitId, modelDigest, inputDigest, score, deadline, v, r, s)
      ).to.be.revertedWith("Signature expired");
    });

    it("Should prevent double claiming", async function () {
      const score = 750000;
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const circuitId = "test-circuit";
      const modelDigest = ethers.keccak256(ethers.toUtf8Bytes("model"));
      const inputDigest = ethers.keccak256(ethers.toUtf8Bytes("input"));

      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "string", "bytes32", "bytes32", "uint256", "uint256"],
        [campaign, user1.address, circuitId, modelDigest, inputDigest, score, deadline]
      );

      const signature = await signer.signMessage(ethers.getBytes(messageHash));
      const { v, r, s } = ethers.Signature.from(signature);

      // First claim should succeed
      await airdrop
        .connect(user1)
        .claim(circuitId, modelDigest, inputDigest, score, deadline, v, r, s);

      // Second claim should fail
      await expect(
        airdrop.connect(user1).claim(circuitId, modelDigest, inputDigest, score, deadline, v, r, s)
      ).to.be.revertedWith("Already claimed");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to pause and unpause", async function () {
      await airdrop.connect(owner).pause();
      expect(await airdrop.paused()).to.equal(true);

      await airdrop.connect(owner).unpause();
      expect(await airdrop.paused()).to.equal(false);
    });

    it("Should allow emergency withdrawal", async function () {
      const initialBalance = await token.balanceOf(owner.address);
      const withdrawAmount = ethers.parseUnits("1000", 18);

      await airdrop.connect(owner).emergencyWithdraw(owner.address, withdrawAmount);

      const finalBalance = await token.balanceOf(owner.address);
      expect(finalBalance - initialBalance).to.equal(withdrawAmount);
    });
  });
});
