// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ZKMLUnchainProver.sol";

/**
 * @title ReputationAirdropZKScaled
 * @dev ZK-proof-based reputation airdrop contract with scaled payouts
 * 
 * This contract allows users to claim airdrop tokens based on their reputation
 * scores using zero-knowledge proofs for verification. It integrates with the
 * ZKMLUnchainProver contract to verify reputation proofs.
 */
contract ReputationAirdropZKScaled {
    // Token interface
    interface IERC20 {
        function transfer(address to, uint256 amount) external returns (bool);
        function balanceOf(address account) external view returns (uint256);
    }

    // Payout curve types
    enum PayoutCurve { LINEAR, SQRT, QUADRATIC }

    // Contract configuration
    IERC20 public immutable token;
    ZKMLUnchainProver public immutable zkProver;
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
        uint256 payout
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
     * @param _zkProver ZKMLUnchainProver contract address
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
        ZKMLUnchainProver _zkProver,
        bytes32 _campaign,
        uint256 _floorScore,
        uint256 _capScore,
        uint256 _minPayout,
        uint256 _maxPayout,
        PayoutCurve _curve,
        uint256 _maxReputationAge
    ) {
        require(address(_token) != address(0), "Invalid token address");
        require(address(_zkProver) != address(0), "Invalid ZK prover address");
        require(_capScore > _floorScore, "Invalid score range");
        require(_maxPayout > _minPayout, "Invalid payout range");
        require(_maxReputationAge > 0, "Invalid reputation age");

        token = _token;
        zkProver = _zkProver;
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
     * @dev Claim airdrop tokens using ZK proof
     * @param proof ZK proof data
     * @param score Reputation score (must match proof)
     */
    function claim(
        bytes calldata proof,
        uint256 score
    ) external whenNotPaused {
        require(!claimed[msg.sender], "Already claimed");
        require(score >= floorScore, "Score below minimum threshold");

        // Check if user has a valid, recent reputation proof
        require(
            zkProver.isReputationValid(msg.sender, maxReputationAge),
            "No valid reputation proof"
        );

        // Get the verified reputation from the ZK prover
        (uint256 verifiedScore, ) = zkProver.getVerifiedReputation(msg.sender);
        require(verifiedScore == score, "Score mismatch with verified reputation");

        // Mark as claimed
        claimed[msg.sender] = true;

        // Calculate payout based on score and curve
        uint256 payout = quotePayout(score);

        // Transfer tokens
        require(token.transfer(msg.sender, payout), "Transfer failed");

        totalClaimed += payout;

        emit Claimed(msg.sender, score, payout);
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

        if (!zkProver.isReputationValid(user, maxReputationAge)) {
            return (false, 0, 0);
        }

        (uint256 verifiedScore, ) = zkProver.getVerifiedReputation(user);
        
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
     * @return _zkProver ZK prover contract address
     * @return _maxReputationAge Maximum reputation age
     * @return _campaign Campaign identifier
     */
    function getZKParameters()
        external view returns (
            address _zkProver,
            uint256 _maxReputationAge,
            bytes32 _campaign
        )
    {
        return (address(zkProver), maxReputationAge, campaign);
    }
}