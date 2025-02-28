const { expect } = require("chai");

describe("PersonBounty", function () {
  let personBounty;

  beforeEach(async function () {
    const PersonBounty = await ethers.getContractFactory("PersonBounty");
    personBounty = await PersonBounty.deploy();
    await personBounty.waitForDeployment();
  });

  it("Should create a person", async function () {
    const id = "person1";
    const faceEmbedding = [1, 2, 3].map((n) =>
      ethers.parseUnits(n.toString(), 18)
    );
    const landmarks = [
      [1, 2],
      [3, 4],
    ].map((arr) => arr.map((n) => ethers.parseUnits(n.toString(), 18)));
    const detectionScore = ethers.parseUnits("0.95", 18);

    await personBounty.createPerson(
      id,
      faceEmbedding,
      landmarks,
      detectionScore
    );
    const person = await personBounty.people(id);
    expect(person.id).to.equal(id);
  });

  it("Should create a bounty", async function () {
    const personId = "person2";
    const faceEmbedding = [1, 2, 3].map((n) =>
      ethers.parseUnits(n.toString(), 18)
    );
    const landmarks = [
      [1, 2],
      [3, 4],
    ].map((arr) => arr.map((n) => ethers.parseUnits(n.toString(), 18)));
    const detectionScore = ethers.parseUnits("0.95", 18);
    const reward = ethers.parseUnits("10", 18);

    await personBounty.createPerson(
      personId,
      faceEmbedding,
      landmarks,
      detectionScore
    );
    await personBounty.createBounty(personId, reward);
    const bounty = await personBounty.bounties(personId);
    expect(bounty.personId).to.equal(personId);
  });

  it("Should fail to create bounty for nonexistent person", async function () {
    const nonexistentId = "nonexistent";
    const reward = ethers.parseUnits("10", 18);

    await expect(
      personBounty.createBounty(nonexistentId, reward)
    ).to.be.revertedWith("Person must exist");
  });
});
