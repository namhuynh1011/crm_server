const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const solc = require('solc');

const web3 = new Web3('http://127.0.0.1:7545');

async function deploy() {
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    console.log('🚀 Triển khai bằng tài khoản:', deployer);

    // Đọc file Solidity
    const sourcePath = path.resolve(__dirname, 'contracts', 'ContractStorage.sol');
    const source = fs.readFileSync(sourcePath, 'utf8');

    // Compile contract
    const input = {
        language: 'Solidity',
        sources: {
            'ContractStorage.sol': { content: source }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata']
                }
            }
        }
    };

    console.log('🧩 Đang compile smart contract...');
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Kiểm tra lỗi biên dịch
    if (output.errors) {
        const fatalErrors = output.errors.filter(e => e.severity === 'error');
        if (fatalErrors.length > 0) {
            console.error('❌ Lỗi compile:', fatalErrors);
            return;
        }
    }

    const contractData = output.contracts['ContractStorage.sol']['ContractStorage'];
    const abi = contractData.abi;
    const bytecode = contractData.evm.bytecode.object;

    // Triển khai contract lên Ganache
    console.log('🚀 Đang deploy contract lên blockchain...');
    const contractInstance = new web3.eth.Contract(abi);
    const deployed = await contractInstance
        .deploy({ data: '0x' + bytecode })
        .send({ from: deployer, gas: 3000000 });

    console.log('✅ Contract deployed tại địa chỉ:', deployed.options.address);

    // Ghi ABI vào file
    const buildDir = path.resolve(__dirname, 'build');
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
    const abiPath = path.resolve(buildDir, 'contractABI.json');
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
    console.log('✅ Đã lưu ABI tại:', abiPath);

    // Ghi địa chỉ contract vào config.js
    const configPath = path.resolve(__dirname, 'config.js');
    fs.writeFileSync(configPath, `module.exports = { contractAddress: "${deployed.options.address}" };\n`);
    console.log('✅ Đã lưu địa chỉ contract vào:', configPath);

    console.log('🎉 Triển khai hoàn tất!');
}

deploy().catch(err => {
    console.error('❌ Lỗi khi deploy contract:', err);
});
