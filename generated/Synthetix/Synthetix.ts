// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  EthereumCall,
  EthereumEvent,
  SmartContract,
  EthereumValue,
  JSONValue,
  TypedMap,
  Entity,
  EthereumTuple,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class SynthExchange extends EthereumEvent {
  get params(): SynthExchange__Params {
    return new SynthExchange__Params(this);
  }
}

export class SynthExchange__Params {
  _event: SynthExchange;

  constructor(event: SynthExchange) {
    this._event = event;
  }

  get account(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get fromCurrencyKey(): Bytes {
    return this._event.parameters[1].value.toBytes();
  }

  get fromAmount(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get toCurrencyKey(): Bytes {
    return this._event.parameters[3].value.toBytes();
  }

  get toAmount(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get toAddress(): Address {
    return this._event.parameters[5].value.toAddress();
  }
}

export class Transfer extends EthereumEvent {
  get params(): Transfer__Params {
    return new Transfer__Params(this);
  }
}

export class Transfer__Params {
  _event: Transfer;

  constructor(event: Transfer) {
    this._event = event;
  }

  get from(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get to(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get value(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class Approval extends EthereumEvent {
  get params(): Approval__Params {
    return new Approval__Params(this);
  }
}

export class Approval__Params {
  _event: Approval;

  constructor(event: Approval) {
    this._event = event;
  }

  get owner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get spender(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get value(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class TokenStateUpdated extends EthereumEvent {
  get params(): TokenStateUpdated__Params {
    return new TokenStateUpdated__Params(this);
  }
}

export class TokenStateUpdated__Params {
  _event: TokenStateUpdated;

  constructor(event: TokenStateUpdated) {
    this._event = event;
  }

  get newTokenState(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class ProxyUpdated extends EthereumEvent {
  get params(): ProxyUpdated__Params {
    return new ProxyUpdated__Params(this);
  }
}

export class ProxyUpdated__Params {
  _event: ProxyUpdated;

  constructor(event: ProxyUpdated) {
    this._event = event;
  }

  get proxyAddress(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class SelfDestructTerminated extends EthereumEvent {
  get params(): SelfDestructTerminated__Params {
    return new SelfDestructTerminated__Params(this);
  }
}

export class SelfDestructTerminated__Params {
  _event: SelfDestructTerminated;

  constructor(event: SelfDestructTerminated) {
    this._event = event;
  }
}

export class SelfDestructed extends EthereumEvent {
  get params(): SelfDestructed__Params {
    return new SelfDestructed__Params(this);
  }
}

export class SelfDestructed__Params {
  _event: SelfDestructed;

  constructor(event: SelfDestructed) {
    this._event = event;
  }

  get beneficiary(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class SelfDestructInitiated extends EthereumEvent {
  get params(): SelfDestructInitiated__Params {
    return new SelfDestructInitiated__Params(this);
  }
}

export class SelfDestructInitiated__Params {
  _event: SelfDestructInitiated;

  constructor(event: SelfDestructInitiated) {
    this._event = event;
  }

  get selfDestructDelay(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }
}

export class SelfDestructBeneficiaryUpdated extends EthereumEvent {
  get params(): SelfDestructBeneficiaryUpdated__Params {
    return new SelfDestructBeneficiaryUpdated__Params(this);
  }
}

export class SelfDestructBeneficiaryUpdated__Params {
  _event: SelfDestructBeneficiaryUpdated;

  constructor(event: SelfDestructBeneficiaryUpdated) {
    this._event = event;
  }

  get newBeneficiary(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class OwnerNominated extends EthereumEvent {
  get params(): OwnerNominated__Params {
    return new OwnerNominated__Params(this);
  }
}

export class OwnerNominated__Params {
  _event: OwnerNominated;

  constructor(event: OwnerNominated) {
    this._event = event;
  }

  get newOwner(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class OwnerChanged extends EthereumEvent {
  get params(): OwnerChanged__Params {
    return new OwnerChanged__Params(this);
  }
}

export class OwnerChanged__Params {
  _event: OwnerChanged;

  constructor(event: OwnerChanged) {
    this._event = event;
  }

  get oldOwner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get newOwner(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class Synthetix extends SmartContract {
  static bind(address: Address): Synthetix {
    return new Synthetix("Synthetix", address);
  }

  name(): string {
    let result = super.call("name", []);
    return result[0].toString();
  }

  initiationTime(): BigInt {
    let result = super.call("initiationTime", []);
    return result[0].toBigInt();
  }

  totalSupply(): BigInt {
    let result = super.call("totalSupply", []);
    return result[0].toBigInt();
  }

  debtBalanceOf(issuer: Address, currencyKey: Bytes): BigInt {
    let result = super.call("debtBalanceOf", [
      EthereumValue.fromAddress(issuer),
      EthereumValue.fromFixedBytes(currencyKey)
    ]);
    return result[0].toBigInt();
  }

  decimals(): i32 {
    let result = super.call("decimals", []);
    return result[0].toI32();
  }

  effectiveValue(
    sourceCurrencyKey: Bytes,
    sourceAmount: BigInt,
    destinationCurrencyKey: Bytes
  ): BigInt {
    let result = super.call("effectiveValue", [
      EthereumValue.fromFixedBytes(sourceCurrencyKey),
      EthereumValue.fromUnsignedBigInt(sourceAmount),
      EthereumValue.fromFixedBytes(destinationCurrencyKey)
    ]);
    return result[0].toBigInt();
  }

  totalIssuedSynths(currencyKey: Bytes): BigInt {
    let result = super.call("totalIssuedSynths", [
      EthereumValue.fromFixedBytes(currencyKey)
    ]);
    return result[0].toBigInt();
  }

  exchangeRates(): Address {
    let result = super.call("exchangeRates", []);
    return result[0].toAddress();
  }

  synths(param0: Bytes): Address {
    let result = super.call("synths", [EthereumValue.fromFixedBytes(param0)]);
    return result[0].toAddress();
  }

  nominatedOwner(): Address {
    let result = super.call("nominatedOwner", []);
    return result[0].toAddress();
  }

  transferableSynthetix(account: Address): BigInt {
    let result = super.call("transferableSynthetix", [
      EthereumValue.fromAddress(account)
    ]);
    return result[0].toBigInt();
  }

  balanceOf(account: Address): BigInt {
    let result = super.call("balanceOf", [EthereumValue.fromAddress(account)]);
    return result[0].toBigInt();
  }

  availableCurrencyKeys(): Array<Bytes> {
    let result = super.call("availableCurrencyKeys", []);
    return result[0].toBytesArray();
  }

  maxIssuableSynths(issuer: Address, currencyKey: Bytes): BigInt {
    let result = super.call("maxIssuableSynths", [
      EthereumValue.fromAddress(issuer),
      EthereumValue.fromFixedBytes(currencyKey)
    ]);
    return result[0].toBigInt();
  }

  availableSynths(param0: BigInt): Address {
    let result = super.call("availableSynths", [
      EthereumValue.fromUnsignedBigInt(param0)
    ]);
    return result[0].toAddress();
  }

  owner(): Address {
    let result = super.call("owner", []);
    return result[0].toAddress();
  }

  symbol(): string {
    let result = super.call("symbol", []);
    return result[0].toString();
  }

  remainingIssuableSynths(issuer: Address, currencyKey: Bytes): BigInt {
    let result = super.call("remainingIssuableSynths", [
      EthereumValue.fromAddress(issuer),
      EthereumValue.fromFixedBytes(currencyKey)
    ]);
    return result[0].toBigInt();
  }

  collateralisationRatio(issuer: Address): BigInt {
    let result = super.call("collateralisationRatio", [
      EthereumValue.fromAddress(issuer)
    ]);
    return result[0].toBigInt();
  }

  rewardEscrow(): Address {
    let result = super.call("rewardEscrow", []);
    return result[0].toAddress();
  }

  SELFDESTRUCT_DELAY(): BigInt {
    let result = super.call("SELFDESTRUCT_DELAY", []);
    return result[0].toBigInt();
  }

  collateral(account: Address): BigInt {
    let result = super.call("collateral", [EthereumValue.fromAddress(account)]);
    return result[0].toBigInt();
  }

  feePool(): Address {
    let result = super.call("feePool", []);
    return result[0].toAddress();
  }

  selfDestructInitiated(): boolean {
    let result = super.call("selfDestructInitiated", []);
    return result[0].toBoolean();
  }

  supplySchedule(): Address {
    let result = super.call("supplySchedule", []);
    return result[0].toAddress();
  }

  selfDestructBeneficiary(): Address {
    let result = super.call("selfDestructBeneficiary", []);
    return result[0].toAddress();
  }

  synthetixState(): Address {
    let result = super.call("synthetixState", []);
    return result[0].toAddress();
  }

  availableSynthCount(): BigInt {
    let result = super.call("availableSynthCount", []);
    return result[0].toBigInt();
  }

  allowance(owner: Address, spender: Address): BigInt {
    let result = super.call("allowance", [
      EthereumValue.fromAddress(owner),
      EthereumValue.fromAddress(spender)
    ]);
    return result[0].toBigInt();
  }

  escrow(): Address {
    let result = super.call("escrow", []);
    return result[0].toAddress();
  }

  tokenState(): Address {
    let result = super.call("tokenState", []);
    return result[0].toAddress();
  }

  proxy(): Address {
    let result = super.call("proxy", []);
    return result[0].toAddress();
  }

  exchangeEnabled(): boolean {
    let result = super.call("exchangeEnabled", []);
    return result[0].toBoolean();
  }
}

export class ApproveCall extends EthereumCall {
  get inputs(): ApproveCall__Inputs {
    return new ApproveCall__Inputs(this);
  }

  get outputs(): ApproveCall__Outputs {
    return new ApproveCall__Outputs(this);
  }
}

export class ApproveCall__Inputs {
  _call: ApproveCall;

  constructor(call: ApproveCall) {
    this._call = call;
  }

  get spender(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get value(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class ApproveCall__Outputs {
  _call: ApproveCall;

  constructor(call: ApproveCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class MintCall extends EthereumCall {
  get inputs(): MintCall__Inputs {
    return new MintCall__Inputs(this);
  }

  get outputs(): MintCall__Outputs {
    return new MintCall__Outputs(this);
  }
}

export class MintCall__Inputs {
  _call: MintCall;

  constructor(call: MintCall) {
    this._call = call;
  }
}

export class MintCall__Outputs {
  _call: MintCall;

  constructor(call: MintCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class NominateNewOwnerCall extends EthereumCall {
  get inputs(): NominateNewOwnerCall__Inputs {
    return new NominateNewOwnerCall__Inputs(this);
  }

  get outputs(): NominateNewOwnerCall__Outputs {
    return new NominateNewOwnerCall__Outputs(this);
  }
}

export class NominateNewOwnerCall__Inputs {
  _call: NominateNewOwnerCall;

  constructor(call: NominateNewOwnerCall) {
    this._call = call;
  }

  get _owner(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class NominateNewOwnerCall__Outputs {
  _call: NominateNewOwnerCall;

  constructor(call: NominateNewOwnerCall) {
    this._call = call;
  }
}

export class SetFeePoolCall extends EthereumCall {
  get inputs(): SetFeePoolCall__Inputs {
    return new SetFeePoolCall__Inputs(this);
  }

  get outputs(): SetFeePoolCall__Outputs {
    return new SetFeePoolCall__Outputs(this);
  }
}

export class SetFeePoolCall__Inputs {
  _call: SetFeePoolCall;

  constructor(call: SetFeePoolCall) {
    this._call = call;
  }

  get _feePool(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetFeePoolCall__Outputs {
  _call: SetFeePoolCall;

  constructor(call: SetFeePoolCall) {
    this._call = call;
  }
}

export class SetSelfDestructBeneficiaryCall extends EthereumCall {
  get inputs(): SetSelfDestructBeneficiaryCall__Inputs {
    return new SetSelfDestructBeneficiaryCall__Inputs(this);
  }

  get outputs(): SetSelfDestructBeneficiaryCall__Outputs {
    return new SetSelfDestructBeneficiaryCall__Outputs(this);
  }
}

export class SetSelfDestructBeneficiaryCall__Inputs {
  _call: SetSelfDestructBeneficiaryCall;

  constructor(call: SetSelfDestructBeneficiaryCall) {
    this._call = call;
  }

  get _beneficiary(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetSelfDestructBeneficiaryCall__Outputs {
  _call: SetSelfDestructBeneficiaryCall;

  constructor(call: SetSelfDestructBeneficiaryCall) {
    this._call = call;
  }
}

export class TransferFromCall extends EthereumCall {
  get inputs(): TransferFromCall__Inputs {
    return new TransferFromCall__Inputs(this);
  }

  get outputs(): TransferFromCall__Outputs {
    return new TransferFromCall__Outputs(this);
  }
}

export class TransferFromCall__Inputs {
  _call: TransferFromCall;

  constructor(call: TransferFromCall) {
    this._call = call;
  }

  get from(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get to(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get value(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class TransferFromCall__Outputs {
  _call: TransferFromCall;

  constructor(call: TransferFromCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class TerminateSelfDestructCall extends EthereumCall {
  get inputs(): TerminateSelfDestructCall__Inputs {
    return new TerminateSelfDestructCall__Inputs(this);
  }

  get outputs(): TerminateSelfDestructCall__Outputs {
    return new TerminateSelfDestructCall__Outputs(this);
  }
}

export class TerminateSelfDestructCall__Inputs {
  _call: TerminateSelfDestructCall;

  constructor(call: TerminateSelfDestructCall) {
    this._call = call;
  }
}

export class TerminateSelfDestructCall__Outputs {
  _call: TerminateSelfDestructCall;

  constructor(call: TerminateSelfDestructCall) {
    this._call = call;
  }
}

export class ExchangeCall extends EthereumCall {
  get inputs(): ExchangeCall__Inputs {
    return new ExchangeCall__Inputs(this);
  }

  get outputs(): ExchangeCall__Outputs {
    return new ExchangeCall__Outputs(this);
  }
}

export class ExchangeCall__Inputs {
  _call: ExchangeCall;

  constructor(call: ExchangeCall) {
    this._call = call;
  }

  get sourceCurrencyKey(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }

  get sourceAmount(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get destinationCurrencyKey(): Bytes {
    return this._call.inputValues[2].value.toBytes();
  }

  get destinationAddress(): Address {
    return this._call.inputValues[3].value.toAddress();
  }
}

export class ExchangeCall__Outputs {
  _call: ExchangeCall;

  constructor(call: ExchangeCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class IssueSynthsCall extends EthereumCall {
  get inputs(): IssueSynthsCall__Inputs {
    return new IssueSynthsCall__Inputs(this);
  }

  get outputs(): IssueSynthsCall__Outputs {
    return new IssueSynthsCall__Outputs(this);
  }
}

export class IssueSynthsCall__Inputs {
  _call: IssueSynthsCall;

  constructor(call: IssueSynthsCall) {
    this._call = call;
  }

  get currencyKey(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }

  get amount(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class IssueSynthsCall__Outputs {
  _call: IssueSynthsCall;

  constructor(call: IssueSynthsCall) {
    this._call = call;
  }
}

export class SetExchangeRatesCall extends EthereumCall {
  get inputs(): SetExchangeRatesCall__Inputs {
    return new SetExchangeRatesCall__Inputs(this);
  }

  get outputs(): SetExchangeRatesCall__Outputs {
    return new SetExchangeRatesCall__Outputs(this);
  }
}

export class SetExchangeRatesCall__Inputs {
  _call: SetExchangeRatesCall;

  constructor(call: SetExchangeRatesCall) {
    this._call = call;
  }

  get _exchangeRates(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetExchangeRatesCall__Outputs {
  _call: SetExchangeRatesCall;

  constructor(call: SetExchangeRatesCall) {
    this._call = call;
  }
}

export class AcceptOwnershipCall extends EthereumCall {
  get inputs(): AcceptOwnershipCall__Inputs {
    return new AcceptOwnershipCall__Inputs(this);
  }

  get outputs(): AcceptOwnershipCall__Outputs {
    return new AcceptOwnershipCall__Outputs(this);
  }
}

export class AcceptOwnershipCall__Inputs {
  _call: AcceptOwnershipCall;

  constructor(call: AcceptOwnershipCall) {
    this._call = call;
  }
}

export class AcceptOwnershipCall__Outputs {
  _call: AcceptOwnershipCall;

  constructor(call: AcceptOwnershipCall) {
    this._call = call;
  }
}

export class AddSynthCall extends EthereumCall {
  get inputs(): AddSynthCall__Inputs {
    return new AddSynthCall__Inputs(this);
  }

  get outputs(): AddSynthCall__Outputs {
    return new AddSynthCall__Outputs(this);
  }
}

export class AddSynthCall__Inputs {
  _call: AddSynthCall;

  constructor(call: AddSynthCall) {
    this._call = call;
  }

  get synth(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class AddSynthCall__Outputs {
  _call: AddSynthCall;

  constructor(call: AddSynthCall) {
    this._call = call;
  }
}

export class RemoveSynthCall extends EthereumCall {
  get inputs(): RemoveSynthCall__Inputs {
    return new RemoveSynthCall__Inputs(this);
  }

  get outputs(): RemoveSynthCall__Outputs {
    return new RemoveSynthCall__Outputs(this);
  }
}

export class RemoveSynthCall__Inputs {
  _call: RemoveSynthCall;

  constructor(call: RemoveSynthCall) {
    this._call = call;
  }

  get currencyKey(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class RemoveSynthCall__Outputs {
  _call: RemoveSynthCall;

  constructor(call: RemoveSynthCall) {
    this._call = call;
  }
}

export class SetExchangeEnabledCall extends EthereumCall {
  get inputs(): SetExchangeEnabledCall__Inputs {
    return new SetExchangeEnabledCall__Inputs(this);
  }

  get outputs(): SetExchangeEnabledCall__Outputs {
    return new SetExchangeEnabledCall__Outputs(this);
  }
}

export class SetExchangeEnabledCall__Inputs {
  _call: SetExchangeEnabledCall;

  constructor(call: SetExchangeEnabledCall) {
    this._call = call;
  }

  get _exchangeEnabled(): boolean {
    return this._call.inputValues[0].value.toBoolean();
  }
}

export class SetExchangeEnabledCall__Outputs {
  _call: SetExchangeEnabledCall;

  constructor(call: SetExchangeEnabledCall) {
    this._call = call;
  }
}

export class SetProxyCall extends EthereumCall {
  get inputs(): SetProxyCall__Inputs {
    return new SetProxyCall__Inputs(this);
  }

  get outputs(): SetProxyCall__Outputs {
    return new SetProxyCall__Outputs(this);
  }
}

export class SetProxyCall__Inputs {
  _call: SetProxyCall;

  constructor(call: SetProxyCall) {
    this._call = call;
  }

  get _proxy(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetProxyCall__Outputs {
  _call: SetProxyCall;

  constructor(call: SetProxyCall) {
    this._call = call;
  }
}

export class SelfDestructCall extends EthereumCall {
  get inputs(): SelfDestructCall__Inputs {
    return new SelfDestructCall__Inputs(this);
  }

  get outputs(): SelfDestructCall__Outputs {
    return new SelfDestructCall__Outputs(this);
  }
}

export class SelfDestructCall__Inputs {
  _call: SelfDestructCall;

  constructor(call: SelfDestructCall) {
    this._call = call;
  }
}

export class SelfDestructCall__Outputs {
  _call: SelfDestructCall;

  constructor(call: SelfDestructCall) {
    this._call = call;
  }
}

export class SetTokenStateCall extends EthereumCall {
  get inputs(): SetTokenStateCall__Inputs {
    return new SetTokenStateCall__Inputs(this);
  }

  get outputs(): SetTokenStateCall__Outputs {
    return new SetTokenStateCall__Outputs(this);
  }
}

export class SetTokenStateCall__Inputs {
  _call: SetTokenStateCall;

  constructor(call: SetTokenStateCall) {
    this._call = call;
  }

  get _tokenState(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetTokenStateCall__Outputs {
  _call: SetTokenStateCall;

  constructor(call: SetTokenStateCall) {
    this._call = call;
  }
}

export class IssueMaxSynthsCall extends EthereumCall {
  get inputs(): IssueMaxSynthsCall__Inputs {
    return new IssueMaxSynthsCall__Inputs(this);
  }

  get outputs(): IssueMaxSynthsCall__Outputs {
    return new IssueMaxSynthsCall__Outputs(this);
  }
}

export class IssueMaxSynthsCall__Inputs {
  _call: IssueMaxSynthsCall;

  constructor(call: IssueMaxSynthsCall) {
    this._call = call;
  }

  get currencyKey(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class IssueMaxSynthsCall__Outputs {
  _call: IssueMaxSynthsCall;

  constructor(call: IssueMaxSynthsCall) {
    this._call = call;
  }
}

export class TransferCall extends EthereumCall {
  get inputs(): TransferCall__Inputs {
    return new TransferCall__Inputs(this);
  }

  get outputs(): TransferCall__Outputs {
    return new TransferCall__Outputs(this);
  }
}

export class TransferCall__Inputs {
  _call: TransferCall;

  constructor(call: TransferCall) {
    this._call = call;
  }

  get to(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get value(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class TransferCall__Outputs {
  _call: TransferCall;

  constructor(call: TransferCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class TransferFrom1Call extends EthereumCall {
  get inputs(): TransferFrom1Call__Inputs {
    return new TransferFrom1Call__Inputs(this);
  }

  get outputs(): TransferFrom1Call__Outputs {
    return new TransferFrom1Call__Outputs(this);
  }
}

export class TransferFrom1Call__Inputs {
  _call: TransferFrom1Call;

  constructor(call: TransferFrom1Call) {
    this._call = call;
  }

  get from(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get to(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get value(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }

  get data(): Bytes {
    return this._call.inputValues[3].value.toBytes();
  }
}

export class TransferFrom1Call__Outputs {
  _call: TransferFrom1Call;

  constructor(call: TransferFrom1Call) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class BurnSynthsCall extends EthereumCall {
  get inputs(): BurnSynthsCall__Inputs {
    return new BurnSynthsCall__Inputs(this);
  }

  get outputs(): BurnSynthsCall__Outputs {
    return new BurnSynthsCall__Outputs(this);
  }
}

export class BurnSynthsCall__Inputs {
  _call: BurnSynthsCall;

  constructor(call: BurnSynthsCall) {
    this._call = call;
  }

  get currencyKey(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }

  get amount(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class BurnSynthsCall__Outputs {
  _call: BurnSynthsCall;

  constructor(call: BurnSynthsCall) {
    this._call = call;
  }
}

export class SetMessageSenderCall extends EthereumCall {
  get inputs(): SetMessageSenderCall__Inputs {
    return new SetMessageSenderCall__Inputs(this);
  }

  get outputs(): SetMessageSenderCall__Outputs {
    return new SetMessageSenderCall__Outputs(this);
  }
}

export class SetMessageSenderCall__Inputs {
  _call: SetMessageSenderCall;

  constructor(call: SetMessageSenderCall) {
    this._call = call;
  }

  get sender(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetMessageSenderCall__Outputs {
  _call: SetMessageSenderCall;

  constructor(call: SetMessageSenderCall) {
    this._call = call;
  }
}

export class InitiateSelfDestructCall extends EthereumCall {
  get inputs(): InitiateSelfDestructCall__Inputs {
    return new InitiateSelfDestructCall__Inputs(this);
  }

  get outputs(): InitiateSelfDestructCall__Outputs {
    return new InitiateSelfDestructCall__Outputs(this);
  }
}

export class InitiateSelfDestructCall__Inputs {
  _call: InitiateSelfDestructCall;

  constructor(call: InitiateSelfDestructCall) {
    this._call = call;
  }
}

export class InitiateSelfDestructCall__Outputs {
  _call: InitiateSelfDestructCall;

  constructor(call: InitiateSelfDestructCall) {
    this._call = call;
  }
}

export class SynthInitiatedExchangeCall extends EthereumCall {
  get inputs(): SynthInitiatedExchangeCall__Inputs {
    return new SynthInitiatedExchangeCall__Inputs(this);
  }

  get outputs(): SynthInitiatedExchangeCall__Outputs {
    return new SynthInitiatedExchangeCall__Outputs(this);
  }
}

export class SynthInitiatedExchangeCall__Inputs {
  _call: SynthInitiatedExchangeCall;

  constructor(call: SynthInitiatedExchangeCall) {
    this._call = call;
  }

  get from(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get sourceCurrencyKey(): Bytes {
    return this._call.inputValues[1].value.toBytes();
  }

  get sourceAmount(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }

  get destinationCurrencyKey(): Bytes {
    return this._call.inputValues[3].value.toBytes();
  }

  get destinationAddress(): Address {
    return this._call.inputValues[4].value.toAddress();
  }
}

export class SynthInitiatedExchangeCall__Outputs {
  _call: SynthInitiatedExchangeCall;

  constructor(call: SynthInitiatedExchangeCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class Transfer1Call extends EthereumCall {
  get inputs(): Transfer1Call__Inputs {
    return new Transfer1Call__Inputs(this);
  }

  get outputs(): Transfer1Call__Outputs {
    return new Transfer1Call__Outputs(this);
  }
}

export class Transfer1Call__Inputs {
  _call: Transfer1Call;

  constructor(call: Transfer1Call) {
    this._call = call;
  }

  get to(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get value(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get data(): Bytes {
    return this._call.inputValues[2].value.toBytes();
  }
}

export class Transfer1Call__Outputs {
  _call: Transfer1Call;

  constructor(call: Transfer1Call) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class SynthInitiatedFeePaymentCall extends EthereumCall {
  get inputs(): SynthInitiatedFeePaymentCall__Inputs {
    return new SynthInitiatedFeePaymentCall__Inputs(this);
  }

  get outputs(): SynthInitiatedFeePaymentCall__Outputs {
    return new SynthInitiatedFeePaymentCall__Outputs(this);
  }
}

export class SynthInitiatedFeePaymentCall__Inputs {
  _call: SynthInitiatedFeePaymentCall;

  constructor(call: SynthInitiatedFeePaymentCall) {
    this._call = call;
  }

  get from(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get sourceCurrencyKey(): Bytes {
    return this._call.inputValues[1].value.toBytes();
  }

  get sourceAmount(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class SynthInitiatedFeePaymentCall__Outputs {
  _call: SynthInitiatedFeePaymentCall;

  constructor(call: SynthInitiatedFeePaymentCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class SetProtectionCircuitCall extends EthereumCall {
  get inputs(): SetProtectionCircuitCall__Inputs {
    return new SetProtectionCircuitCall__Inputs(this);
  }

  get outputs(): SetProtectionCircuitCall__Outputs {
    return new SetProtectionCircuitCall__Outputs(this);
  }
}

export class SetProtectionCircuitCall__Inputs {
  _call: SetProtectionCircuitCall;

  constructor(call: SetProtectionCircuitCall) {
    this._call = call;
  }

  get _protectionCircuitIsActivated(): boolean {
    return this._call.inputValues[0].value.toBoolean();
  }
}

export class SetProtectionCircuitCall__Outputs {
  _call: SetProtectionCircuitCall;

  constructor(call: SetProtectionCircuitCall) {
    this._call = call;
  }
}

export class ConstructorCall extends EthereumCall {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get _proxy(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _tokenState(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get _synthetixState(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _owner(): Address {
    return this._call.inputValues[3].value.toAddress();
  }

  get _exchangeRates(): Address {
    return this._call.inputValues[4].value.toAddress();
  }

  get _feePool(): Address {
    return this._call.inputValues[5].value.toAddress();
  }

  get _supplySchedule(): Address {
    return this._call.inputValues[6].value.toAddress();
  }

  get _rewardEscrow(): Address {
    return this._call.inputValues[7].value.toAddress();
  }

  get _escrow(): Address {
    return this._call.inputValues[8].value.toAddress();
  }

  get _totalSupply(): BigInt {
    return this._call.inputValues[9].value.toBigInt();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}
