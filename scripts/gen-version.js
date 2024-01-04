const fs = require('fs');
const path = require('path');

const deployment = require('../publish/deployed/arbitrum-goerli/deployment.json');

// constants must be determined before running script
const tag = 'v3.0.0-arbitrum-goerli';
const outFileName = 'versionsv3-generated.json';
const outFilePathVersions = '../publish/deployed/arbitrum-goerli/' + outFileName;
const outFilePathTribes = '../publish/deployed/arbitrum-goerli/tribes-generated.json';
const tribePrefix = 'Tribeh';

///////////////////////////

const version = {};

version[tag] = {
  tag: tag,
  fulltag: tag,
  release: 'Phase 2',
  network: 'arbitrum-goerli',
  date: new Date().toISOString(),
  commit: 'v2',
};

let contracts = {};

const tribes = [];

Object.keys(deployment.targets).forEach((contractName, index) => {
  contracts[contractName] = {
    address: deployment.targets[contractName].address,
    status: 'current',
    keccak256: '',
  };

  if (contractName.startsWith(tribePrefix)) {
    const asset = contractName.replace(tribePrefix, '');

    tribes.push({
      name: 'h' + asset,
      asset: asset,
      subclass: asset != 'USD' ? 'MultiCollateralTribe' : undefined,
    });
  }
});

console.log('Total contracts : ', Object.keys(contracts).length);
version[tag].contracts = contracts;

console.log(JSON.stringify(version, null, 2));

const data = JSON.stringify(version, null, 2);

fs.open(outFilePathVersions, 'w', function (err, file) {
  if (err) return console.error(err);
  // Successfully opened the file!

  //   fs.writeFileSync(outFilePath, data);

  fs.writeFile(outFilePathVersions, data, function (err) {
    if (err) return console.error(err);
    // Successfully wrote to the file!
    console.log('Done versions');
  });
});

fs.open(outFilePathTribes, 'w', function (err, file) {
  if (err) return console.error(err);
  // Successfully opened the file!

  const data = JSON.stringify(tribes, null, 2);

  fs.writeFile(outFilePathTribes, data, function (err) {
    if (err) return console.error(err);
    // Successfully wrote to the file!
    console.log('Done tribes');
  });
});
