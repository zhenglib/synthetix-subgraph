// The latest Tribeone and event invocations
import {
  Tribeone as HAKA,
  Transfer as HAKATransferEvent,
} from '../generated/subgraphs/issuance/issuance_Tribeone_0/Tribeone';

import { FeePool as FeePoolContract } from '../generated/subgraphs/issuance/issuance_FeePool_0/FeePool';

// import { Tribeone32 } from '../generated/subgraphs/issuance/issuance_Tribeone_0/Tribeone32';

// import { Tribeone4 } from '../generated/subgraphs/issuance/issuance_Tribeone_0/Tribeone4';

import { AddressResolver } from '../generated/subgraphs/issuance/issuance_Tribeone_0/AddressResolver';

import { hUSD32, hUSD4, toDecimal, ZERO_ADDRESS, ZERO } from './lib/helpers';
import { getTimeID, isEscrow } from './lib/helpers';

// TribeoneState has not changed ABI since deployment
import { TribeoneState } from '../generated/subgraphs/issuance/issuance_Tribeone_0/TribeoneState';

import {
  Vested as VestedEvent,
  RewardEscrow,
} from '../generated/subgraphs/issuance/issuance_RewardEscrow_0/RewardEscrow';

import {
  Tribe as TribeContract,
  Issued as IssuedEvent,
  Burned as BurnedEvent,
} from '../generated/subgraphs/issuance/issuance_TribehUSD_0/Tribe';
import {
  FeesClaimed as FeesClaimedEvent,
  FeePeriodClosed as FeePeriodClosedEvent,
} from '../generated/subgraphs/issuance/issuance_FeePool_0/FeePool';
import { FeePoolv217 } from '../generated/subgraphs/issuance/issuance_FeePool_0/FeePoolv217';

import {
  Tribeone,
  Issued,
  Burned,
  Issuer,
  HAKAHolder,
  DebtSnapshot,
  RewardEscrowHolder,
  FeesClaimed,
  TotalActiveStaker,
  TotalDailyActiveStaker,
  ActiveStaker,
  DailyIssued,
  DailyBurned,
  FeePeriod,
} from '../generated/subgraphs/issuance/schema';

import { store, BigInt, Address, ethereum, Bytes, dataSource } from '@graphprotocol/graph-ts';

import { strToBytes } from './lib/helpers';

import { log } from '@graphprotocol/graph-ts';
import { DAY_SECONDS } from './lib/helpers';
import { getContractDeployment } from '../generated/addresses';
import { registerTribe } from './fragments/balances';
import { Tribe } from '../generated/subgraphs/balances/schema';

let v219UpgradeBlock = BigInt.fromI32(9518914); // Archernar v2.19.x Feb 20, 2020

// [reference only] Tribeone v2.10.x (bytes4 to bytes32) at txn
// https://etherscan.io/tx/0x612cf929f305af603e165f4cb7602e5fbeed3d2e2ac1162ac61087688a5990b6
let v2100UpgradeBlock = BigInt.fromI32(8622911);

// Tribeone v2.0.0 (rebrand from Havven and adding Multicurrency) at txn
// https://etherscan.io/tx/0x4b5864b1e4fdfe0ab9798de27aef460b124e9039a96d474ed62bd483e10c835a
let v200UpgradeBlock = BigInt.fromI32(6841188); // Dec 7, 2018

function getMetadata(): Tribeone {
  let tribeone = Tribeone.load('1');

  if (tribeone == null) {
    tribeone = new Tribeone('1');
    tribeone.issuers = BigInt.fromI32(0);
    tribeone.hakaHolders = BigInt.fromI32(0);
    tribeone.save();
  }

  return tribeone;
}

function incrementMetadata(field: string): void {
  let metadata = getMetadata();
  if (field == 'issuers') {
    metadata.issuers = metadata.issuers.plus(BigInt.fromI32(1));
  } else if (field == 'hakaHolders') {
    metadata.hakaHolders = metadata.hakaHolders.plus(BigInt.fromI32(1));
  }
  metadata.save();
}

function decrementMetadata(field: string): void {
  let metadata = getMetadata();
  if (field == 'issuers') {
    metadata.issuers = metadata.issuers.minus(BigInt.fromI32(1));
  } else if (field == 'hakaHolders') {
    metadata.hakaHolders = metadata.hakaHolders.minus(BigInt.fromI32(1));
  }
  metadata.save();
}

