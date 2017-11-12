/*
Find every wallet affected by the Parity multisig bug
https://elementus.io/blog/which-icos-are-affected-by-the-parity-wallet-bug/
 */

var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

String.prototype.decToHex = function(){
    var bnum = parseInt(this);
    return "0x" + bnum.toString(16);
};

var firstBlock = 4049249;
var lastBlock = 4540074;

//First find the transactions where the affected multisig wallets are created
findWallets(firstBlock,lastBlock,function(transArr){

    //Then get the addresses of the wallets
    findWalletAddresses(transArr,function(addrArr){
        console.log(JSON.stringify(addrArr));
    });
});

function findWallets(firstBlock,lastBlock,cb) {

    var transarr = [];

    oneBlock(firstBlock);

    function oneBlock(blockNum){

        var blockHex = String(blockNum).decToHex();

        web3.currentProvider.sendAsync({
            method: "eth_getBlockByNumber",
            params: [blockHex,true],
            jsonrpc: "2.0",
            id: "1"
        }, function (err, blockresult) {
            if (err) return console.log("Error: ",err);

            var block = blockresult.result;

            block.transactions.forEach(function(trans) {

                if (!trans.to) {
                    if (trans.input.indexOf("863df6bfa4469f3ead0be8f9f2aae51c91a907b4") > -1) {
                        transarr.push(trans);
                    }
                }
            });


            if (blockNum < lastBlock){
                blockNum++;
                return oneBlock(blockNum);
            } else {
                // Finished
                return cb(transarr);
            }
        });
    }
}


function findWalletAddresses(transArr,cb) {

    var affectedWallets = [];
    oneReceipt(0);

    function oneReceipt(n) {

        var hash = transArr[n].hash;

        web3.currentProvider.sendAsync({
            method: "eth_getTransactionReceipt",
            params: [hash],
            jsonrpc: "2.0",
            id: "1"
        }, function (err, receipt) {
            if (err) return console.log("Error: ",err);

            var contractAddress = receipt.result.contractAddress;
            affectedWallets.push(contractAddress);

            n++;
            if (n < transArr.length){
                return oneReceipt(n);
            } else {
                // Finished
                return cb(affectedWallets);
            }
        });
    }
}
