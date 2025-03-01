// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PersonBounty {
    struct PersonData {
        string id;
        string ipfsHash; // Contains face data
        uint256 detectionScore;
        uint256 createdAt;
    }

    struct Bounty {
        string personId;
        uint256 reward;
        bool isActive;
        address creator;
        uint256 createdAt;
        uint256 bountyId;
    }

    mapping(string => PersonData) public people;
    mapping(uint256 => Bounty) public bounties;
    mapping(string => uint256[]) public personBounties;

    uint256 private nextBountyId = 1;

    event PersonCreated(string indexed id, string ipfsHash);

    event BountyCreated(
        uint256 indexed bountyId,
        string personId,
        uint256 reward
    );

    event BountyRedeemed(
        uint256 indexed bountyId,
        address redeemer,
        uint256 reward
    );

    function createPerson(
        string memory id,
        string memory ipfsHash,
        uint256 detectionScore
    ) public {
        require(bytes(people[id].id).length == 0, "Person already exists");

        people[id] = PersonData({
            id: id,
            ipfsHash: ipfsHash,
            detectionScore: detectionScore,
            createdAt: block.timestamp
        });

        emit PersonCreated(id, ipfsHash);
    }

    function createBounty(
        string memory personId,
        uint256 reward
    ) public payable {
        require(bytes(people[personId].id).length > 0, "Person must exist");
        require(msg.value >= reward, "Insufficient bounty amount");

        uint256 bountyId = nextBountyId++;

        Bounty memory bounty = Bounty({
            personId: personId,
            reward: reward,
            isActive: true,
            creator: msg.sender,
            createdAt: block.timestamp,
            bountyId: bountyId
        });

        bounties[bountyId] = bounty;
        personBounties[personId].push(bountyId);

        emit BountyCreated(bountyId, personId, reward);
    }

    function redeemBounty(uint256 bountyId, address redeemer) public {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.isActive, "Bounty is not active");
        require(bounty.creator == msg.sender, "Only bounty creator can redeem");
        require(msg.sender != redeemer, "Creator cannot be redeemer");

        bounty.isActive = false;
        payable(redeemer).transfer(bounty.reward);

        emit BountyRedeemed(bountyId, redeemer, bounty.reward);
    }

    function getPersonBounties(
        string memory personId
    ) public view returns (uint256[] memory) {
        return personBounties[personId];
    }
}
