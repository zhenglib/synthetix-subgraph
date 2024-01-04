import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import {
  Tribe as TribeContract,
  Transfer as TribeTransferEvent,
} from '../../generated/subgraphs/balances/balances_TribehUSD_0/Tribe';

import { Tribe, TribeBalance, LatestTribeBalance, TribeByCurrencyKey } from '../../generated/subgraphs/balances/schema';
import { toDecimal, ZERO, ZERO_ADDRESS } from '../lib/helpers';

export function registerTribe(tribeAddress: Address): Tribe | null {
  // the address associated with the issuer may not be the proxy
  let tribeBackContract = TribeContract.bind(tribeAddress);
  let proxyQuery = tribeBackContract.try_proxy();
  let nameQuery = tribeBackContract.try_name();
  let symbolQuery = tribeBackContract.try_symbol();
  let totalSupplyQuery = tribeBackContract.try_totalSupply();

  if (symbolQuery.reverted) {
    log.warning('tried to save invalid tribe {}', [tribeAddress.toHex()]);
    return null;
  }

  if (!proxyQuery.reverted) {
    tribeAddress = proxyQuery.value;
  }

  let newTribe = new Tribe(tribeAddress.toHex());
  newTribe.name = nameQuery.reverted ? symbolQuery.value : nameQuery.value;
  newTribe.symbol = symbolQuery.value;
  newTribe.totalSupply = toDecimal(totalSupplyQuery.value);
  newTribe.save();

  // symbol is same as currencyKey
  let newTribeByCurrencyKey = new TribeByCurrencyKey(symbolQuery.value);
  newTribeByCurrencyKey.proxyAddress = tribeAddress;
  newTribeByCurrencyKey.save();

  // legacy hUSD contract uses wrong name
  if (symbolQuery.value == 'nUSD') {
    let newTribeByCurrencyKey = new TribeByCurrencyKey('hUSD');
    newTribeByCurrencyKey.proxyAddress = tribeAddress;
    newTribeByCurrencyKey.save();
  }

  return newTribe;
}

function trackTribeHolder(tribeAddress: Address, account: Address, timestamp: BigInt, value: BigDecimal): void {
  let tribe = Tribe.load(tribeAddress.toHex());

  if (tribe == null) {
    registerTribe(tribeAddress);
  }

  let totalBalance = toDecimal(ZERO);
  let latestBalanceID = account.toHex() + '-' + tribeAddress.toHex();
  let oldTribeBalance = LatestTribeBalance.load(latestBalanceID);

  if (oldTribeBalance == null || oldTribeBalance.timestamp.equals(timestamp)) {
    totalBalance = toDecimal(TribeContract.bind(tribeAddress).balanceOf(account));
  } else {
    totalBalance = oldTribeBalance.amount.plus(value);
  }

  let newLatestBalance = new LatestTribeBalance(latestBalanceID);
  newLatestBalance.address = account;
  newLatestBalance.account = account.toHex();
  newLatestBalance.timestamp = timestamp;
  newLatestBalance.tribe = tribeAddress.toHex();
  newLatestBalance.amount = totalBalance;
  newLatestBalance.save();

  let newBalanceID = timestamp.toString() + '-' + account.toHex() + '-' + tribeAddress.toHex();
  let newBalance = new TribeBalance(newBalanceID);
  newBalance.address = account;
  newBalance.account = account.toHex();
  newBalance.timestamp = timestamp;
  newBalance.tribe = tribeAddress.toHex();
  newBalance.amount = totalBalance;
  newBalance.save();
}

function trackMintOrBurn(tribeAddress: Address, value: BigDecimal): void {
  let tribe = Tribe.load(tribeAddress.toHex());

  if (tribe == null) {
    tribe = registerTribe(tribeAddress);
  }

  if (tribe != null) {
    let newSupply = tribe.totalSupply.plus(value);

    if (newSupply.lt(toDecimal(ZERO))) {
      log.warning('totalSupply needs correction, is negative: %s', [tribe.symbol]);
      let tribeBackContract = TribeContract.bind(tribeAddress);
      tribe.totalSupply = toDecimal(tribeBackContract.totalSupply());
    } else {
      tribe.totalSupply = newSupply;
    }

    tribe.save();
  }
}

export function handleTransferTribe(event: TribeTransferEvent): void {
  if (event.params.from.toHex() != ZERO_ADDRESS.toHex() && event.params.from != event.address) {
    trackTribeHolder(event.address, event.params.from, event.block.timestamp, toDecimal(event.params.value).neg());
  } else {
    trackMintOrBurn(event.address, toDecimal(event.params.value));
  }

  if (event.params.to.toHex() != ZERO_ADDRESS.toHex() && event.params.to != event.address) {
    trackTribeHolder(event.address, event.params.to, event.block.timestamp, toDecimal(event.params.value));
  } else {
    trackMintOrBurn(event.address, toDecimal(event.params.value).neg());
  }
}
