const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EigenLayerVerifier", function () {
  let eigenVerifier;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const EigenLayerVerifier = await ethers.getContractFactory(
      "EigenLayerVerifier"
    );
    eigenVerifier = await EigenLayerVerifier.deploy();
  });

  describe("Proof Verification", function () {
    it("should verify a valid proof", async function () {
      const testProof = ethers.concat([
        ethers.zeroPadValue(ethers.toBeHex(1234n), 32), // alpha
        ethers.zeroPadValue(ethers.toBeHex(5678n), 32), // beta
        ethers.zeroPadValue(ethers.toBeHex(9012n), 32), // gamma
      ]);

      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("test-commitment"));
      const publicInputs = ethers.concat([nullifier, commitment]);

      const result = await eigenVerifier.verifyProof.staticCall(testProof, publicInputs);
      expect(result).to.be.true;
    });

    it("should reject an invalid proof", async function () {
      const invalidProof = ethers.concat([
        ethers.zeroPadValue(ethers.toBeHex(9999n), 32), // wrong alpha
        ethers.zeroPadValue(ethers.toBeHex(8888n), 32), // wrong beta
        ethers.zeroPadValue(ethers.toBeHex(7777n), 32), // wrong gamma
      ]);

      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("test-commitment"));
      const publicInputs = ethers.concat([nullifier, commitment]);

      const result = await eigenVerifier.verifyProof.staticCall(invalidProof, publicInputs);
      expect(result).to.be.false;
    });

    it("should verify a valid proof", async function () {
      const testProof = ethers.concat([
        ethers.zeroPadValue(ethers.toBeHex(1234n), 32), // matches alpha
        ethers.zeroPadValue(ethers.toBeHex(5678n), 32), // matches beta
        ethers.zeroPadValue(ethers.toBeHex(9012n), 32), // matches gamma
      ]);

      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("test-commitment"));
      const publicInputs = ethers.concat([nullifier, commitment]);

      const result = await eigenVerifier.verifyProof.staticCall(testProof, publicInputs);
      expect(result).to.be.true;
    });

    it("should reject an invalid proof", async function () {
      const invalidProof = ethers.concat([
        ethers.zeroPadValue(ethers.toBeHex(9999n), 32), // wrong alpha
        ethers.zeroPadValue(ethers.toBeHex(8888n), 32), // wrong beta
        ethers.zeroPadValue(ethers.toBeHex(7777n), 32), // wrong gamma
      ]);

      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("test-commitment"));
      const publicInputs = ethers.concat([nullifier, commitment]);

      const result = await eigenVerifier.verifyProof.staticCall(invalidProof, publicInputs);
      expect(result).to.be.false;
    });

    it("should prevent replay attacks", async function () {
      const testProof = ethers.concat([
        ethers.zeroPadValue(ethers.toBeHex(1234n), 32),
        ethers.zeroPadValue(ethers.toBeHex(5678n), 32),
        ethers.zeroPadValue(ethers.toBeHex(9012n), 32),
      ]);

      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("test-commitment"));
      const publicInputs = ethers.concat([nullifier, commitment]);

      // First verification should succeed
      await eigenVerifier.verifyProof(testProof, publicInputs);

      // Second verification with same nullifier should fail
      await expect(
        eigenVerifier.verifyProof(testProof, publicInputs)
      ).to.be.revertedWith("Nullifier already used");
    });

    it("should emit ProofVerified event on success", async function () {
      const testProof = ethers.concat([
        ethers.zeroPadValue(ethers.toBeHex(1234n), 32),
        ethers.zeroPadValue(ethers.toBeHex(5678n), 32),
        ethers.zeroPadValue(ethers.toBeHex(9012n), 32),
      ]);

      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("test-commitment"));
      const publicInputs = ethers.concat([nullifier, commitment]);

      await expect(eigenVerifier.verifyProof(testProof, publicInputs))
        .to.emit(eigenVerifier, "ProofVerified")
        .withArgs(nullifier, commitment);
    });
  });
});
