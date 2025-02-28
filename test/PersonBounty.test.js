const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PersonBounty", function () {
  let personBounty;
  let eigenVerifier;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Deploy EigenLayerVerifier first
    const EigenVerifier = await ethers.getContractFactory("EigenLayerVerifier");
    eigenVerifier = await EigenVerifier.deploy();
    await eigenVerifier.waitForDeployment();

    // Deploy PersonBounty with EigenLayerVerifier address
    const PersonBounty = await ethers.getContractFactory("PersonBounty");
    personBounty = await PersonBounty.deploy(await eigenVerifier.getAddress());
    await personBounty.waitForDeployment();
  });

  it("Should create a person", async function () {
    const id = "person1";
    const ipfsHash = "QmTest123";
    const detectionScore = ethers.parseUnits("0.95", 18);

    await personBounty.createPerson(id, ipfsHash, detectionScore);
    const person = await personBounty.people(id);
    expect(person.id).to.equal(id);
  });

  it("Should create a bounty", async function () {
    // First create a person
    const id = "person2";
    const ipfsHash = "QmTest456";
    const detectionScore = ethers.parseUnits("0.95", 18);
    const reward = ethers.parseUnits("1.0", 18);

    await personBounty.createPerson(id, ipfsHash, detectionScore);
    await personBounty.createBounty(id, reward, { value: reward });

    const bountyId = 1;
    const bounty = await personBounty.bounties(bountyId);
    expect(bounty.personId).to.equal(id);
  });

  it("Should fail to create bounty for nonexistent person", async function () {
    const nonexistentId = "nonexistent";
    const reward = ethers.parseUnits("1.0", 18);

    await expect(
      personBounty.createBounty(nonexistentId, reward, { value: reward })
    ).to.be.revertedWith("Person must exist");
  });
});
