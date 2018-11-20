import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Observable } from 'rxjs';
import { Position } from 'app/models/position';
import { Trade, OptionType } from 'app/models/trade';
import { PortfolioService } from 'app/services/portfolio.service';
import { Portfolio } from 'app/models/portfolio';

declare var $: any;

@Component({
  selector: 'portfolio-cmp',
  moduleId: module.id,
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit, AfterViewChecked {
  headers = [
    'Symbol',
    'Type',
    'Option',
    'Option Expiry',
    'Option Strike',
    'Quantity',
    'Avg. Price',
    'Current Price',
    'Position Value',
    'P&L',
    '% P&L',
    '% Portfolio',
    'Day Opened',
    'Days Open',
    'Days Till Expiry'
  ];
  portfolio$: Observable<Portfolio>;

  constructor(private portfolioService: PortfolioService) {
    this.portfolio$ = portfolioService.portfolio$;
  }

  ngOnInit() {}

  ngAfterViewChecked() {}

  onCurrentPriceChange() {}

  private formatAsCurrencyWithTwoDecimal(value, decimalPoints): string {
    return Trade.formatAsCurrencyWithTwoDecimal(value, decimalPoints);
  }

  private formatAsPercentageWithTwoDecimal(value, decimalPoints): string {
    return Trade.formatAsPercentageWithTwoDecimal(value, decimalPoints);
  }

  private userReadableSymbolString(symbol: string | null): string {
    return Trade.userReadableSymbolString(symbol);
  }

  private userReadableOptionTypeString(optionType: OptionType | null): string {
    return Trade.userReadableOptionTypeString(optionType);
  }

  private userReadableStrikeString(strikePrice: number | null): string {
    return Trade.userReadableStrikeString(strikePrice);
  }

  private userReadableDateString(date): string {
    return Trade.userReadableDateString(date);
  }

  private userReadableDaysString(days: number | null): string {
    return Position.userReadableDaysString(days);
  }

  private showNotification(message, type, from, align) {
    $.notify(
      { icon: 'ti-bell', message: message },
      { type: type, timer: 250, placement: { from: from, align: align } }
    );
  }
}
