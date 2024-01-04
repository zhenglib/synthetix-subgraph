import {
  TribeExchange as TribeExchangeEvent,
  AtomicTribeExchange as AtomicTribeExchangeEvent,
  ExchangeReclaim as ExchangeReclaimEvent,
  ExchangeRebate as ExchangeRebateEvent,
} from '../generated/subgraphs/exchanges/exchanges_Tribeone_0/Tribeone';

// import { PositionModified as PositionModifiedEvent } from '../generated/subgraphs/exchanges/exchanges_FuturesMarketManager_0/FuturesMarket';

// import { MarketAdded as MarketAddedEvent } from '../generated/subgraphs/exchanges/exchanges_FuturesMarketManager_0/FuturesMarketManager';

import { FuturesMarketTemplate } from '../generated/subgraphs/exchanges/templates';

// import { ExchangeRates } from '../generated/subgraphs/exchanges/ExchangeRates_13/ExchangeRates';
import { ExchangeRates } from '../generated/subgraphs/exchanges/ExchangeRates_0/ExchangeRates';

import { ExchangeFeeUpdated as ExchangeFeeUpdatedEvent } from '../generated/subgraphs/exchanges/exchanges_SystemSettings_0/SystemSettings';

import {
  Total,
  TribeExchange,
  AtomicTribeExchange,
  Exchanger,
  ExchangeReclaim,
  ExchangeRebate,
  ExchangeFee,
  TribeByCurrencyKey,
  FuturesMarket,
} from '../generated/subgraphs/exchanges/schema';

import { Address, BigDecimal, BigInt, Bytes, dataSource, log } from '@graphprotocol/graph-ts';

import {
  getUSDAmountFromAssetAmount,
  getLatestRate,
  DAY_SECONDS,
  getTimeID,
  FIFTEEN_MINUTE_SECONDS,
  strToBytes,
  ZERO,
  YEAR_SECONDS,
  getExchangeFee,
} from './lib/helpers';
import { toDecimal, ZERO_ADDRESS } from './lib/helpers';
import { addDollar, addProxyAggregator } from './fragments/latest-rates';

import { Tribeone } from '../generated/subgraphs/latest-rates/ChainlinkMultisig/Tribeone';
import { AddressResolver } from '../generated/subgraphs/latest-rates/ChainlinkMultisig/AddressResolver';

const MAX_MAGNITUDE = 10;
const ETHER = BigInt.fromI32(10).pow(18);

function populateAggregatedTotalEntity(
  timestamp: BigInt,
  period: BigInt,
  product: string,
  bucketMagnitude: BigInt,
  tribe: string | null,
): Total {
  const tribeName = tribe && tribe.length ? (tribe as string) : 'null';
  let id =
    timestamp.toString() + '-' + bucketMagnitude.toString() + '-' + tribeName + '-' + period.toString() + '-' + product;

  let entity = Total.load(id);

  if (entity != null) {
    return entity;
  }

  entity = new Total(id);
  entity.timestamp = timestamp;
  entity.period = period;
  entity.bucketMagnitude = bucketMagnitude;
  entity.tribe = tribe;
  entity.product = product;

  entity.trades = ZERO;
  entity.exchangers = ZERO;
  entity.newExchangers = ZERO;
  entity.exchangeUSDTally = new BigDecimal(ZERO);
  entity.totalFeesGeneratedInUSD = new BigDecimal(ZERO);

  return entity;
}

