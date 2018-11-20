import { TradeType, OptionType } from './trade';
import { firestore } from 'firebase';
import Timestamp = firestore.Timestamp;

export enum PositionStatus {
  Open = 'OPEN',
  Closed = 'CLOSED'
}

export interface IPosition {
  symbol: string;
  tradeType: TradeType;
  optionType: OptionType;
  expiryDate: Timestamp | null;
  strikePrice: number | null;
  openQuantity: number;
  closedQuantity: number;
  averagePrice: number;
  currentPrice: number;
  entryDate: Timestamp;
  exitDate: Timestamp | null;
  status: PositionStatus;
  tradeIds: string[];
  fees: number;
  postedDate: Timestamp;
}

export class Position implements IPosition {
  symbol: string;
  tradeType: TradeType;
  optionType: OptionType;
  expiryDate: Timestamp | null;
  strikePrice: number | null;
  openQuantity: number;
  closedQuantity: number;
  averagePrice: number;
  currentPrice: number;
  entryDate: Timestamp;
  exitDate: Timestamp | null;
  status: PositionStatus;
  tradeIds: string[];
  fees: number;
  postedDate: Timestamp;

  static userReadableDaysString(days: number | null): string {
    return days !== null ? days.toString() + 'd' : '--';
  }

  constructor(position: IPosition) {
    this.symbol = position.symbol;
    this.tradeType = position.tradeType;
    this.optionType = position.optionType;
    this.expiryDate = position.expiryDate || null;
    this.strikePrice = position.strikePrice || null;
    this.openQuantity = position.openQuantity;
    this.closedQuantity = position.closedQuantity;
    this.averagePrice = position.averagePrice;
    this.currentPrice = position.currentPrice;
    this.entryDate = position.entryDate;
    this.exitDate = position.exitDate;
    this.status = position.status;
    this.tradeIds = position.tradeIds;
    this.fees = position.fees;
    this.postedDate = position.postedDate;
  }

  get positionValue(): number {
    return this.tradeType === TradeType.Option
      ? this.openQuantity * this.currentPrice * 100
      : this.openQuantity * this.currentPrice;
  }

  get profitLoss(): number {
    return this.tradeType === TradeType.Option
      ? this.openQuantity * (this.currentPrice - this.averagePrice) * 100
      : this.openQuantity * (this.currentPrice - this.averagePrice);
  }

  get profitLossPercentage(): number {
    return this.tradeType === TradeType.Option
      ? this.profitLoss / (this.openQuantity * this.averagePrice * 100)
      : this.profitLoss / (this.openQuantity * this.averagePrice);
  }

  get profitLossClosedQuantity(): number {
    return this.tradeType === TradeType.Option
      ? this.closedQuantity * (this.currentPrice - this.averagePrice) * 100
      : this.closedQuantity * (this.currentPrice - this.averagePrice);
  }

  get daysOpen(): number {
    const today = Timestamp.now();
    return this.dateDifference(today, this.entryDate);
  }

  get daysUntilExpiry(): number | null {
    const today = Timestamp.now();
    return this.tradeType === TradeType.Option
      ? this.dateDifference(this.expiryDate as Timestamp, today)
      : null;
  }

  dateDifference(date1: Timestamp, date2: Timestamp): number {
    return Math.floor(
      Math.round(date1.seconds - date2.seconds) / (60 * 60 * 24)
    );
  }
}
