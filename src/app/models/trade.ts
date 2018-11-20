import { firestore } from 'firebase';
import Timestamp = firestore.Timestamp;
import * as moment from 'moment';

export enum TradeType {
  Stock = 'STOCK',
  Option = 'OPTION',
  Cash = 'CASH'
}

export enum OptionType {
  Call = 'CALL',
  Put = 'PUTT'
}

export enum TradeAction {
  BuyToOpen = 'BUY TO OPEN',
  BuyToClose = 'BUY TO CLOSE',
  SellToOpen = 'SELL TO OPEN',
  SellToClose = 'SELL TO CLOSE',
  Deposit = 'DEPOSIT',
  Withdraw = 'WITHDRAW'
}

export interface ITrade {
  symbol: string | null;
  tradeType: TradeType;
  optionType: OptionType;
  expiryDate: Timestamp | null;
  strikePrice: number | null;
  quantity: number;
  action: TradeAction | null;
  fillPrice: number;
  fee: number;
  purchaseDate: Timestamp;
  postedDate: Timestamp;
}

export class Trade implements ITrade {
  symbol: string | null;
  tradeType: TradeType;
  optionType: OptionType;
  expiryDate: Timestamp | null;
  strikePrice: number | null;
  quantity: number;
  action: TradeAction | null;
  fillPrice: number;
  fee: number;
  purchaseDate: Timestamp;
  postedDate: Timestamp;

  static formatAsCurrencyWithTwoDecimal(value, decimalPoints): string {
    return '$' + parseFloat(value).toFixed(decimalPoints);
  }

  static formatAsPercentageWithTwoDecimal(value, decimalPoints): string {
    return parseFloat(value).toFixed(decimalPoints) + '%';
  }

  static userReadableSymbolString(symbol: string | null): string {
    return symbol !== null ? symbol : '--';
  }

  static userReadableOptionTypeString(optionType: OptionType | null): string {
    return optionType !== null ? optionType : '--';
  }

  static userReadableStrikeString(strikePrice: number | null): string {
    return strikePrice !== null
      ? this.formatAsCurrencyWithTwoDecimal(strikePrice.toString(), 2)
      : '--';
  }

  static userReadableActionString(action: string | null): string {
    return action !== null ? action : '--';
  }

  static userReadableDateString(date): string {
    return date !== null ? moment(date.toDate()).format('LL') : '--';
  }

  constructor(trade: ITrade) {
    this.symbol = trade.symbol;
    this.tradeType = trade.tradeType;
    this.optionType = trade.optionType;
    this.expiryDate = trade.expiryDate || null;
    this.strikePrice = trade.strikePrice || null;
    this.quantity = trade.quantity;
    this.action = trade.action;
    this.fillPrice = trade.fillPrice;
    this.purchaseDate = trade.purchaseDate;
    this.postedDate = trade.postedDate;
    this.fee = trade.fee;
  }

  get tradeValue(): number {
    return this.tradeType === TradeType.Option
      ? this.quantity * this.fillPrice * 100
      : this.quantity * this.fillPrice;
  }
}