function trackTotals(
  entity: Total,
  account: Address,
  actualTimestamp: BigInt,
  amountInUSD: BigDecimal,
  feesInUSD: BigDecimal,
): void {
  let exchangerId = account.toHex();

  if (entity.period != ZERO) {
    exchangerId = account.toHex() + '-' + entity.id;
  }

  let globalExchanger = Exchanger.load(account.toHex());
  let exchanger = Exchanger.load(exchangerId);

  if (globalExchanger == null) {
    entity.newExchangers = entity.newExchangers.plus(BigInt.fromI32(1));
  }

  if (exchanger == null) {
    entity.exchangers = entity.exchangers.plus(BigInt.fromI32(1));

    exchanger = new Exchanger(exchangerId);
    exchanger.firstSeen = actualTimestamp;
    exchanger.timestamp = entity.timestamp;
    exchanger.period = entity.period;
    exchanger.bucketMagnitude = entity.bucketMagnitude;
    exchanger.tribe = entity.tribe;

    exchanger.trades = ZERO;
    exchanger.exchangeUSDTally = new BigDecimal(ZERO);
    exchanger.totalFeesGeneratedInUSD = new BigDecimal(ZERO);
  }

  exchanger.lastSeen = actualTimestamp;

  if (amountInUSD && feesInUSD) {
    entity.trades = entity.trades.plus(BigInt.fromI32(1));
    exchanger.trades = exchanger.trades.plus(BigInt.fromI32(1));

    entity.exchangeUSDTally = entity.exchangeUSDTally.plus(amountInUSD);
    entity.totalFeesGeneratedInUSD = entity.totalFeesGeneratedInUSD.plus(feesInUSD);

    exchanger.exchangeUSDTally = exchanger.exchangeUSDTally.plus(amountInUSD);
    exchanger.totalFeesGeneratedInUSD = exchanger.totalFeesGeneratedInUSD.plus(feesInUSD);
  }

  entity.save();
  exchanger.save();
}

function addMissingTribeRate(currencyBytes: Bytes): BigDecimal {
  if (currencyBytes.toString() == 'hUSD' || currencyBytes.toString() == 'nUSD') {
    addDollar('hUSD');
    addDollar('nUSD');
    return toDecimal(BigInt.fromI32(1));
  }

  let haka = Tribeone.bind(dataSource.address());
  let hakaResolver = haka.try_resolver();
  if (!hakaResolver.reverted) {
    let resolver = AddressResolver.bind(hakaResolver.value);
    let exchangeRatesContract = ExchangeRates.bind(resolver.getAddress(strToBytes('ExchangeRates')));

    let aggregatorResult = exchangeRatesContract.aggregators(currencyBytes);

    if (aggregatorResult.equals(ZERO_ADDRESS)) {
      throw new Error('aggregator does not exist in exchange rates for tribe ' + currencyBytes.toString());
    }

    addProxyAggregator(currencyBytes.toString(), aggregatorResult);

    return toDecimal(exchangeRatesContract.rateForCurrency(currencyBytes));
  } else {
    return new BigDecimal(new BigInt(0));
  }
}

