const fs = require('fs');
const path = require('path');

// constants must be determined before running script
const deployment = require('../publish/deployed/arbitrum-goerli/deployment.json');
const outAbiGeneratedPath = '../abis/generated/';
///////////////////////////

// generate abis
const exists = fs.existsSync(outAbiGeneratedPath);
if (!exists) {
  fs.mkdirSync(outAbiGeneratedPath);
}

Object.keys(deployment.sources).forEach((contractName, index) => {
  const abi = deployment.sources[contractName].abi;

  if (abi && Array.isArray(abi) && abi.length > 0) {
    const newAbi = [];
    for (let one of abi) {
      const unitStr = JSON.stringify(one, null, 2);
      if (unitStr.includes('uint256[2][2]') == false) {
        newAbi.push(one);
      }
    }

    const fileFullName = outAbiGeneratedPath + contractName + '.json';

    fs.open(fileFullName, 'w', function (err, file) {
      if (err) return console.error(err);
      // Successfully opened the file!

      const dataAbi = JSON.stringify(newAbi, null, 2);

      fs.writeFile(fileFullName, dataAbi, function (err) {
        if (err) return console.error(err);
        // Successfully wrote to the file!
        console.log('Done ' + contractName + '.json');
      });
    });
  }
});
