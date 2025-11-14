const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const { contractAddress } = require('./config');

const web3 = new Web3('http://127.0.0.1:7545');
const contractABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'build', 'contractABI.json'), 'utf8')
);

const contract = new web3.eth.Contract(contractABI, contractAddress);

let account;

// 🔑 Lấy account mặc định
(async () => {
  const accounts = await web3.eth.getAccounts();
  account = accounts[0];
  console.log('🧩 Dùng account:', account);
})();

// 🧱 Ghi hợp đồng lên blockchain (an toàn với missing event)
async function storeContractHash(hashValue, ipfsCid = '') {
    const tx = await contract.methods.storeContract(hashValue, ipfsCid).send({
        from: account,
        gas: 300000
    });

    // console.log('🧾 Full transaction receipt:', tx);

    let event = null;

    // Cách 1: tìm theo tên
    if (tx.events && tx.events.ContractStored) {
        event = tx.events.ContractStored.returnValues;
    }
    // Cách 2: thử quét qua mọi event
    else if (tx.events && typeof tx.events === 'object') {
        for (const key of Object.keys(tx.events)) {
            if (tx.events[key].event === 'ContractStored') {
                event = tx.events[key].returnValues;
                break;
            }
        }
    }
    // Cách 3: nếu vẫn không có, thử parse logs thủ công
    else if (tx.logs && tx.logs.length > 0) {
        console.warn('⚠️ Không tìm thấy event ContractStored — thử đọc logs thủ công.');
        try {
            const decoded = web3.eth.abi.decodeLog(
                [
                    { type: 'uint256', name: 'id', indexed: false },
                    { type: 'string', name: 'hashValue', indexed: false },
                    { type: 'string', name: 'ipfsCid', indexed: false },
                    { type: 'address', name: 'createdBy', indexed: true }
                ],
                tx.logs[0].data,
                tx.logs[0].topics.slice(1)
            );
            event = decoded;
        } catch (e) {
            console.error('❌ Decode log thất bại:', e);
        }
    }

    const contractId = event && event.id ? event.id : null;
    // console.log('✅ Tx hash:', tx.transactionHash);
    // console.log('✅ Contract ID:', contractId);

    return {
        txHash: tx.transactionHash,
        contractId
    };
}



// 🔎 Lấy thông tin hợp đồng theo ID
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
