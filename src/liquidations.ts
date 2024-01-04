import { Tribeone32 } from '../generated/subgraphs/liquidations/liquidations_Liquidations_0/Tribeone32';

import { AddressResolver } from '../generated/subgraphs/liquidations/liquidations_Liquidations_0/AddressResolver';

import {
  AccountFlaggedForLiquidation as AccountFlaggedForLiquidationEvent,
  AccountRemovedFromLiquidation as AccountRemovedFromLiquidationEvent,
  Liquidations,
} from '../generated/subgraphs/liquidations/liquidations_Liquidations_0/Liquidations';

import { AccountLiquidated as AccountLiquidatedEvent } from '../generated/subgraphs/liquidations/liquidations_Tribeone_0/Tribeone';

import {
  AccountFlaggedForLiquidation,
  AccountRemovedFromLiquidation,
  AccountLiquidated,
} from '../generated/subgraphs/liquidations/schema';

import { strToBytes, toDecimal } from './lib/helpers';

export function handleAccountFlaggedForLiquidation(event: AccountFlaggedForLiquidationEvent): void {
  let liquidationsContract = Liquidations.bind(event.address);
  let resolver = AddressResolver.bind(liquidationsContract.resolver());
  let tribeone = Tribeone32.bind(resolver.getAddress(strToBytes('Tribeone', 32)));
  let accountFlaggedForLiquidation = new AccountFlaggedForLiquidation(
    event.params.deadline.toString() + '-' + event.params.account.toHex(),
  );
  accountFlaggedForLiquidation.account = event.params.account;
  accountFlaggedForLiquidation.deadline = event.params.deadline;
  accountFlaggedForLiquidation.collateralRatio = tribeone.collateralisationRatio(event.params.account);
  accountFlaggedForLiquidation.collateral = toDecimal(tribeone.collateral(event.params.account));
  accountFlaggedForLiquidation.liquidatableNonEscrowHAKA = toDecimal(tribeone.balanceOf(event.params.account));
  accountFlaggedForLiquidation.save();
}

export function handleAccountRemovedFromLiquidation(event: AccountRemovedFromLiquidationEvent): void {
  let accountRemovedFromLiquidation = new AccountRemovedFromLiquidation(
    event.params.time.toString() + '-' + event.params.account.toHex(),
  );
  accountRemovedFromLiquidation.account = event.params.account;
  accountRemovedFromLiquidation.time = event.params.time;
  accountRemovedFromLiquidation.save();
}

export function handleAccountLiquidated(event: AccountLiquidatedEvent): void {
  let entity = new AccountLiquidated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.account = event.params.account;
  entity.hakaRedeemed = toDecimal(event.params.hakaRedeemed);
  entity.amountLiquidated = toDecimal(event.params.amountLiquidated);
  entity.liquidator = event.params.liquidator;
  entity.time = event.block.timestamp;

  entity.save();
}
