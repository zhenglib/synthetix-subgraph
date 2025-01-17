// The latest Tribeone and event invocations

import { Tribeone as HAKA } from '../generated/subgraphs/periodic-updates/periodicUpdates_ProxyERC20_0/Tribeone';
import { TribeoneDebtShare } from '../generated/subgraphs/periodic-updates/periodicUpdates_ProxyERC20_0/TribeoneDebtShare';
import { SystemSettings as SystemSettingsContract } from '../generated/subgraphs/periodic-updates/periodicUpdates_ProxyERC20_0/SystemSettings';

import { CANDLE_PERIODS, strToBytes, toDecimal, ZERO } from './lib/helpers';

// TribeoneState has not changed ABI since deployment

import { DebtState, SystemSetting } from '../generated/subgraphs/periodic-updates/schema';

import { BigInt, ethereum, dataSource, log } from '@graphprotocol/graph-ts';
import { getContractDeployment } from '../generated/addresses';

export function handleBlock(block: ethereum.Block): void {
  if (block.number.mod(BigInt.fromI32(6000)).equals(BigInt.fromI32(0))) {
    trackSystemSettings(block);
  }
  if (block.number.mod(BigInt.fromI32(25)).equals(BigInt.fromI32(0))) {
    trackGlobalDebt(block);
  }
}

export function trackSystemSettings(block: ethereum.Block): void {
  let timeSlot = block.timestamp.minus(block.timestamp.mod(BigInt.fromI32(900)));

  let curSystemSettings = SystemSetting.load(timeSlot.toString());

  if (curSystemSettings == null) {
    let systemSettingsAddress = getContractDeployment('SystemSettings', dataSource.network(), block.number)!;
    let systemSettings = SystemSettingsContract.bind(systemSettingsAddress);
    let systemSettingsEntity = new SystemSetting(timeSlot.toString());
    systemSettingsEntity.timestamp = block.timestamp;

    let waitingPeriodSecs = systemSettings.try_waitingPeriodSecs();
    if (!waitingPeriodSecs.reverted) {
      systemSettingsEntity.waitingPeriodSecs = waitingPeriodSecs.value;
    }

    let priceDeviationThresholdFactor = systemSettings.try_priceDeviationThresholdFactor();
    if (!priceDeviationThresholdFactor.reverted) {
      systemSettingsEntity.priceDeviationThresholdFactor = toDecimal(priceDeviationThresholdFactor.value);
    }

    let issuanceRatio = systemSettings.try_issuanceRatio();
    if (!issuanceRatio.reverted) {
      systemSettingsEntity.issuanceRatio = toDecimal(issuanceRatio.value);
    }

    let feePeriodDuration = systemSettings.try_feePeriodDuration();
    if (!feePeriodDuration.reverted) {
      systemSettingsEntity.feePeriodDuration = feePeriodDuration.value;
    }

    let targetThreshold = systemSettings.try_targetThreshold();
    if (!targetThreshold.reverted) {
      systemSettingsEntity.targetThreshold = toDecimal(targetThreshold.value);
    }

    let liquidationDelay = systemSettings.try_liquidationDelay();
    if (!liquidationDelay.reverted) {
      systemSettingsEntity.liquidationDelay = liquidationDelay.value;
    }

    let liquidationRatio = systemSettings.try_liquidationRatio();
    if (!liquidationRatio.reverted) {
      systemSettingsEntity.liquidationRatio = toDecimal(liquidationRatio.value);
    }

    let liquidationPenalty = systemSettings.try_liquidationPenalty();
    if (!liquidationPenalty.reverted) {
      systemSettingsEntity.liquidationPenalty = toDecimal(liquidationPenalty.value);
    }

    let rateStalePeriod = systemSettings.try_rateStalePeriod();
    if (!rateStalePeriod.reverted) {
      systemSettingsEntity.rateStalePeriod = rateStalePeriod.value;
    }

    let debtSnapshotStaleTime = systemSettings.try_debtSnapshotStaleTime();
    if (!debtSnapshotStaleTime.reverted) {
      systemSettingsEntity.debtSnapshotStaleTime = debtSnapshotStaleTime.value;
    }

    let aggregatorWarningFlags = systemSettings.try_aggregatorWarningFlags();
    if (!aggregatorWarningFlags.reverted) {
      systemSettingsEntity.aggregatorWarningFlags = aggregatorWarningFlags.value.toHexString();
    }

    let etherWrapperMaxETH = systemSettings.try_etherWrapperMaxETH();
    if (!etherWrapperMaxETH.reverted) {
      systemSettingsEntity.etherWrapperMaxETH = toDecimal(etherWrapperMaxETH.value);
    }

    let etherWrapperMintFeeRate = systemSettings.try_etherWrapperMintFeeRate();
    if (!etherWrapperMintFeeRate.reverted) {
      systemSettingsEntity.etherWrapperMintFeeRate = toDecimal(etherWrapperMintFeeRate.value);
    }

    let etherWrapperBurnFeeRate = systemSettings.try_etherWrapperBurnFeeRate();
    if (!etherWrapperBurnFeeRate.reverted) {
      systemSettingsEntity.etherWrapperBurnFeeRate = toDecimal(etherWrapperBurnFeeRate.value);
    }

    let atomicMaxVolumePerBlock = systemSettings.try_atomicMaxVolumePerBlock();
    if (!atomicMaxVolumePerBlock.reverted) {
      systemSettingsEntity.atomicMaxVolumePerBlock = atomicMaxVolumePerBlock.value;
    }

    let atomicTwapWindow = systemSettings.try_atomicTwapWindow();
    if (!atomicTwapWindow.reverted) {
      systemSettingsEntity.atomicTwapWindow = atomicTwapWindow.value;
    }

    systemSettingsEntity.save();
  }
}

