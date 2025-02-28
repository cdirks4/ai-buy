const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PersonBounty Integration", function () {
  let eigenVerifier;
  let personBounty;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const EigenVerifier = await ethers.getContractFactory("EigenLayerVerifier");
    eigenVerifier = await EigenVerifier.deploy();
    await eigenVerifier.waitForDeployment();

    const PersonBounty = await ethers.getContractFactory("PersonBounty");
    personBounty = await PersonBounty.deploy(await eigenVerifier.getAddress());
    await personBounty.waitForDeployment();
  });

  it("should create person with valid proof", async function () {
    const personId = "test-person";
    const detectionScore = ethers.parseUnits("0.95", 18);
    
    // Create proof matching the verification key values from EigenLayerVerifier constructor
    const alpha = ethers.zeroPadValue(ethers.toBeHex(1234n), 32);
    const beta = ethers.zeroPadValue(ethers.toBeHex(5678n), 32);
    const gamma = ethers.zeroPadValue(ethers.toBeHex(9012n), 32);
    
    const testProof = ethers.concat([alpha, beta, gamma]);
    const ipfsHash = "QmTest123";
    
    // Generate unique nullifier
    const nullifier = ethers.keccak256(
        ethers.solidityPacked(
            ["string", "uint256"],
            [personId, Date.now()]
        )
    );
    
    // Generate commitment from ipfsHash instead of proof components
    const commitment = ethers.keccak256(
        ethers.toUtf8Bytes(ipfsHash)
    );

    const publicInputs = ethers.concat([nullifier, commitment]);

    // Verify the proof first
    const verifyTx = await eigenVerifier.verifyProof(testProof, publicInputs);
    await expect(verifyTx).to.not.be.reverted;

    // Then create person with the verified proof
    const createTx = await personBounty.createPersonWithProof(
        personId,
        ipfsHash,
        testProof,
        publicInputs,
        detectionScore
    );
    await expect(createTx).to.not.be.reverted;

    // Verify person was created correctly
    const person = await personBounty.people(personId);
    expect(person.id).to.equal(personId);
    expect(person.ipfsHash).to.equal(ipfsHash);
    expect(person.nullifier).to.equal(nullifier);
    expect(person.commitment).to.equal(commitment);
  });
});
