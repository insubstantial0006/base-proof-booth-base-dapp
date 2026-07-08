// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BaseProofBooth {
    uint256 public nextProofId = 1;

    struct Proof {
        address author;
        string title;
        string statement;
        uint256 createdAt;
    }

    mapping(uint256 => Proof) private proofs;

    event ProofPosted(
        uint256 indexed proofId,
        address indexed author,
        string title,
        string statement
    );

    function postProof(
        string calldata title,
        string calldata statement
    ) external returns (uint256 proofId) {
        require(bytes(title).length > 0 && bytes(title).length <= 48, "Invalid title");
        require(bytes(statement).length > 0 && bytes(statement).length <= 180, "Invalid statement");

        proofId = nextProofId++;
        proofs[proofId] = Proof({
            author: msg.sender,
            title: title,
            statement: statement,
            createdAt: block.timestamp
        });

        emit ProofPosted(proofId, msg.sender, title, statement);
    }

    function getProof(
        uint256 proofId
    )
        external
        view
        returns (
            address author,
            string memory title,
            string memory statement,
            uint256 createdAt
        )
    {
        Proof storage proof = proofs[proofId];
        return (proof.author, proof.title, proof.statement, proof.createdAt);
    }
}