export function handleTribeExchange(event: TribeExchangeEvent): void {
  let txHash = event.transaction.hash.toHex();
  let fromCurrencyKey = event.params.fromCurrencyKey.toString();
  let toCurrencyKey = event.params.toCurrencyKey.toString();
  let latestFromRate = getLatestRate(fromCurrencyKey, txHash);
  let latestToRate = getLatestRate(toCurrencyKey, txHash);
  // this will ensure HAKA rate gets added at some point
  let latestHAKARate = getLatestRate('HAKA', txHash);
  if (!latestHAKARate) {
    addMissingTribeRate(strToBytes('HAKA'));
  }

  // may need to add new aggregator (this can happen on optimism)
  if (!latestFromRate) {
    latestFromRate = addMissingTribeRate(event.params.fromCurrencyKey);
  }

  if (!latestToRate) {
    latestToRate = addMissingTribeRate(event.params.fromCurrencyKey);
  }

  let account = event.params.account;
  let fromAmountInUSD = getUSDAmountFromAssetAmount(event.params.fromAmount, latestFromRate);
  let toAmountInUSD = getUSDAmountFromAssetAmount(event.params.toAmount, latestToRate);

  let feesInUSD = fromAmountInUSD.times(
    getExchangeFee('exchangeFeeRate', fromCurrencyKey == 'hUSD' ? toCurrencyKey : fromCurrencyKey),
  );

  let fromTribe = TribeByCurrencyKey.load(fromCurrencyKey);
  let toTribe = TribeByCurrencyKey.load(toCurrencyKey);

  let fromTribeAddress = fromTribe != null ? fromTribe.proxyAddress : ZERO_ADDRESS;
  let toTribeAddress = toTribe != null ? toTribe.proxyAddress : ZERO_ADDRESS;

  let eventEntity = new TribeExchange(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  eventEntity.account = account.toHex();
  eventEntity.fromTribe = fromTribeAddress.toHex();
  eventEntity.toTribe = toTribeAddress.toHex();
  eventEntity.fromAmount = toDecimal(event.params.fromAmount);
  eventEntity.fromAmountInUSD = fromAmountInUSD;
  eventEntity.toAmount = toDecimal(event.params.toAmount);
  eventEntity.toAmountInUSD = toAmountInUSD;
  eventEntity.toAddress = event.params.toAddress;
  eventEntity.feesInUSD = feesInUSD;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.gasPrice = event.transaction.gasPrice;
  eventEntity.save();

  let tribeOpts: (string | null)[] = [null, fromTribeAddress.toHex(), toTribeAddress.toHex()];

  let periods: BigInt[] = [
    YEAR_SECONDS,
    YEAR_SECONDS.div(BigInt.fromI32(4)),
    YEAR_SECONDS.div(BigInt.fromI32(12)),
    DAY_SECONDS.times(BigInt.fromI32(7)),
    DAY_SECONDS,
    FIFTEEN_MINUTE_SECONDS,
    ZERO,
  ];

  for (let s = 0; s < tribeOpts.length; s++) {
    let tribe = tribeOpts[s];

    for (let p = 0; p < periods.length; p++) {
      let period = periods[p];
      let startTimestamp = period == ZERO ? ZERO : getTimeID(event.block.timestamp, period);

      for (let m = 0; m < MAX_MAGNITUDE; m++) {
        let mag = new BigDecimal(BigInt.fromI32(<i32>Math.floor(Math.pow(10, m))));
        if (fromAmountInUSD.lt(mag)) {
          break;
        }

        trackTotals(
          populateAggregatedTotalEntity(startTimestamp, period, 'exchange', BigInt.fromI32(m), tribe),
          account,
          event.block.timestamp,
          fromAmountInUSD,
          feesInUSD,
        );
      }
    }
  }
}

export function handleAtomicTribeExchange(event: AtomicTribeExchangeEvent): void {
  let txHash = event.transaction.hash.toHex();
  let fromCurrencyKey = event.params.fromCurrencyKey.toString();
  let toCurrencyKey = event.params.toCurrencyKey.toString();
  let latestFromRate = getLatestRate(fromCurrencyKey, txHash);
  let latestToRate = getLatestRate(toCurrencyKey, txHash);

  // may need to add new aggregator (this can happen on optimism)
  if (!latestFromRate) {
    latestFromRate = addMissingTribeRate(event.params.fromCurrencyKey);
  }

  if (!latestToRate) {
    latestToRate = addMissingTribeRate(event.params.fromCurrencyKey);
  }

  let account = event.params.account;
  let fromAmountInUSD = getUSDAmountFromAssetAmount(event.params.fromAmount, latestFromRate);
  let toAmountInUSD = getUSDAmountFromAssetAmount(event.params.toAmount, latestToRate);

  let fromTribe = TribeByCurrencyKey.load(fromCurrencyKey);
  let toTribe = TribeByCurrencyKey.load(toCurrencyKey);

  let feesInUSD = fromAmountInUSD.times(
    getExchangeFee('atomicExchangeFeeRate', fromCurrencyKey == 'hUSD' ? toCurrencyKey : fromCurrencyKey),
  );

  let fromTribeAddress = fromTribe != null ? fromTribe.proxyAddress : ZERO_ADDRESS;
  let toTribeAddress = toTribe != null ? toTribe.proxyAddress : ZERO_ADDRESS;

  let eventEntity = new AtomicTribeExchange(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  eventEntity.account = account.toHex();
  eventEntity.fromTribe = fromTribeAddress.toHex();
  eventEntity.toTribe = toTribeAddress.toHex();
  eventEntity.fromAmount = toDecimal(event.params.fromAmount);
  eventEntity.fromAmountInUSD = fromAmountInUSD;
  eventEntity.toAmount = toDecimal(event.params.toAmount);
  eventEntity.toAmountInUSD = toAmountInUSD;
  eventEntity.toAddress = event.params.toAddress;
  eventEntity.feesInUSD = feesInUSD;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.gasPrice = event.transaction.gasPrice;
  eventEntity.save();
  // Note that we do not update tracked totals here because atomic exchanges also emit standard TribeExchange events
}

export function handleExchangeReclaim(event: ExchangeReclaimEvent): void {
  let txHash = event.transaction.hash.toHex();
  let entity = new ExchangeReclaim(txHash + '-' + event.logIndex.toString());
  entity.account = event.params.account.toHex();
  entity.amount = toDecimal(event.params.amount);
  entity.currencyKey = event.params.currencyKey;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  let latestRate = getLatestRate(event.params.currencyKey.toString(), txHash);

  if (!latestRate) {
    log.error('handleExchangeReclaim has an issue in tx hash: {}', [txHash]);
    return;
  }
  entity.amountInUSD = getUSDAmountFromAssetAmount(event.params.amount, latestRate);
  entity.save();
}

export function handleExchangeRebate(event: ExchangeRebateEvent): void {
  let txHash = event.transaction.hash.toHex();
  let entity = new ExchangeRebate(txHash + '-' + event.logIndex.toString());
  entity.account = event.params.account.toHex();
  entity.amount = toDecimal(event.params.amount);
  entity.currencyKey = event.params.currencyKey;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  let latestRate = getLatestRate(event.params.currencyKey.toString(), txHash);

  if (!latestRate) {
    log.error('handleExchangeReclaim has an issue in tx hash: {}', [txHash]);
    return;
  }
  entity.amountInUSD = getUSDAmountFromAssetAmount(event.params.amount, latestRate);
  entity.save();
}

export function handleFeeChange(event: ExchangeFeeUpdatedEvent): void {
  let currencyKey = event.params.tribeKey.toString();

  let entity = new ExchangeFee(currencyKey);
  entity.fee = toDecimal(event.params.newExchangeFeeRate);
  entity.save();
}

export function handleMarketAdded(event: MarketAddedEvent): void {
  let market = FuturesMarket.load(event.params.market.toHexString());
  if (!market) {
    FuturesMarketTemplate.create(event.params.market);
  }
}

export function handlePositionModified(event: PositionModifiedEvent): void {
  let market = event.transaction.to!.toHex();

  let periods: BigInt[] = [
    YEAR_SECONDS,
    YEAR_SECONDS.div(BigInt.fromI32(4)),
    YEAR_SECONDS.div(BigInt.fromI32(12)),
    DAY_SECONDS.times(BigInt.fromI32(7)),
    DAY_SECONDS,
    FIFTEEN_MINUTE_SECONDS,
    ZERO,
  ];

  let amountInUSD = toDecimal(event.params.tradeSize.times(event.params.lastPrice).div(ETHER).abs());

  let tribeOpts: (string | null)[] = [null, market];

  for (let s = 0; s < tribeOpts.length; s++) {
    let tribe = tribeOpts[s];

    for (let p = 0; p < periods.length; p++) {
      let period = periods[p];
      let startTimestamp = period == ZERO ? ZERO : getTimeID(event.block.timestamp, period);

      for (let m = 0; m < MAX_MAGNITUDE; m++) {
        let mag = new BigDecimal(BigInt.fromI32(<i32>Math.floor(Math.pow(10, m))));
        if (amountInUSD.lt(mag)) {
          break;
        }

        trackTotals(
          populateAggregatedTotalEntity(startTimestamp, period, 'futures', BigInt.fromI32(m), tribe),
          event.params.account,
          event.block.timestamp,
          amountInUSD,
          toDecimal(event.params.fee),
        );
      }
    }
  }
}
