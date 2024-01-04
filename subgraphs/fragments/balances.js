const { getContractDeployments, getCurrentNetwork, getReleaseInfo } = require('../utils/network');

const tribesManifests = [];

// TODO: added for possible future case of needing to handle these events with templated data source
/*getContractDeployments('Issuer').forEach((a, i) => {
  tribesManifests.push({
    kind: 'ethereum/contract',
    name: `balances_Issuer_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'Issuer',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/fragments/balances.ts',
      entities: ['Tribe'],
      abis: [
        {
          name: 'Issuer',
          file: '../abis/Issuer.json',
        },
        {
          name: 'Tribe',
          file: '../abis/Tribe.json',
        },
      ],
      eventHandlers: [
        {
          event: 'TribeAdded(bytes32,address)',
          handler: 'handleAddTribe',
        },
        {
          event: 'TribeRemoved(bytes32,address)',
          handler: 'handleRemoveTribe',
        },
      ],
    },
  });
});*/

const tribes = getReleaseInfo('tribes');

console.log('tribes: ', { tribes });

for (const { name } of tribes) {
  // getContractDeployments('Proxy' + (name == 'hUSD' ? 'ERC20' + name : name)).forEach((a, i) => {
  getContractDeployments('Proxy' + name).forEach((a, i) => {
    tribesManifests.push({
      kind: 'ethereum/contract',
      // for some reason hUSD has different contract name
      name: `balances_Tribe${name}_${i}`,
      network: getCurrentNetwork(),
      source: {
        address: a.address,
        startBlock: a.startBlock,
        abi: 'Tribe',
      },
      mapping: {
        kind: 'ethereum/events',
        apiVersion: '0.0.5',
        language: 'wasm/assemblyscript',
        file: '../src/fragments/balances.ts',
        entities: ['Tribe', 'LatestTribeBalance', 'AggregateTribeBalance'],
        abis: [
          {
            name: 'Tribe',
            file: '../abis/Tribe.json',
          },
        ],
        eventHandlers: [
          {
            event: 'Transfer(indexed address,indexed address,uint256)',
            handler: 'handleTransferTribe',
          },
        ],
      },
    });
  });
}

module.exports = {
  dataSources: tribesManifests,
};
