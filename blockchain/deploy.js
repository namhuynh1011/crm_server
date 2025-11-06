const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

const web3 = new Web3('http://127.0.0.1:7545');

async function deploy() {
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];

    const source = fs.readFileSync(path.resolve(__dirname, 'contracts', 'ContractStorage.sol'), 'utf8');
    const solc = require('solc');

    // Compile contract
    const input = {
        language: 'Solidity',
        sources: {
            'ContractStorage.sol': { content: source }
        },
        settings: { outputSelection: { '*': { '*': ['*'] } } }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contract = output.contracts['ContractStorage.sol']['ContractStorage'];

    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    // Deploy contract
    const contractInstance = new web3.eth.Contract(abi);
    const deployed = await contractInstance
        .deploy({ data: '0x' + bytecode })
        .send({ from: deployer, gas: 3000000 });

    console.log('✅ Contract deployed at:', deployed.options.address);

    // Ghi ABI và địa chỉ ra file
    const abiPath = path.resolve(__dirname, 'build', 'contractABI.json');
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));

    const configPath = path.resolve(__dirname, 'config.js');
    fs.writeFileSync(configPath, `module.exports = { contractAddress: "${deployed.options.address}" };\n`);

    console.log('✅ ABI và địa chỉ contract đã được lưu!');
}

deploy().catch(console.error);
