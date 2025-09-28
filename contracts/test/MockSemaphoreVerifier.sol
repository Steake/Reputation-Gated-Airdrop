pragma solidity ^0.8.0;

import "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";

contract MockSemaphoreVerifier is ISemaphoreVerifier {
    bool private verificationResult;

    constructor() {
        verificationResult = false;
    }

    function setVerificationResult(bool result) external {
        verificationResult = result;
    }

    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[4] calldata _pubSignals,
        uint merkleTreeDepth
    ) external view override returns (bool) {
        // Ignore inputs for mock, return the set result
        return verificationResult;
    }
}