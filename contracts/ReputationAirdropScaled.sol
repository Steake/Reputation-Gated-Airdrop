// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ReputationAirdropScaled
 * @dev ECDSA-based reputation airdrop contract with scaled payouts
 * 
 * This contract allows users to claim airdrop tokens based on their reputation
 * scores using ECDSA signatures for verification. The payout is scaled based
 * on the reputation score using configurable curves.
 */
contract ReputationAirdropScaled {
    // Token interface
    interface IERC20 {
        function transfer(address to, uint256 amount) external returns (bool);
        function balanceOf(address account) external view returns (uint256);
    }

    // Payout curve types
    enum PayoutCurve { LINEAR, SQRT, QUADRATIC }

    // Contract configuration
    IERC20 public immutable token;
    address public immutable signer;
    bytes32 public immutable campaign;
    
    // Payout parameters
    uint256 public immutable floorScore;      // Minimum score to be eligible
    uint256 public immutable capScore;       // Score at which max payout is reached
    uint256 public immutable minPayout;     // Minimum payout amount
    uint256 public immutable maxPayout;     // Maximum payout amount
    PayoutCurve public immutable curve;     // Payout curve type

    // State
    mapping(address => bool) public claimed;
    mapping(bytes32 => bool) public usedDigests;
    
    address public owner;
    bool public paused;
    uint256 public totalClaimed;

    // Events
    event Claimed(
        address indexed user,
        uint256 score,
        uint256 payout,
        string circuitId
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
     * @param _signer Address that signs the claims
     * @param _campaign Campaign identifier
     * @param _floorScore Minimum score for eligibility
     * @param _capScore Score for maximum payout
     * @param _minPayout Minimum payout amount
     * @param _maxPayout Maximum payout amount
     * @param _curve Payout curve type
     */
    constructor(
        IERC20 _token,
        address _signer,
        bytes32 _campaign,
        uint256 _floorScore,
        uint256 _capScore,
        uint256 _minPayout,
        uint256 _maxPayout,
        PayoutCurve _curve
    ) {
        require(address(_token) != address(0), "Invalid token address");
        require(_signer != address(0), "Invalid signer address");
        require(_capScore > _floorScore, "Invalid score range");
        require(_maxPayout > _minPayout, "Invalid payout range");

        token = _token;
        signer = _signer;
        campaign = _campaign;
        floorScore = _floorScore;
        capScore = _capScore;
        minPayout = _minPayout;
        maxPayout = _maxPayout;
        curve = _curve;
        owner = msg.sender;
        paused = false;
    }

    /**
     * @dev Claim airdrop tokens based on reputation score
     * @param circuitId Identifier for the circuit/model used
     * @param modelDigest Hash of the model parameters
     * @param inputDigest Hash of the input data
     * @param score Reputation score
     * @param deadline Signature deadline
     * @param v Recovery byte
     * @param r Signature parameter
     * @param s Signature parameter
     */
    function claim(
        string calldata circuitId,
        bytes32 modelDigest,
        bytes32 inputDigest,
        uint256 score,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        require(block.timestamp <= deadline, "Signature expired");
        require(!claimed[msg.sender], "Already claimed");
        require(score >= floorScore, "Score below minimum threshold");

        // Create message hash for signature verification
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(
                    abi.encodePacked(
                        campaign,
                        msg.sender,
                        circuitId,
                        modelDigest,
                        inputDigest,
                        score,
                        deadline
                    )
                )
            )
        );

        // Verify signature
        address recoveredSigner = ecrecover(messageHash, v, r, s);
        require(recoveredSigner == signer, "Invalid signature");

        // Prevent replay attacks with input/model digests
        bytes32 digestKey = keccak256(abi.encodePacked(msg.sender, modelDigest, inputDigest));
        require(!usedDigests[digestKey], "Digest already used");
        usedDigests[digestKey] = true;

        // Mark as claimed
        claimed[msg.sender] = true;

        // Calculate payout based on score and curve
        uint256 payout = quotePayout(score);

        // Transfer tokens
        require(token.transfer(msg.sender, payout), "Transfer failed");

        totalClaimed += payout;

        emit Claimed(msg.sender, score, payout, circuitId);
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
}