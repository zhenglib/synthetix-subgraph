const { values, reverse, sortedIndexBy } = require('lodash');

const package = require('../../package.json');

const BLOCK_SAFETY_OFFSET = 8640;

function getCurrentNetwork() {
  // return process.env['HAKA_NETWORK'] || 'mainnet';
  return process.env['HAKA_NETWORK'] || 'arbitrum-goerli';
}

function getCurrentSubgraph() {
  return process.env['SUBGRAPH'] || 'tribev3-arbitrum-goerli-v2';
}

function getReleaseInfo(file, network = undefined) {
  const net = network || getCurrentNetwork();

  // ['mainnet', 'goerli', 'kovan', 'optimism', 'optimism-kovan', 'arbitrum-one', 'arbitrum-goerli']
  console.log({ net });
  let info = null;
  if (net === 'mainnet' || net === 'kovan') {
    // return require('tribeone/publish/deployed/' + net + '/' + file);
  } else if (net === 'optimism') {
    // return require('tribeone/publish/deployed/mainnet-ovm/' + file);
  } else if (net === 'optimism-kovan') {
    // return require('tribeone/publish/deployed/kovan-ovm/' + file);
  } else if (net === 'goerli') {
    // return require('tribeone/publish/deployed/goerli/' + file);
  } else if (net === 'arbitrum-one') {
    // no supported now
    // return require('tribeone/publish/deployed/arbitrum-one/' + file);
  } else if (net === 'arbitrum-goerli') {
    return require('../../publish/deployed/arbitrum-goerli/' + file);
  }

  return info;
}

function estimateBlock(date) {
  const blockInfo = values(getReleaseInfo('versions'))
    .filter((v) => v.block && v.date)
    .map((v) => [v.block, v.date]);

  // find the release immediately after the specified time
  const idx = sortedIndexBy(blockInfo, [0, date], (v) => v[1]);

  const numDate = new Date(date).getTime();

  if (idx == blockInfo.length) {
    if (blockInfo.length < 3) {
      return null;
    }

    // determine some semblance of block rate
    const rate =
      (blockInfo[blockInfo.length - 1][0] - blockInfo[blockInfo.length - 3][0]) /
      (new Date(blockInfo[blockInfo.length - 1][1]).getTime() - new Date(blockInfo[blockInfo.length - 3][1]).getTime());

    return Math.floor(
      blockInfo[blockInfo.length - 1][0] + rate * (numDate - new Date(blockInfo[blockInfo.length - 1][1]).getTime()),
    );
  }

  if (blockInfo[idx][1] === date) {
    return blockInfo[idx][0];
  }

  if (idx == 0) {
    return null;
  }

  const beforeDate = new Date(blockInfo[idx - 1][1]).getTime();
  const afterDate = new Date(blockInfo[idx][1]).getTime();

  return Math.floor(
    blockInfo[idx - 1][0] +
      ((blockInfo[idx][0] - blockInfo[idx - 1][0]) * (numDate - beforeDate)) / (afterDate - beforeDate),
  );
}

function getReleaseBlocks() {
  const versionInfo = getReleaseInfo('versions');

  const versionNameMap = {};

  for (const n in versionInfo) {
    const info = versionInfo[n];
    versionNameMap[info.release || info.tag] = info.block || estimateBlock(info.date);
  }

  return versionNameMap;
}

const versions = getReleaseBlocks();

function getContractDeployments(contractName, startBlock = 0, endBlock = Number.MAX_VALUE, network = undefined) {
  startBlock = Math.max(Math.max(startBlock, process.env.GRAFT_BLOCK || 0), process.env['HAKA_START_BLOCK'] || 0);

  const versionInfo = getReleaseInfo('versions', network);

  const addressInfo = [];

  let lastStartBlock = null;

  // search for contract deployments
  for (const info of reverse(values(versionInfo))) {
    const contractInfo = info.contracts[contractName];
    if (contractInfo) {
      if ((network || getCurrentNetwork()).match('optimism') != null) {
        addressInfo.push({
          address: contractInfo.address,
          // with the regenesis, assume all contracts are basically deployed on the first block (doesn't hurt anything if they were deployed later)
          startBlock: startBlock,
          endBlock: null,
        });
      } else {
        let contractStartBlock = Math.max(info.block || estimateBlock(info.date), BLOCK_SAFETY_OFFSET);

        // Relevant information is missing from the kovan versions.json file, so we hardcode a minimum here
        if (network == 'kovan' || getCurrentNetwork() == 'kovan') {
          contractStartBlock = Math.max(contractStartBlock, 10412700);
        }

        if (contractStartBlock >= endBlock) break;

        if (contractStartBlock < startBlock) {
          addressInfo.push({ address: contractInfo.address, startBlock, endBlock: lastStartBlock });
          break;
        } else {
          const cushionStartBlock =
            contractStartBlock - BLOCK_SAFETY_OFFSET * 2 > 0
              ? contractStartBlock - BLOCK_SAFETY_OFFSET * 2
              : contractStartBlock - BLOCK_SAFETY_OFFSET;

          addressInfo.push({
            address: contractInfo.address,
            startBlock: cushionStartBlock,
            endBlock: lastStartBlock,
          });

          lastStartBlock = contractStartBlock;
        }
      }
    }
  }

  return reverse(addressInfo);
}

function createSubgraphManifest(name, dataSources, templates) {
  const dataSourcesArray = Object.values(dataSources);
  const templatesArray = Object.values(templates);

  dataSourcesArray.reverse();
  templatesArray.reverse();

  const manifest = {
    specVersion: '0.0.4',
    features: ['grafting'],
    description: name ? 'Tribeone Subgraph' : 'Tribeone Subgraph ' + name,
    repository: 'https://github.com/TribeOneDefi/tribeone-subgraph',
    schema: {
      file: `./${name}.graphql`,
    },
    dataSources: dataSourcesArray,
    templates: templatesArray,
  };

  if (process.env.GRAFT_BASE) {
    manifest.graft = {
      base: process.env.GRAFT_BASE,
      block: parseInt(process.env.GRAFT_BLOCK),
    };
  }

  if (process.env.DEBUG_MANIFEST) {
    console.log('generated manifest:', JSON.stringify(manifest, null, 2));
  }

  return manifest;
}

const NETWORKS = ['mainnet', 'goerli', 'kovan', 'optimism', 'optimism-kovan', 'arbitrum-one', 'arbitrum-goerli'];

module.exports = {
  getCurrentNetwork,
  getReleaseInfo,
  estimateBlock,
  versions,
  getContractDeployments,
  NETWORKS,
  getCurrentSubgraph,
  createSubgraphManifest,
};
