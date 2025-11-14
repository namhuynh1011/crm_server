const { Web3 } = require("web3");
const web3 = new Web3("http://127.0.0.1:7545");

const safeJSON = (obj) => {
    return JSON.parse(
        JSON.stringify(
            obj,
            (key, value) =>
                typeof value === "bigint" ? value.toString() : value
        )
    );
};

async function lookupOnChainByTx(txHash) {
    const tx = await web3.eth.getTransaction(txHash);
    if (!tx) throw new Error("Không tìm thấy transaction trên blockchain");

    const receipt = await web3.eth.getTransactionReceipt(txHash);
    const block = await web3.eth.getBlock(tx.blockNumber);

    // Convert BigInt thành string/number
    const gasUsed = receipt?.gasUsed ? Number(receipt.gasUsed) : null;
    const blockNumber = Number(tx.blockNumber);
    const timestamp = Number(block.timestamp) * 1000;

    return {
        txHash,
        from: tx.from,
        to: tx.to,
        blockNumber,
        gasUsed,
        timestamp,
        date: new Date(timestamp)
    };
}


module.exports = {
    lookupOnChainByTx,
};
