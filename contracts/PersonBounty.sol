// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PersonBounty {
    struct PersonData {
        string id;
        uint256[] faceEmbedding;
        uint256[][] landmarks;
        uint256 detectionScore;
        uint256 timestamp;
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
        uint256[] memory faceEmbedding,
        uint256[][] memory landmarks,
        uint256 detectionScore
    ) public {
        require(bytes(id).length > 0, "Invalid ID");
        require(bytes(people[id].id).length == 0, "Person already exists");

        PersonData memory person = PersonData({
            id: id,
            faceEmbedding: faceEmbedding,
            landmarks: landmarks,
            detectionScore: detectionScore,
            timestamp: block.timestamp
        });
        people[id] = person;
    }

    function createBounty(
        string memory personId,
        uint256 reward
    ) public payable {
        require(bytes(people[personId].id).length > 0, "Person must exist");
        require(msg.value == reward, "Must send exact reward amount");

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

    function getBountyById(
        uint256 bountyId
    )
        public
        view
        returns (
            string memory personId,
            uint256 reward,
            bool isActive,
            address creator,
            uint256 createdAt
        )
    {
        Bounty memory bounty = bounties[bountyId];
        require(bounty.createdAt > 0, "Bounty does not exist");
        return (
            bounty.personId,
            bounty.reward,
            bounty.isActive,
            bounty.creator,
            bounty.createdAt
        );
    }

    function getPersonBounties(
        string memory personId
    ) public view returns (uint256[] memory) {
        return personBounties[personId];
    }

    function redeemBounty(uint256 bountyId) public {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.createdAt > 0, "Bounty does not exist");
        require(bounty.isActive, "Bounty is not active");

        bounty.isActive = false;
        payable(msg.sender).transfer(bounty.reward);

        emit BountyRedeemed(bountyId, msg.sender, bounty.reward);
    }

    function getActiveBountiesCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextBountyId; i++) {
            if (bounties[i].isActive) {
                count++;
            }
        }
        return count;
    }
}