function trackIssuer(account: Address): void {
  let existingIssuer = Issuer.load(account.toHex());
  if (existingIssuer == null) {
    incrementMetadata('issuers');
    let issuer = new Issuer(account.toHex());
    issuer.save();
  }
}

function trackHAKAHolder(
  hakaContract: Address,
  account: Address,
  block: ethereum.Block,
  txn: ethereum.Transaction,
): void {
  let holder = account.toHex();
  // ignore escrow accounts
  if (isEscrow(holder, dataSource.network())) {
    return;
  }
  let existingHAKAHolder = HAKAHolder.load(holder);
  let hakaHolder = new HAKAHolder(holder);
  hakaHolder.block = block.number;
  hakaHolder.timestamp = block.timestamp;

  // // Don't bother trying these extra fields before v2 upgrade (slows down The Graph processing to do all these as try_ calls)
  if (dataSource.network() != 'mainnet' || block.number > v219UpgradeBlock) {
    let tribeone = HAKA.bind(hakaContract);
    hakaHolder.balanceOf = toDecimal(tribeone.balanceOf(account));
    hakaHolder.collateral = toDecimal(tribeone.collateral(account));

    // Check transferable because it will be null when rates are stale
    let transferableTry = tribeone.try_transferableTribeone(account);
    if (!transferableTry.reverted) {
      hakaHolder.transferable = toDecimal(transferableTry.value);
    }
    let resolverTry = tribeone.try_resolver();
    if (resolverTry.reverted) {
      // This happened when an old HAKA token was reconnected to the old proxy temporarily to recover 25k HAKA
      // from the old grantsDAO:
      // https://etherscan.io/tx/0x1f862d93373e6d5dbf2438f478c05eac67b2949664bf1b3e6a5b6d5adf92fb3c
      // https://etherscan.io/tx/0x84b4e312188890d744f6912f1e5d3387e2bf314a335a4418980a938e36b3ef34
      // In this case, the old Tribeone did not have a resolver property, so let's ignore
      log.debug('Skipping HAKA holder tracking: No resolver property from HAKA holder from hash: {}, block: {}', [
        txn.hash.toHex(),
        block.number.toString(),
      ]);
      return;
    }
    let resolverAddress = resolverTry.value;
    let resolver = AddressResolver.bind(resolverAddress);
    let tribeoneState = TribeoneState.bind(resolver.getAddress(strToBytes('TribeoneState', 32)));
    let issuanceData = tribeoneState.issuanceData(account);
    hakaHolder.initialDebtOwnership = issuanceData.value0;

    // Note: due to limitations with how The Graph deals with chain reorgs, we need to try_debtLedger
    /*
        From Jannis at The Graph:
        graph-node currently makes contract calls by block number (that used to be the only way
        to do it and we haven't switched to calling by block hash yet). If there is a reorg,
        this may lead to making calls against a different block than expected.
        If the subgraph doesn't fail on such a call, the resulting data should be reverted as
        soon as the reorg is detected (e.g. when processing the next block). It can temporarily
        cause inconsistent data until that happens.
        However, if such a call fails (e.g. you're expecting an array to have grown by one but
        in the fork of the chain it hasn't and the call doesn't use try_), then this can cause
        the subgraph to fail.
        Here's what happens during a reorg:
        - Block 0xa (block number 100) is being processed.
        - A handler makes a try_debtLedger call against block number 100 but hits block 0xb instead of 0xa.
        - The result gets written to the store marked with block 0xa (because that's what we're processing).
        - The reorg is detected: block number 100 is no longer 0xa, it's 0xb
        - The changes made for 0xa (including the inconsistent/incorrect try_debtLedger result) are reverted.
        - Block 0xb is processed. The handler now makes the try_debtLedger call against 100 -> 0xb and the correct data is being returned
    */

    let debtLedgerTry = tribeoneState.try_debtLedger(issuanceData.value1);
    if (!debtLedgerTry.reverted) {
      hakaHolder.debtEntryAtIndex = debtLedgerTry.value;
    }
  } else if (block.number > v200UpgradeBlock) {
    // // Tribeone32 or Tribeone4
    // let tribeone = Tribeone32.bind(hakaContract);
    // // Track all the staking information relevant to this HAKA Holder
    // hakaHolder.balanceOf = toDecimal(tribeone.balanceOf(account));
    // hakaHolder.collateral = toDecimal(tribeone.collateral(account));
    // // Note: Below we try_transferableTribeone as it uses debtBalanceOf, which eventually calls ExchangeRates.abs
    // // It's slower to use try but this protects against instances when Transfers were enabled
    // // yet ExchangeRates were stale and throwing errors when calling effectiveValue.
    // // E.g. https://etherscan.io/tx/0x5368339311aafeb9f92c5b5d84faa4864c2c3878681a402bbf0aabff60bafa08
    // let transferableTry = tribeone.try_transferableTribeone(account);
    // if (!transferableTry.reverted) {
    //   hakaHolder.transferable = toDecimal(transferableTry.value);
    // }
    // let stateTry = tribeone.try_tribeoneState();
    // if (!stateTry.reverted) {
    //   let tribeoneStateContract = tribeone.tribeoneState();
    //   let tribeoneState = TribeoneState.bind(tribeoneStateContract);
    //   let issuanceData = tribeoneState.issuanceData(account);
    //   hakaHolder.initialDebtOwnership = issuanceData.value0;
    //   let debtLedgerTry = tribeoneState.try_debtLedger(issuanceData.value1);
    //   if (!debtLedgerTry.reverted) {
    //     hakaHolder.debtEntryAtIndex = debtLedgerTry.value;
    //   }
    // }
  } else {
    // // When we were Havven, simply track their collateral (HAKA balance and escrowed balance)
    // let tribeone = Tribeone4.bind(hakaContract); // not the correct ABI/contract for pre v2 but should suffice
    // hakaHolder.balanceOf = toDecimal(tribeone.balanceOf(account));
    // let collateralTry = tribeone.try_collateral(account);
    // if (!collateralTry.reverted) {
    //   hakaHolder.collateral = toDecimal(collateralTry.value);
    // }
  }

  if (
    (existingHAKAHolder == null && hakaHolder.balanceOf!.gt(toDecimal(BigInt.fromI32(0)))) ||
    (existingHAKAHolder != null &&
      existingHAKAHolder.balanceOf == toDecimal(BigInt.fromI32(0)) &&
      hakaHolder.balanceOf > toDecimal(BigInt.fromI32(0)))
  ) {
    incrementMetadata('hakaHolders');
  } else if (
    existingHAKAHolder != null &&
    existingHAKAHolder.balanceOf > toDecimal(BigInt.fromI32(0)) &&
    hakaHolder.balanceOf == toDecimal(BigInt.fromI32(0))
  ) {
    decrementMetadata('hakaHolders');
  }

  hakaHolder.save();
}

