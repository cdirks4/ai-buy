// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EigenLayerVerifier.sol";
import "./BytesLib.sol";

contract PersonBounty {
    using BytesLib for bytes;

    IEigenLayerVerifier public eigenVerifier;
    mapping(bytes32 => bool) public usedNullifiers;

    struct PersonData {
        string id;
        string ipfsHash; // Contains face embeddings and landmarks
        uint256 detectionScore;
        uint256 verifiedAt;
        bytes32 nullifier;
        bytes32 commitment;
    }

    // Remove the duplicate PersonData struct (around line 33)

    // Add event declaration
    event PersonCreated(
        string indexed id,
        string ipfsHash,
        bytes32 indexed nullifier
    );

    constructor(address _eigenVerifier) {
        eigenVerifier = IEigenLayerVerifier(_eigenVerifier);
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
        string memory ipfsHash,
        uint256 detectionScore
    ) public {
        require(bytes(id).length > 0, "Invalid ID");
        require(bytes(people[id].id).length == 0, "Person already exists");

        PersonData memory person = PersonData({
            id: id,
            ipfsHash: ipfsHash,
            detectionScore: detectionScore,
            verifiedAt: block.timestamp,
            nullifier: bytes32(0),
            commitment: bytes32(0)
        });

        people[id] = person;
    }

    function createPersonWithProof(
        string memory id,
        string memory ipfsHash,
        bytes memory proof,
        bytes memory publicInputs,
        uint256 detectionScore
    ) public {
        // Verify the ZK proof first
        require(
            eigenVerifier.verifyProof(proof, publicInputs),
            "Invalid face proof"
        );

        // Add replay protection
        bytes32 nullifier = bytes32(publicInputs.slice(0, 32));
        require(!usedNullifiers[nullifier], "Proof already used");
        usedNullifiers[nullifier] = true;

        // Add commitment verification
        bytes32 commitment = bytes32(publicInputs.slice(32, 32));
        require(
            keccak256(abi.encodePacked(ipfsHash)) == commitment,
            "Invalid commitment"
        );

        // Create person with verified data
        PersonData memory person = PersonData({
            id: id,
            ipfsHash: ipfsHash,
            detectionScore: detectionScore,
            verifiedAt: block.timestamp,
            nullifier: nullifier,
            commitment: commitment
        });

        people[id] = person;
        emit PersonCreated(id, ipfsHash, nullifier);
    }

    function createBounty(string memory personId, uint256 reward) public payable {
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
}

interface IEigenLayerVerifier {
    function verifyProof(
        bytes memory proof,
        bytes memory publicInputs
    ) external pure returns (bool);
}
