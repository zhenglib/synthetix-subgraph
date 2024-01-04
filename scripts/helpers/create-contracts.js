/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');

const _ = require('lodash');

try {
  fs.mkdirSync(__dirname + '/../../generated/');
  /* eslint-disable no-empty */
} catch {}

const genTs = [];

genTs.push(`
import { BigInt, Address } from "@graphprotocol/graph-ts";

interface ContractInfo { address: string };

export function getContractDeployment(contractName: string, network: string, block: BigInt): Address | null {
`);

// for (const network of ['mainnet', 'mainnet-ovm', 'kovan', 'kovan-ovm', 'arbitrum-goerli']) {
for (const network of ['arbitrum-goerli']) {
  // const versions = require(`tribeone/publish/deployed/${network}/versions.json`);
  const versions = require(`../../publish/deployed/${network}/versions.json`);

  console.log('scripts/helpers/create-contracts.js > ', { versions });
  if (!versions['v3.0.0-arbitrum-goerli']) {
    console.error('!!!!!!!!!!!!  Error do not load correct versions file.');
  }

  let networkName;
  switch (network) {
    case 'mainnet':
    case 'goerli':
    case 'arbitrum-goerli':
    case 'kovan':
      networkName = network;
      break;
    case 'mainnet-ovm':
      networkName = 'optimism';
      break;
    case 'kovan-ovm':
      networkName = 'optimism-kovan';
      break;
  }

  genTs.push(`if (network == '${networkName}') {`);

  for (const vers of _.reverse(_.values(versions))) {
    for (const c in vers.contracts) {
      genTs.push(
        `if (contractName == '${c}') return changetype<Address>(Address.fromHexString('${
          vers.contracts[c].address || '0x0'
        }'));`,
      );
    }
  }

  genTs.push('}');
}

genTs.push(`
    return null;
}
`);

fs.writeFileSync(__dirname + '/../../generated/addresses.ts', genTs.join('\n'));
