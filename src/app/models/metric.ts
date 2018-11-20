export interface IMetrics {
  portfolioValue: number;
  profitLoss: number;
  fees: number;
}

export class Metrics implements IMetrics {
  portfolioValue: number;
  profitLoss: number;
  fees: number;

  constructor(metrics: IMetrics) {
    this.portfolioValue = metrics.portfolioValue;
    this.profitLoss = metrics.profitLoss;
    this.fees = metrics.fees;
  }
}
