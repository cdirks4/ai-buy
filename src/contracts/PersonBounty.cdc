access(all) contract PersonBounty {
    // Store person data and bounties
    access(all) struct PersonData {
        access(all) let id: String
        access(all) let faceEmbedding: [UFix64]
        access(all) let landmarks: [[UFix64]]
        access(all) let detectionScore: UFix64
        access(all) let timestamp: UFix64
        
        init(id: String, faceEmbedding: [UFix64], landmarks: [[UFix64]], detectionScore: UFix64) {
            self.id = id
            self.faceEmbedding = faceEmbedding
            self.landmarks = landmarks
            self.detectionScore = detectionScore
            self.timestamp = getCurrentBlock().timestamp
        }
    }

    access(all) resource Bounty {
        access(all) let personId: String
        access(all) let reward: UFix64
        access(all) let isActive: Bool
        access(all) let creator: Address
        
        init(personId: String, reward: UFix64, creator: Address) {
            self.personId = personId
            self.reward = reward
            self.creator = creator
            self.isActive = true
        }
    }

    // Storage paths
    access(all) let PersonStoragePath: StoragePath
    access(all) let BountyStoragePath: StoragePath

    // Store person data and bounties
    access(all) var people: {String: PersonData}
    access(all) var bounties: @{String: Bounty}

    access(all) fun createPerson(id: String, faceEmbedding: [UFix64], landmarks: [[UFix64]], detectionScore: UFix64) {
        let person = PersonData(
            id: id,
            faceEmbedding: faceEmbedding,
            landmarks: landmarks,
            detectionScore: detectionScore
        )
        self.people[id] = person
    }

    access(all) fun createBounty(personId: String, reward: UFix64) {
        pre {
            self.people[personId] != nil: "Person must exist"
        }
        
        let bounty <- create Bounty(
            personId: personId,
            reward: reward,
            creator: self.account.address
        )
        self.bounties[personId] <-! bounty
    }

    init() {
        self.PersonStoragePath = /storage/PersonData
        self.BountyStoragePath = /storage/Bounty
        self.people = {}
        self.bounties <- {}
    }
}