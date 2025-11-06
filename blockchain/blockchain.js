const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const { contractAddress } = require('./config');

const web3 = new Web3('http://127.0.0.1:7545');
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'build', 'contractABI.json'), 'utf8'));

const contract = new web3.eth.Contract(contractABI, contractAddress);

let account;

// Lấy account mặc định
(async () => {
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];
    console.log('🧩 Dùng account:', account);
})();

// Ghi hợp đồng lên blockchain
async function storeContractHash(hashValue, ipfsCid = '') {
    const tx = await contract.methods.storeContract(hashValue, ipfsCid).send({
        from: account,
        gas: 300000
    });
    console.log('✅ Ghi hash lên blockchain:', tx.transactionHash);
    return tx.transactionHash;
}

// Lấy thông tin hợp đồng theo ID
async function getContractById(id) {
    const data = await contract.methods.getContract(id).call();
    return {
        hashValue: data[0],
        ipfsCid: data[1],
        timestamp: new Date(data[2] * 1000),
        createdBy: data[3]
    };
}

module.exports = { storeContractHash, getContractById, web3, contract };
