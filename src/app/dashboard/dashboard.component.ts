import { Component, OnInit, OnDestroy } from '@angular/core';
import * as Chartist from 'chartist';
import { Subscription, Observable } from 'rxjs';
import 'rxjs/add/observable/interval';
import { TradeService } from 'app/services/trade.service';
import { Trade } from 'app/models/trade';
import { PortfolioService } from 'app/services/portfolio.service';
import { Portfolio, IChartResult } from 'app/models/portfolio';
import { AuthService } from 'app/services/auth.service';
import * as moment from 'moment';

declare var $: any;

@Component({
  selector: 'dashboard-cmp',
  moduleId: module.id,
  templateUrl: 'dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  portfolio: Portfolio;
  trades: Trade[];
  portfolioSubscription: Subscription;
  tradesSubscription: Subscription;
  numberOfTrades: number = 0;
  fees: number = 0;
  portfolioUpdatedDateString: string;

  constructor(
    private authService: AuthService,
    private portfolioService: PortfolioService,
    private tradeService: TradeService
  ) {
    this.portfolioSubscription = this.portfolioService.portfolio$.subscribe(
      portfolio => {
        this.portfolio = portfolio;
        this.setupPortfolioValueChart(portfolio.portfolioValueBreakdown);
        this.setupPositionBreakdownPieChart(portfolio.positionBreakdown);
        this.setupPortfolioKeyMetricsChart(portfolio.keyMetricsBreakdown);
      }
    );

    this.portfolioUpdatedDateString = moment(
      this.authService.portfolioUpdatedDate.toDate()
    ).fromNow();

    this.tradesSubscription = this.tradeService.tradeDocuments$.subscribe(
      tradeDocuments => {
        this.trades = tradeDocuments.map(tradeDocument => tradeDocument.trade);
        this.analyzeTrades(this.trades);
      }
    );
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.tradesSubscription.unsubscribe();
    this.portfolioSubscription.unsubscribe();
  }

  setupPortfolioValueChart(portfolioValueBreakdownResult: IChartResult) {
    var dataPortfolioValue = {
      labels: portfolioValueBreakdownResult.labels,
      series: portfolioValueBreakdownResult.series
    };

    var optionsPortfolioValue = {
      seriesBarDistance: 100,
      classNames: { bar: 'ct-bar' },
      axisX: { showGrid: false },
      height: '300px'
    };

    var responsivePortfolioValue: any[] = [
      [
        'screen and (max-width: 640px)',
        {
          seriesBarDistance: 5,
          axisX: {
            labelInterpolationFnc: function(value) {
              return value[0];
            }
          }
        }
      ]
    ];

    new Chartist.Bar(
      '#chartPortfolioValue',
      dataPortfolioValue,
      optionsPortfolioValue,
      responsivePortfolioValue
    );
  }

  setupPositionBreakdownPieChart(portfolioBreakdownResult: IChartResult) {
    const labels = portfolioBreakdownResult.labels.map(
      (label, index) =>
        label +
        ' \n' +
        this.formatAsPercentageWithTwoDecimal(
          portfolioBreakdownResult.series[0][index].toString(),
          1
        )
    );
    var chartColors: string[] = [
      '#f0ad4e',
      '#d9534f',
      '#5bc0de',
      '#5cb85c',
      '#0275d8'
    ];
    var donutWidth = 100;
    var chartHeight = '400px';
    var optionsPortfolioBreakdown = {
      donut: true,
      height: chartHeight,
      donutWidth: donutWidth,
      startAngle: 0,
      total: 100,
      showLabel: true
      // labelInterpolationFnc: function(value, index) {
      //   return labels[index];
      // }
    };

    var pieChart = new Chartist.Pie(
      '#chartPortfolioBreakdown',
      { labels: labels, series: portfolioBreakdownResult.series[0] },
      optionsPortfolioBreakdown
    );

    pieChart.on('draw', function(data) {
      if (data.type !== 'slice') return;
      data.element._node.setAttribute(
        'style',
        'stroke: ' +
          chartColors[data.index % chartColors.length] +
          '; stroke-width: ' +
          donutWidth +
          'px'
      );

      // Get the total path length in order to use for dash array animation
      var pathLength = data.element._node.getTotalLength();

      // Set a dasharray that matches the path length as prerequisite to animate dashoffset
      data.element.attr({
        'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
      });

      // Create animation definition while also assigning an ID to the animation for later sync usage
      var animationDefinition: any = {
        'stroke-dashoffset': {
          id: 'anim' + data.index,
          dur: 800,
          from: -pathLength + 'px',
          to: '0px',
          easing: Chartist.Svg.Easing.easeOutQuint,
          // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
          fill: 'freeze'
        }
      };

      // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
      if (data.index !== 0) {
        animationDefinition['stroke-dashoffset'].begin =
          'anim' + (data.index - 1) + '.end';
      }

      // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
      data.element.attr({
        'stroke-dashoffset': -pathLength + 'px'
      });

      // We can't use guided mode as the animations need to rely on setting begin manually
      // See http://gionkunz.github.io/chartist-js/api-documentation.html#chartistsvg-function-animate
      data.element.animate(animationDefinition, false);
    });
  }

  setupPortfolioKeyMetricsChart(keyMetrics: IChartResult) {
    var dataKeyMetrics = {
      labels: keyMetrics.labels,
      series: keyMetrics.series
    };

    var optionsKeyMetrics = {
      seriesBarDistance: 0,
      axisX: {
        showGrid: false
      },
      axisY: {
        showGrid: false
      },
      height: '300px'
    };

    var responsiveKeyMetrics: any[] = [
      [
        'screen and (max-width: 640px)',
        {
          seriesBarDistance: 5,
          axisX: {
            labelInterpolationFnc: function(value) {
              return value[0];
            }
          }
        }
      ]
    ];

    new Chartist.Line(
      '#chartKeyMetrics',
      dataKeyMetrics,
      optionsKeyMetrics,
      responsiveKeyMetrics
    );
  }

  analyzeTrades(trades: Trade[]) {
    this.numberOfTrades = trades.length;
    for (var trade of trades) {
      this.fees += trade.fee;
    }
  }

  formatAsCurrencyWithTwoDecimal(value, decimalPoints): string {
    return Trade.formatAsCurrencyWithTwoDecimal(value, decimalPoints);
  }

  formatAsPercentageWithTwoDecimal(value, decimalPoints): string {
    return Trade.formatAsPercentageWithTwoDecimal(value, decimalPoints);
  }
}