function trackDebtSnapshot(event: ethereum.Event): void {
  let hakaContract = event.transaction.to!;
  let account = event.transaction.from;

  // ignore escrow accounts
  if (isEscrow(account.toHex(), dataSource.network())) {
    return;
  }

  let entity = new DebtSnapshot(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.account = account;

  if (dataSource.network() != 'mainnet' || event.block.number > v219UpgradeBlock) {
    let tribeone = HAKA.bind(hakaContract);
    let try_balanceOf = tribeone.try_balanceOf(account);
    if (try_balanceOf.reverted) {
      return;
    }
    entity.balanceOf = toDecimal(try_balanceOf.value);

    let collateralTry = tribeone.try_collateral(account);
    if (!collateralTry.reverted) {
      entity.collateral = toDecimal(collateralTry.value);
    }
    let debtBalanceOfTry = tribeone.try_debtBalanceOf(account, hUSD32);
    if (!debtBalanceOfTry.reverted) {
      entity.debtBalanceOf = toDecimal(debtBalanceOfTry.value);
    }

    let addressResolverAddress = getContractDeployment(
      'AddressResolver',
      dataSource.network(),
      BigInt.fromI32(1000000000),
    )!;
    let resolver = AddressResolver.bind(addressResolverAddress);
    let tribeoneStateAddressTry = resolver.try_getAddress(strToBytes('TribeoneState', 32));
    if (!tribeoneStateAddressTry.reverted) {
      let tribeoneState = TribeoneState.bind(tribeoneStateAddressTry.value);
      let issuanceData = tribeoneState.issuanceData(account);
      entity.initialDebtOwnership = toDecimal(issuanceData.value0);
      let debtLedgerTry = tribeoneState.try_debtLedger(issuanceData.value1);
      if (!debtLedgerTry.reverted) {
        entity.debtEntryAtIndex = debtLedgerTry.value;
      }
    }
  }
  // Use bytes32
  else if (event.block.number > v2100UpgradeBlock) {
    // let tribeone = Tribeone32.bind(hakaContract);
    // let try_balanceOf = tribeone.try_balanceOf(account);
    // if (try_balanceOf.reverted) {
    //   return;
    // }
    // entity.balanceOf = toDecimal(try_balanceOf.value);
    // let collateralTry = tribeone.try_collateral(account);
    // if (!collateralTry.reverted) {
    //   entity.collateral = toDecimal(collateralTry.value);
    // }
    // let debtBalanceOfTry = tribeone.try_debtBalanceOf(account, hUSD4);
    // if (!debtBalanceOfTry.reverted) {
    //   entity.debtBalanceOf = toDecimal(debtBalanceOfTry.value);
    // }
    // let addressResolverAddress = getContractDeployment(
    //   'AddressResolver',
    //   dataSource.network(),
    //   BigInt.fromI32(1000000000),
    // )!;
    // let resolver = AddressResolver.bind(addressResolverAddress);
    // let tribeoneStateAddressTry = resolver.try_getAddress(strToBytes('TribeoneState', 32));
    // if (!tribeoneStateAddressTry.reverted) {
    //   let tribeoneState = TribeoneState.bind(tribeoneStateAddressTry.value);
    //   let issuanceData = tribeoneState.issuanceData(account);
    //   entity.initialDebtOwnership = toDecimal(issuanceData.value0);
    //   let debtLedgerTry = tribeoneState.try_debtLedger(issuanceData.value1);
    //   if (!debtLedgerTry.reverted) {
    //     entity.debtEntryAtIndex = debtLedgerTry.value;
    //   }
    // }
    // Use bytes4
  } else {
    // let tribeone = Tribeone4.bind(hakaContract); // not the correct ABI/contract for pre v2 but should suffice
    // let balanceOfTry = tribeone.try_balanceOf(account);
    // if (!balanceOfTry.reverted) {
    //   entity.balanceOf = toDecimal(balanceOfTry.value);
    // }
    // let collateralTry = tribeone.try_collateral(account);
    // if (!collateralTry.reverted) {
    //   entity.collateral = toDecimal(collateralTry.value);
    // }
    // let debtBalanceOfTry = tribeone.try_debtBalanceOf(account, hUSD4);
    // if (!debtBalanceOfTry.reverted) {
    //   entity.debtBalanceOf = toDecimal(debtBalanceOfTry.value);
    // }
    // entity.initialDebtOwnership = toDecimal(ZERO);
  }

  entity.save();
}

export function handleTransferHAKA(event: HAKATransferEvent): void {
  let tribe = Tribe.load(event.address.toHex());

  if (tribe == null) {
    // ensure HAKA is recorded
    tribe = registerTribe(event.address);
  }

  if (event.params.from.toHex() != ZERO_ADDRESS.toHex()) {
    trackHAKAHolder(event.address, event.params.from, event.block, event.transaction);
  } else if (tribe != null) {
    // haka is minted
    tribe.totalSupply = tribe.totalSupply.plus(toDecimal(event.params.value));
    tribe.save();
  }

  if (event.params.to.toHex() != ZERO_ADDRESS.toHex()) {
    trackHAKAHolder(event.address, event.params.to, event.block, event.transaction);
  } else if (tribe != null) {
    // haka is burned (only occurs on cross chain transfer)
    tribe.totalSupply = tribe.totalSupply.minus(toDecimal(event.params.value));
    tribe.save();
  }
}

/**
 * Handle reward vest events so that we know which addresses have rewards, and
 * to recalculate HAKA Holders staking details.
 */
// Note: we use VestedEvent here even though is also handles VestingEntryCreated (they share the same signature)
export function handleRewardVestEvent(event: VestedEvent): void {
  let entity = new RewardEscrowHolder(event.params.beneficiary.toHex());
  let contract = RewardEscrow.bind(event.address);
  entity.balanceOf = toDecimal(contract.balanceOf(event.params.beneficiary));
  entity.vestedBalanceOf = toDecimal(contract.totalVestedAccountBalance(event.params.beneficiary));
  entity.save();
  // now track the HAKA holder as this action can impact their collateral
  let tribeoneAddress = contract.tribeone();
  trackHAKAHolder(tribeoneAddress, event.params.beneficiary, event.block, event.transaction);
}

export function handleIssuedTribes(event: IssuedEvent): void {
  // update Debt snapshot history
  trackDebtSnapshot(event);

  // We need to figure out if this was generated from a call to Tribeone.issueTribes, issueMaxTribes or any earlier
  // versions.

  let functions = new Map<string, string>();

  functions.set('0xaf086c7e', 'issueMaxTribes()');
  functions.set('0x320223db', 'issueMaxTribesOnBehalf(address)');
  functions.set('0x8a290014', 'issueTribes(uint256)');
  functions.set('0xe8e09b8b', 'issueTribesOnBehalf(address,uint256');

  // Prior to Vega we had the currency key option in issuance
  functions.set('0xef7fae7c', 'issueMaxTribes(bytes32)'); // legacy
  functions.set('0x0ee54a1d', 'issueTribes(bytes32,uint256)'); // legacy

  // Prior to Sirius release, we had currency keys using bytes4
  functions.set('0x9ff8c63f', 'issueMaxTribes(bytes4)'); // legacy
  functions.set('0x49755b9e', 'issueTribes(bytes4,uint256)'); // legacy

  // Prior to v2
  functions.set('0xda5341a8', 'issueMaxNomins()'); // legacy
  functions.set('0x187cba25', 'issueNomins(uint256)'); // legacy

  // so take the first four bytes of input
  let input = changetype<Bytes>(event.transaction.input.subarray(0, 4));

  // and for any function calls that don't match our mapping, we ignore them
  if (!functions.has(input.toHexString())) {
    log.debug('Ignoring Issued event with input: {}, hash: {}, address: {}', [
      event.transaction.input.toHexString(),
      event.transaction.hash.toHex(),
      event.address.toHexString(),
    ]);
    return;
  }

  let entity = new Issued(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.transaction.from;

  // Note: this amount isn't in hUSD for hETH or hBTC issuance prior to Vega
  entity.value = toDecimal(event.params.value);

  let tribe = TribeContract.bind(event.address);
  let currencyKeyTry = tribe.try_currencyKey();
  if (!currencyKeyTry.reverted) {
    entity.source = currencyKeyTry.value.toString();
  } else {
    entity.source = 'hUSD';
  }

  // Don't bother getting data pre-Archernar to avoid slowing The Graph down. Can be changed later if needed.
  if ((dataSource.network() != 'mainnet' || event.block.number > v219UpgradeBlock) && entity.source == 'hUSD') {
    let timestamp = getTimeID(event.block.timestamp, DAY_SECONDS);
    let tribeone = HAKA.bind(event.transaction.to!);

    let issuedTribes = tribeone.try_totalIssuedTribesExcludeOtherCollateral(strToBytes('hUSD', 32));
    if (issuedTribes.reverted) {
      // issuedTribes = tribeone.try_totalIssuedTribesExcludeEtherCollateral(strToBytes('hUSD', 32));
      issuedTribes = tribeone.try_totalIssuedTribes(strToBytes('hUSD', 32));
      if (issuedTribes.reverted) {
        // for some reason this can happen (not sure how)
        log.debug('Reverted issued try_totalIssuedTribesExcludeEtherCollateral for hash: {}', [
          event.transaction.hash.toHex(),
        ]);
        return;
      }
    }

    let dailyIssuedEntity = DailyIssued.load(timestamp.toString());
    if (dailyIssuedEntity == null) {
      dailyIssuedEntity = new DailyIssued(timestamp.toString());
      dailyIssuedEntity.value = toDecimal(event.params.value);
    } else {
      dailyIssuedEntity.value = dailyIssuedEntity.value.plus(toDecimal(event.params.value));
    }
    dailyIssuedEntity.totalDebt = toDecimal(issuedTribes.value);
    dailyIssuedEntity.save();
  }

  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  entity.save();

  if (dataSource.network() != 'mainnet' || event.block.number > v200UpgradeBlock) {
    trackActiveStakers(event, false);
  }

  // track this issuer for reference
  trackIssuer(event.transaction.from);

  // update HAKA holder details
  trackHAKAHolder(event.transaction.to!, event.transaction.from, event.block, event.transaction);

  // now update HAKAHolder to increment the number of claims
  let hakaHolder = HAKAHolder.load(entity.account.toHexString());
  if (hakaHolder != null) {
    if (!hakaHolder.mints) {
      hakaHolder.mints = BigInt.fromI32(0);
    }
    hakaHolder.mints = hakaHolder.mints!.plus(BigInt.fromI32(1));
    hakaHolder.save();
  }

  // Don't bother getting data pre-Archernar to avoid slowing The Graph down. Can be changed later if needed.
  if ((dataSource.network() != 'mainnet' || event.block.number > v219UpgradeBlock) && entity.source == 'hUSD') {
    let timestamp = getTimeID(event.block.timestamp, DAY_SECONDS);
    let tribeone = HAKA.bind(event.transaction.to!);
    let totalIssued = tribeone.try_totalIssuedTribesExcludeOtherCollateral(hUSD32);
    if (totalIssued.reverted) {
      log.debug('Reverted issued try_totalIssuedTribesExcludeEtherCollateral for hash: {}', [
        event.transaction.hash.toHex(),
      ]);
      return;
    }

    let dailyIssuedEntity = DailyIssued.load(timestamp.toString());
    if (dailyIssuedEntity == null) {
      dailyIssuedEntity = new DailyIssued(timestamp.toString());
      dailyIssuedEntity.value = toDecimal(event.params.value);
    } else {
      dailyIssuedEntity.value = dailyIssuedEntity.value.plus(toDecimal(event.params.value));
    }
    dailyIssuedEntity.totalDebt = toDecimal(totalIssued.value);
    dailyIssuedEntity.save();
  }
}

export function handleBurnedTribes(event: BurnedEvent): void {
  // update Debt snapshot history
  trackDebtSnapshot(event);

  // We need to figure out if this was generated from a call to Tribeone.burnTribes, burnTribesToTarget or any earlier
  // versions.

  let functions = new Map<string, string>();
  functions.set('0x295da87d', 'burnTribes(uint256)');
  functions.set('0xc2bf3880', 'burnTribesOnBehalf(address,uint256');
  functions.set('0x9741fb22', 'burnTribesToTarget()');
  functions.set('0x2c955fa7', 'burnTribesToTargetOnBehalf(address)');

  // Prior to Vega we had the currency key option in issuance
  functions.set('0xea168b62', 'burnTribes(bytes32,uint256)');

  // Prior to Sirius release, we had currency keys using bytes4
  functions.set('0xaf023335', 'burnTribes(bytes4,uint256)');

  // Prior to v2 (i.e. in Havven times)
  functions.set('0x3253ccdf', 'burnNomins(uint256');

  // so take the first four bytes of input
  let input = changetype<Bytes>(event.transaction.input.subarray(0, 4));

  // and for any function calls that don't match our mapping, we ignore them
  if (!functions.has(input.toHexString())) {
    log.debug('Ignoring Burned event with input: {}, hash: {}, address: {}', [
      event.transaction.input.toHexString(),
      event.transaction.hash.toHex(),
      event.address.toHexString(),
    ]);
    return;
  }

  let entity = new Burned(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.transaction.from;

  // Note: this amount isn't in hUSD for hETH or hBTC issuance prior to Vega
  entity.value = toDecimal(event.params.value);

  let tribe = TribeContract.bind(event.address);
  let currencyKeyTry = tribe.try_currencyKey();
  if (!currencyKeyTry.reverted) {
    entity.source = currencyKeyTry.value.toString();
  } else {
    entity.source = 'hUSD';
  }

  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  entity.save();

  if (dataSource.network() != 'mainnet' || event.block.number > v200UpgradeBlock) {
    trackActiveStakers(event, true);
  }

  // update HAKA holder details
  trackHAKAHolder(event.transaction.to!, event.transaction.from, event.block, event.transaction);

  // Don't bother getting data pre-Archernar to avoid slowing The Graph down. Can be changed later if needed.
  if ((dataSource.network() != 'mainnet' || event.block.number > v219UpgradeBlock) && entity.source == 'hUSD') {
    let timestamp = getTimeID(event.block.timestamp, DAY_SECONDS);
    let tribeone = HAKA.bind(event.transaction.to!);
    let issuedTribes = tribeone.try_totalIssuedTribesExcludeOtherCollateral(strToBytes('hUSD', 32));
    if (issuedTribes.reverted) {
      // issuedTribes = tribeone.try_totalIssuedTribesExcludeEtherCollateral(strToBytes('hUSD', 32));
      issuedTribes = tribeone.try_totalIssuedTribes(strToBytes('hUSD', 32));
      if (issuedTribes.reverted) {
        // for some reason this can happen (not sure how)
        log.debug('Reverted issued try_totalIssuedTribesExcludeEtherCollateral for hash: {}', [
          event.transaction.hash.toHex(),
        ]);
        return;
      }
    }

    let dailyBurnedEntity = DailyBurned.load(timestamp.toString());
    if (dailyBurnedEntity == null) {
      dailyBurnedEntity = new DailyBurned(timestamp.toString());
      dailyBurnedEntity.value = toDecimal(event.params.value);
    } else {
      dailyBurnedEntity.value = dailyBurnedEntity.value.plus(toDecimal(event.params.value));
    }
    dailyBurnedEntity.totalDebt = toDecimal(issuedTribes.value);
    dailyBurnedEntity.save();
  }
}

export function handleFeesClaimed(event: FeesClaimedEvent): void {
  let entity = new FeesClaimed(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.account = event.params.account;
  entity.rewards = toDecimal(event.params.hakaRewards);
  if (dataSource.network() != 'mainnet' || event.block.number > v219UpgradeBlock) {
    // post Achernar, we had no XDRs, so use the value as hUSD
    entity.value = toDecimal(event.params.hUSDAmount);
  } else {
    // pre Achernar, we had XDRs, so we need to figure out their effective value,
    // and for that we need to get to tribeone, which in pre-Achernar was exposed
    // as a public tribeone property on FeePool
    let feePool = FeePoolv217.bind(event.address);

    if (event.block.number > v2100UpgradeBlock) {
      // // use bytes32
      // let tribeone = Tribeone32.bind(feePool.tribeone());
      // // Note: the event param is called "hUSDAmount" because we are using the latest ABI to handle events
      // // from both newer and older invocations. Since the event signature of FeesClaimed hasn't changed between versions,
      // // we can reuse it, but accept that the variable naming uses the latest ABI
      // let tryEffectiveValue = tribeone.try_effectiveValue(
      //   strToBytes('XDR', 32),
      //   event.params.hUSDAmount,
      //   strToBytes('hUSD', 32),
      // );
      // if (!tryEffectiveValue.reverted) {
      //   entity.value = toDecimal(tryEffectiveValue.value);
      // } else {
      //   entity.value = toDecimal(BigInt.fromI32(0)); // Note: not sure why this might be happening. Need to investigat
      // }
    } else {
      // // use bytes4
      // let tribeone = Tribeone4.bind(feePool.tribeone());
      // entity.value = toDecimal(
      //   tribeone.effectiveValue(strToBytes('XDR', 4), event.params.hUSDAmount, strToBytes('hUSD', 4)),
      // );
    }
  }

  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;

  entity.save();

  // now update HAKAHolder to increment the number of claims
  let hakaHolder = HAKAHolder.load(entity.account.toHexString());
  if (hakaHolder != null) {
    if (!hakaHolder.claims) {
      hakaHolder.claims = BigInt.fromI32(0);
    }
    hakaHolder.claims = hakaHolder.claims!.plus(BigInt.fromI32(1));
    hakaHolder.save();
  }

  updateCurrentFeePeriod(event.address);
}

export function handleFeePeriodClosed(event: FeePeriodClosedEvent): void {
  // Assign period feePeriodId
  let closedFeePeriod = FeePeriod.load('current');
  if (closedFeePeriod) {
    closedFeePeriod.id = event.params.feePeriodId.toString();
    closedFeePeriod.save();
  }

  updateCurrentFeePeriod(event.address);
}

function updateCurrentFeePeriod(feePoolAddress: Address): void {
  let FeePool = FeePoolContract.bind(feePoolAddress);

  // [0] is always the current active fee period which is not
  // claimable until closeCurrentFeePeriod() is called closing
  // the current weeks collected fees. [1] is last week's period.
  let recentFeePeriod = FeePool.try_recentFeePeriods(BigInt.fromI32(1));
  if (!recentFeePeriod.reverted) {
    let feePeriod = FeePeriod.load(recentFeePeriod.value.value0.toString());
    if (!feePeriod) {
      feePeriod = new FeePeriod(recentFeePeriod.value.value0.toString());
    }

    //feePeriod.startingDebtIndex = recentFeePeriod.value.value1;
    feePeriod.startTime = recentFeePeriod.value.value2;
    feePeriod.feesToDistribute = toDecimal(recentFeePeriod.value.value3);
    feePeriod.feesClaimed = toDecimal(recentFeePeriod.value.value4);
    feePeriod.rewardsToDistribute = toDecimal(recentFeePeriod.value.value5);
    feePeriod.rewardsClaimed = toDecimal(recentFeePeriod.value.value6);
    feePeriod.save();
  }
}

function trackActiveStakers(event: ethereum.Event, isBurn: boolean): void {
  let account = event.transaction.from;
  let timestamp = event.block.timestamp;
  let hakaContract = event.transaction.to!;
  let accountDebtBalance = BigInt.fromI32(0);

  if (dataSource.network() != 'mainnet' || event.block.number > v2100UpgradeBlock) {
    let tribeone = HAKA.bind(hakaContract);
    let accountDebtBalanceTry = tribeone.try_debtBalanceOf(account, hUSD32);
    if (!accountDebtBalanceTry.reverted) {
      accountDebtBalance = accountDebtBalanceTry.value;
    }
  } else if (event.block.number > v200UpgradeBlock) {
    // let tribeone = Tribeone4.bind(hakaContract);
    // let accountDebt = tribeone.try_debtBalanceOf(account, hUSD4);
    // if (!accountDebt.reverted) {
    //   accountDebtBalance = accountDebt.value;
    // } else {
    //   log.debug('reverted debt balance of in track active stakers for account: {}, timestamp: {}, hash: {}', [
    //     account.toHex(),
    //     timestamp.toString(),
    //     event.transaction.hash.toHex(),
    //   ]);
    //   return;
    // }
  }

  let dayTimestamp = getTimeID(timestamp, DAY_SECONDS);

  let totalActiveStaker = TotalActiveStaker.load('1');
  let activeStaker = ActiveStaker.load(account.toHex());

  if (totalActiveStaker == null) {
    totalActiveStaker = loadTotalActiveStaker();
  }

  // You are burning and have been counted before as active and have no debt balance
  // we reduce the count from the total and remove the active staker entity
  if (isBurn && activeStaker != null && accountDebtBalance == BigInt.fromI32(0)) {
    totalActiveStaker.count = totalActiveStaker.count.minus(BigInt.fromI32(1));
    totalActiveStaker.save();
    store.remove('ActiveStaker', account.toHex());
    ('');
    // else if you are minting and have not been accounted for as being active, add one
    // and create a new active staker entity
  } else if (!isBurn && activeStaker == null) {
    activeStaker = new ActiveStaker(account.toHex());
    activeStaker.save();
    totalActiveStaker.count = totalActiveStaker.count.plus(BigInt.fromI32(1));
    totalActiveStaker.save();
  }

  // Once a day we stor the total number of active stakers in an entity that is easy to query for charts
  let totalDailyActiveStaker = TotalDailyActiveStaker.load(dayTimestamp.toString());
  if (totalDailyActiveStaker == null) {
    updateTotalDailyActiveStaker(dayTimestamp, totalActiveStaker.count);
  }
}

function loadTotalActiveStaker(): TotalActiveStaker {
  let newActiveStaker = new TotalActiveStaker('1');
  newActiveStaker.count = BigInt.fromI32(0);
  return newActiveStaker;
}

function updateTotalDailyActiveStaker(timestamp: BigInt, count: BigInt): void {
  let newTotalDailyActiveStaker = new TotalDailyActiveStaker(timestamp.toString());
  newTotalDailyActiveStaker.timestamp = timestamp;
  newTotalDailyActiveStaker.count = count;
  newTotalDailyActiveStaker.save();
}
