// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IVerifier
 * @dev Interface for zero-knowledge proof verifier contracts
 * This interface is compatible with EZKL-generated verifiers
 */
interface IVerifier {
    /**
     * @dev Verifies a zero-knowledge proof
     * @param proof The proof data
     * @param publicInputs Array of public inputs to the circuit
     * @return True if the proof is valid, false otherwise
     */
    function verifyProof(
        uint256[] calldata proof,
        uint256[] calldata publicInputs
    ) external view returns (bool);
}