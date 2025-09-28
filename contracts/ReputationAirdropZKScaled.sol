// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ZKMLOnChainVerifier.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title ReputationAirdropZKScaled
 * @dev ZK-proof-based reputation airdrop contract with scaled payouts
 *
 * This contract allows users to claim airdrop tokens based on their reputation
 * scores using zero-knowledge proofs for verification. It integrates with the
 * ZKMLOnChainVerifier contract to verify reputation proofs.
 */
contract ReputationAirdropZKScaled {
    // Payout curve types
    enum PayoutCurve { LINEAR, SQRT, QUADRATIC }
  
    // Supported source chains for bridged proofs (mock)
    uint256 public constant SUPPORTED_SEPOLIA = 11155111;
    uint256 public constant SUPPORTED_MUMBAI = 80001;
  
    // Mock oracle for bridged proofs (in production, integrate with actual oracle contract)
    mapping(address => mapping(uint256 => mapping(bytes32 => bool))) public bridgedProofs;

    // Contract configuration
    IERC20 public immutable token;
    ZKMLOnChainVerifier public immutable zkVerifier;
    bytes32 public immutable campaign;
    
    // Payout parameters
    uint256 public immutable floorScore;      // Minimum score to be eligible
    uint256 public immutable capScore;       // Score at which max payout is reached
    uint256 public immutable minPayout;     // Minimum payout amount
    uint256 public immutable maxPayout;     // Maximum payout amount
    PayoutCurve public immutable curve;     // Payout curve type
    
    // Reputation validity window
    uint256 public immutable maxReputationAge; // Maximum age of reputation proof in seconds

    // State
    mapping(address => bool) public claimed;
    
    address public owner;
    bool public paused;
    uint256 public totalClaimed;

    // Events
    event Claimed(
        address indexed user,
        uint256 score,
        uint256 payout,
        uint256 timestamp
    );

    event ProofVerified(
        address indexed user,
        uint256 score,
        uint256 timestamp
    );

    event ContractPaused();
    event ContractUnpaused();

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /**
     * @dev Constructor
     * @param _token ERC20 token address for payouts
     * @param _zkVerifier ZKMLOnChainVerifier contract address
     * @param _campaign Campaign identifier
     * @param _floorScore Minimum score for eligibility
     * @param _capScore Score for maximum payout
     * @param _minPayout Minimum payout amount
     * @param _maxPayout Maximum payout amount
     * @param _curve Payout curve type
     * @param _maxReputationAge Maximum age of reputation proof (seconds)
     */
    constructor(
        IERC20 _token,
        ZKMLOnChainVerifier _zkVerifier,
        bytes32 _campaign,
        uint256 _floorScore,
        uint256 _capScore,
        uint256 _minPayout,
        uint256 _maxPayout,
        PayoutCurve _curve,
        uint256 _maxReputationAge
    ) {
        require(address(_token) != address(0), "Invalid token address");
        require(address(_zkVerifier) != address(0), "Invalid ZK verifier address");
        require(_capScore > _floorScore, "Invalid score range");
        require(_maxPayout > _minPayout, "Invalid payout range");
        require(_maxReputationAge > 0, "Invalid reputation age");
   
        token = _token;
        zkVerifier = _zkVerifier;
        campaign = _campaign;
        floorScore = _floorScore;
        capScore = _capScore;
        minPayout = _minPayout;
        maxPayout = _maxPayout;
        curve = _curve;
        maxReputationAge = _maxReputationAge;
        owner = msg.sender;
        paused = false;
    }

    /**
     * @dev Claim airdrop tokens using verified ZK reputation (local chain)
     * @param score Reputation score (must match verified reputation)
     */
    function claim(
        uint256 score
    ) external whenNotPaused {
      require(!claimed[msg.sender], "Already claimed");
      require(score >= floorScore, "Score below minimum threshold");
  
      // Check if user has a valid, recent reputation proof
      require(
          zkVerifier.isReputationValid(msg.sender, maxReputationAge),
          "No valid reputation proof"
      );
  
      // Get the verified reputation from the ZK verifier
      (uint256 verifiedScore, ) = zkVerifier.getVerifiedReputation(msg.sender);
      require(verifiedScore == score, "Score mismatch with verified reputation");
  
      // Mark as claimed
      claimed[msg.sender] = true;
  
      // Calculate payout based on score and curve
      uint256 payout = quotePayout(score);
  
      // Transfer tokens
      require(token.transfer(msg.sender, payout), "Transfer failed");
  
      totalClaimed += payout;
  
      emit ProofVerified(msg.sender, score, block.timestamp);
      emit Claimed(msg.sender, score, payout, block.timestamp);
    }
  
    /**
     * @dev Claim airdrop tokens using bridged ZK reputation proof from source chain
     * @param sourceChainId Source chain ID (must be supported)
     * @param proofHash Hash of the bridged proof envelope
     * @param score Reputation score from bridged proof
     */
    function claimBridged(
        uint256 sourceChainId,
        bytes32 proofHash,
        uint256 score
    ) external whenNotPaused {
      require(sourceChainId != block.chainid, "Must be cross-chain source");
      require(isSupportedSourceChain(sourceChainId), "Unsupported source chain");
      require(!claimed[msg.sender], "Already claimed");
      require(score >= floorScore, "Score below minimum threshold");
  
      // Validate bridged proof via mock oracle (in production, query actual oracle contract)
      require(isBridgedProofValid(msg.sender, sourceChainId, proofHash), "Invalid bridged proof");
  
      // For bridged proofs, assume score is validated by oracle; no local ZK verifier check
      // In production, oracle would provide verified score or additional validation
  
      // Mark as claimed
      claimed[msg.sender] = true;
  
      // Calculate payout based on score and curve
      uint256 payout = quotePayout(score);
  
      // Transfer tokens
      require(token.transfer(msg.sender, payout), "Transfer failed");
  
      totalClaimed += payout;
  
      emit ProofVerified(msg.sender, score, block.timestamp);
      emit Claimed(msg.sender, score, payout, block.timestamp);
    }
  
    /**
     * @dev Check if source chain is supported for bridged proofs (mock)
     * @param chainId Chain ID to check
     * @return supported True if supported
     */
    function isSupportedSourceChain(uint256 chainId) public pure returns (bool) {
      return chainId == SUPPORTED_SEPOLIA || chainId == SUPPORTED_MUMBAI;
    }
  
    /**
     * @dev Mock oracle validation for bridged proof (in production, integrate with real oracle)
     * @param user User address
     * @param sourceChainId Source chain ID
     * @param proofHash Proof hash
     * @return valid True if proof is valid (mock: always true for demo)
     */
    function isBridgedProofValid(
        address user,
        uint256 sourceChainId,
        bytes32 proofHash
    ) public view returns (bool) {
      // Mock: Check if proof is registered in oracle mapping
      // In production: Call oracle contract to verify proof envelope
      return bridgedProofs[user][sourceChainId][proofHash];
    }
  
    /**
     * @dev Admin function to register bridged proof in mock oracle (for testing)
     * @param user User address
     * @param sourceChainId Source chain ID
     * @param proofHash Proof hash
     */
    function registerBridgedProof(
        address user,
        uint256 sourceChainId,
        bytes32 proofHash
    ) external onlyOwner {
      bridgedProofs[user][sourceChainId][proofHash] = true;
    }

    /**
     * @dev Calculate payout for a given score
     * @param score Reputation score
     * @return payout Calculated payout amount
     */
    function quotePayout(uint256 score) public view returns (uint256 payout) {
        if (score < floorScore) {
            return 0;
        }
   
        if (score >= capScore) {
            return maxPayout;
        }
   
        // Normalize score to range [0, 1] scaled by 1e18
        uint256 normalizedScore = ((score - floorScore) * 1e18) / (capScore - floorScore);
        uint256 payoutRange = maxPayout - minPayout;
   
        if (curve == PayoutCurve.LINEAR) {
            payout = minPayout + (payoutRange * normalizedScore) / 1e18;
        } else if (curve == PayoutCurve.SQRT) {
            // Square root curve: payout = min + range * sqrt(normalized)
            uint256 sqrtNorm = sqrt(normalizedScore * 1e18) / 1e9; // sqrt of scaled value
            payout = minPayout + (payoutRange * sqrtNorm) / 1e18;
        } else if (curve == PayoutCurve.QUADRATIC) {
            // Quadratic curve: payout = min + range * normalized^2
            uint256 quadNorm = (normalizedScore * normalizedScore) / 1e18;
            payout = minPayout + (payoutRange * quadNorm) / 1e18;
        }
   
        return payout;
    }

    /**
     * @dev Square root function using Newton's method
     * @param x Input value
     * @return y Square root of x
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /**
     * @dev Check if user is eligible to claim
     * @param user Address to check
     * @return eligible True if user can claim
     * @return score User's verified reputation score
     * @return payout Potential payout amount
     */
    function checkEligibility(address user)
        external view returns (
            bool eligible,
            uint256 score,
            uint256 payout
        )
    {
        if (claimed[user]) {
            return (false, 0, 0);
        }

        if (!zkVerifier.isReputationValid(user, maxReputationAge)) {
            return (false, 0, 0);
        }

        (uint256 verifiedScore, ) = zkVerifier.getVerifiedReputation(user);
        
        if (verifiedScore < floorScore) {
            return (false, verifiedScore, 0);
        }

        uint256 potentialPayout = quotePayout(verifiedScore);
        
        return (true, verifiedScore, potentialPayout);
    }

    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyOwner {
        paused = true;
        emit ContractPaused();
    }

    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyOwner {
        paused = false;
        emit ContractUnpaused();
    }

    /**
     * @dev Emergency token withdrawal (admin only)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(token.transfer(to, amount), "Transfer failed");
    }

    /**
     * @dev Transfer ownership (admin only)
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner address");
        owner = newOwner;
    }

    /**
     * @dev Get contract balance
     * @return balance Current token balance
     */
    function getBalance() external view returns (uint256 balance) {
        return token.balanceOf(address(this));
    }

    /**
     * @dev Get payout parameters
     * @return _floorScore Minimum score
     * @return _capScore Maximum score
     * @return _minPayout Minimum payout
     * @return _maxPayout Maximum payout
     * @return _curve Payout curve type
     */
    function getPayoutParameters()
        external view returns (
            uint256 _floorScore,
            uint256 _capScore,
            uint256 _minPayout,
            uint256 _maxPayout,
            PayoutCurve _curve
        )
    {
        return (floorScore, capScore, minPayout, maxPayout, curve);
    }

    /**
     * @dev Get ZK-specific parameters
     * @return _zkVerifier ZK verifier contract address
     * @return _maxReputationAge Maximum reputation age
     * @return _campaign Campaign identifier
     */
    function getZKParameters()
        external view returns (
            address _zkVerifier,
            uint256 _maxReputationAge,
            bytes32 _campaign
        )
    {
        return (address(zkVerifier), maxReputationAge, campaign);
    }
}