import { Position, PositionStatus, IPosition } from './position';
import { IChartistData } from 'chartist';
import { Metrics, IMetrics } from './metric';
import * as moment from 'moment';
import { TradeType } from './trade';

export interface IChartResult extends IChartistData {
  labels: string[];
  series: number[][];
}

export interface IPortfolio {
  openPositions: Position[];
  closedPositions: Position[];
  metrics: Metrics[];
}

export class Portfolio implements IPortfolio {
  openPositions: Position[];
  closedPositions: Position[];
  metrics: Metrics[];

  private numberOfTrailingMonth = 12;

  constructor(positions: IPosition[], metrics: IMetrics[]) {
    this.openPositions = positions
      .map(position => new Position(position))
      .filter(position => {
        return position.status == PositionStatus.Open;
      });

    this.closedPositions = positions
      .map(position => new Position(position))
      .filter(position => {
        return position.status == PositionStatus.Closed;
      });

    this.metrics = metrics;

    // add placholder metrics if not enough exist to fill trailing 12 month
    const placeHolderArray: Metrics[] = Array(
      this.numberOfTrailingMonth - this.metrics.length
    ).fill({
      portfolioValue: 0,
      profitLoss: 0,
      fees: 0
    });
    this.metrics.unshift(...placeHolderArray);
  }

  get numberOfOpenPositions(): number {
    return this.openPositions.length;
  }

  get numberOfClosedPositions(): number {
    return this.closedPositions.length;
  }

  get totalOpenProfitLoss(): number {
    return this.openPositions.reduce((acc: number, position: Position) => {
      return (acc += position.profitLoss);
    }, 0);
  }

  get totalClosedProfitLoss(): number {
    return this.closedPositions.reduce((acc: number, position: Position) => {
      return (acc += position.profitLossClosedQuantity);
    }, 0);
  }

  get totalProfitLoss(): number {
    return this.totalOpenProfitLoss + this.totalClosedProfitLoss;
  }

  get totalPortfolioValue(): number {
    return this.openPositions.reduce((acc: number, position: Position) => {
      return (acc += position.positionValue);
    }, 0);
  }

  private positionPercentOfPortfolio(position: Position): number {
    return (position.positionValue / this.totalPortfolioValue) * 100;
  }

  get portfolioValueBreakdown(): IChartResult {
    return {
      labels: this.getMonthLabels(this.numberOfTrailingMonth),
      series: [this.metrics.map(metric => metric.portfolioValue)]
    };
  }

  get positionBreakdown(): IChartResult {
    return {
      labels: this.openPositions.map(positon =>
        positon.symbol != null ? positon.symbol : TradeType.Cash
      ),
      series: [
        this.openPositions.map(positon =>
          this.positionPercentOfPortfolio(positon)
        )
      ]
    };
  }

  get keyMetricsBreakdown(): IChartResult {
    return {
      labels: this.getMonthLabels(this.numberOfTrailingMonth),
      series: [
        this.metrics.map(metric => metric.profitLoss),
        this.metrics.map(metric => metric.fees)
      ]
    };
  }

  private getMonthLabels(numberOfMonthBack: number): string[] {
    const now = new Date();
    const month = now.getMonth();
    const monthLabels = Array(numberOfMonthBack)
      .fill(now)
      .map((value, index) =>
        moment(
          new Date(now.getFullYear(), month - (numberOfMonthBack - index), 1)
        ).format('MMM')
      );

    return monthLabels;
  }
}
