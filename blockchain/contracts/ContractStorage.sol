// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContractStorage {
    struct ContractData {
        string hashValue;
        string ipfsCid;
        uint256 timestamp;
        address createdBy;
    }

    mapping(uint256 => ContractData) public contracts;
    uint256 public contractCount = 0;

    event ContractStored(uint256 id, string hashValue, string ipfsCid, address indexed createdBy);

    function storeContract(string memory _hashValue, string memory _ipfsCid) public {
        contractCount++;
        contracts[contractCount] = ContractData(_hashValue, _ipfsCid, block.timestamp, msg.sender);
        emit ContractStored(contractCount, _hashValue, _ipfsCid, msg.sender);
    }

    function getContract(uint256 _id) public view returns (string memory, string memory, uint256, address) {
        ContractData memory data = contracts[_id];
        return (data.hashValue, data.ipfsCid, data.timestamp, data.createdBy);
    }
}
