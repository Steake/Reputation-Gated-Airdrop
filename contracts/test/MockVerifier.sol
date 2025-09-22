// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IVerifier.sol";

/**
 * @title MockVerifier
 * @dev Mock implementation of IVerifier for testing purposes
 * 
 * This contract simulates EZKL proof verification for development and testing.
 * In production, this would be replaced with actual EZKL-generated verifier contracts.
 */
contract MockVerifier is IVerifier {
    // Configuration for testing
    bool public verificationResult;
    address public owner;
    
    // Track verification calls for testing
    mapping(bytes32 => bool) public verificationCalls;
    uint256 public verificationCount;

    event ProofVerified(
        bytes32 indexed proofHash,
        bool result,
        uint256 publicInputsLength
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        verificationResult = true; // Default to successful verification
    }

    /**
     * @dev Mock implementation of proof verification
     * @param proof The proof data
     * @param publicInputs Array of public inputs to the circuit
     * @return True if the proof is valid (or mock verification is enabled)
     */
    function verifyProof(
        uint256[] calldata proof,
        uint256[] calldata publicInputs
    ) external override returns (bool) {
        require(proof.length > 0, "Empty proof");
        require(publicInputs.length > 0, "Empty public inputs");

        // Create a hash of the proof and inputs for tracking
        bytes32 proofHash = keccak256(abi.encodePacked(proof, publicInputs));
        
        // Track this verification call
        verificationCalls[proofHash] = true;
        verificationCount++;

        // Basic validation: reputation score should be in valid range
        if (publicInputs.length > 0) {
            uint256 reputationScore = publicInputs[0];
            if (reputationScore < 600000 || reputationScore > 1000000) {
                emit ProofVerified(proofHash, false, publicInputs.length);
                return false;
            }
        }

        emit ProofVerified(proofHash, verificationResult, publicInputs.length);
        return verificationResult;
    }

    /**
     * @dev Set the verification result for testing
     * @param result The result to return for future verifications
     */
    function setVerificationResult(bool result) external onlyOwner {
        verificationResult = result;
    }

    /**
     * @dev Check if a specific proof hash was verified
     * @param proofHash Hash of the proof to check
     * @return verified True if this proof was submitted for verification
     */
    function wasProofVerified(bytes32 proofHash) external view returns (bool verified) {
        return verificationCalls[proofHash];
    }

    /**
     * @dev Get total number of verification attempts
     * @return count Number of times verifyProof was called
     */
    function getVerificationCount() external view returns (uint256 count) {
        return verificationCount;
    }

    /**
     * @dev Reset verification tracking (for testing)
     */
    function resetTracking() external onlyOwner {
        verificationCount = 0;
    }
}