export function trackGlobalDebt(block: ethereum.Block): void {
  let timeSlot = block.timestamp.minus(block.timestamp.mod(BigInt.fromI32(900)));

  let curDebtState = DebtState.load(timeSlot.toString());

  if (curDebtState == null) {
    let sdsAddress = getContractDeployment('TribeoneDebtShare', dataSource.network(), block.number)!;
    let sds = TribeoneDebtShare.bind(sdsAddress);

    let tribeone = HAKA.bind(dataSource.address());
    let issuedTribes = tribeone.try_totalIssuedTribesExcludeOtherCollateral(strToBytes('hUSD', 32));

    if (issuedTribes.reverted) {
      // issuedTribes = tribeone.try_totalIssuedTribesExcludeEtherCollateral(strToBytes('hUSD', 32));
      issuedTribes = tribeone.try_totalIssuedTribes(strToBytes('hUSD', 32));

      if (issuedTribes.reverted) {
        issuedTribes = tribeone.try_totalIssuedTribes(strToBytes('hUSD', 32));
        if (issuedTribes.reverted) {
          // for some reason this can happen (not sure how)
          log.debug('failed to get issued tribes (skip', []);
          return;
        }
      }
    }

    let debtSharesSupply = sds.try_totalSupply();
    if (!debtSharesSupply.reverted) {
      for (let p = 0; p < CANDLE_PERIODS.length; p++) {
        let period = CANDLE_PERIODS[p];
        let periodId = block.timestamp.minus(block.timestamp.mod(period));
        let id = period.toString() + '-' + periodId.toString();

        let debtStateEntity = new DebtState(id);

        debtStateEntity.debtEntry = toDecimal(debtSharesSupply.value);
        debtStateEntity.totalIssuedTribes = toDecimal(issuedTribes.value);

        debtStateEntity.debtRatio = debtStateEntity.debtEntry.equals(toDecimal(ZERO))
          ? toDecimal(ZERO)
          : debtStateEntity.totalIssuedTribes.div(debtStateEntity.debtEntry);

        debtStateEntity.timestamp = block.timestamp;
        debtStateEntity.period = period;

        debtStateEntity.save();
      }
    }
  }
}
