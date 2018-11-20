import { Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  AngularFirestore,
  AngularFirestoreCollection
} from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { IPosition, PositionStatus, Position } from 'app/models/position';
import { Portfolio } from 'app/models/portfolio';
import { IMetrics } from 'app/models/metric';

import { firestore } from 'firebase';
import Timestamp = firestore.Timestamp;

import { ITrade, TradeType, TradeAction } from 'app/models/trade';
import { ITradeDocument } from './trade.service';

export interface IPositionDocument {
  $key: string;
  position: Position;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  positionsCollection: AngularFirestoreCollection<IPosition>;
  portfolio$: Observable<Portfolio>;
  positionDocuments$: Observable<IPositionDocument[]>;

  private metricsCollection: AngularFirestoreCollection<IMetrics>;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {
    this.positionsCollection = firestore.collection<IPosition>(
      `users/${this.authService.userID}/positions`,
      ref => ref.orderBy('postedDate', 'desc')
    );

    this.metricsCollection = firestore.collection<IMetrics>(
      `users/${this.authService.userID}/metrics`
    );

    this.listenToPositionChanges();
  }

  private listenToPositionChanges() {
    this.portfolio$ = combineLatest(
      this.positionsCollection.valueChanges(),
      this.metricsCollection.valueChanges()
    ).pipe(map(results => new Portfolio(results[0], results[1])));

    this.positionDocuments$ = this.positionsCollection.snapshotChanges().pipe(
      map(snapshots =>
        snapshots.map(snapshot => ({
          $key: snapshot.payload.doc.id,
          position: new Position(snapshot.payload.doc.data() as IPosition)
        }))
      )
    );
  }

  // MARK: Position Functions

  positionAlreadyExists(position: Position, trade: ITrade): boolean {
    if (
      position.tradeType == TradeType.Option ||
      position.tradeType == TradeType.Stock
    ) {
      return (
        position.symbol == trade.symbol &&
        position.tradeType == trade.tradeType &&
        position.optionType == trade.optionType &&
        position.expiryDate == trade.expiryDate &&
        position.strikePrice == trade.strikePrice &&
        position.status === PositionStatus.Open
      );
    } else if (trade.tradeType == TradeType.Cash) {
      return position.tradeType == trade.tradeType;
    }
  }

  addTradeToPosition(
    positionDocument: IPositionDocument,
    tradeDocument: ITradeDocument
  ): Promise<void> {
    const position = positionDocument.position;
    const trade = tradeDocument.trade;
    console.log('addTradeToPosition', position);
    if (
      position.tradeType == TradeType.Stock ||
      position.tradeType == TradeType.Option
    ) {
      if (
        trade.action == TradeAction.BuyToOpen ||
        trade.action == TradeAction.SellToOpen
      ) {
        const positionTotalQuantity =
          position.openQuantity + position.closedQuantity;
        const newAveragePrice =
          (position.averagePrice * positionTotalQuantity +
            trade.fillPrice * Math.abs(trade.quantity)) /
          (positionTotalQuantity + Math.abs(trade.quantity));
        position.averagePrice = !isNaN(newAveragePrice)
          ? newAveragePrice
          : position.averagePrice;
        position.openQuantity += Math.abs(trade.quantity);
      } else if (
        trade.action == TradeAction.BuyToClose ||
        trade.action == TradeAction.SellToClose
      ) {
        position.openQuantity -= Math.abs(trade.quantity);
        position.closedQuantity += Math.abs(trade.quantity);
      }
      position.currentPrice = trade.fillPrice;
    } else if (position.tradeType == TradeType.Cash) {
      position.averagePrice += trade.fillPrice;
      position.currentPrice = position.averagePrice;
    }

    if (position.openQuantity == 0) {
      position.status = PositionStatus.Closed;
      position.exitDate = trade.purchaseDate;
    } else {
      position.status = PositionStatus.Open;
      position.exitDate = null;
    }

    position.tradeIds.push(tradeDocument.$key);
    position.fees += trade.fee;

    this.updateUserPortfolioUpdatedDate();
    return this.update(positionDocument);
  }

  removeTradeFromPosition(
    positionDocument: IPositionDocument,
    tradeDocument: ITradeDocument
  ): Promise<void> {
    const position = positionDocument.position;
    const trade = tradeDocument.trade;
    console.log('removeTradeFromPosition', position);
    if (
      position.tradeType == TradeType.Stock ||
      position.tradeType == TradeType.Option
    ) {
      if (
        trade.action == TradeAction.BuyToOpen ||
        trade.action == TradeAction.SellToOpen
      ) {
        const positionTotalQuantity =
          position.openQuantity + position.closedQuantity;
        const newAveragePrice =
          (position.averagePrice * positionTotalQuantity -
            trade.fillPrice * Math.abs(trade.quantity)) /
          (positionTotalQuantity - Math.abs(trade.quantity));
        position.averagePrice = !isNaN(newAveragePrice)
          ? newAveragePrice
          : position.averagePrice;
        position.openQuantity -= Math.abs(trade.quantity);
      } else if (
        trade.action == TradeAction.BuyToClose ||
        trade.action == TradeAction.SellToClose
      ) {
        position.openQuantity += Math.abs(trade.quantity);
        position.closedQuantity -= Math.abs(trade.quantity);
      }
      position.currentPrice = trade.fillPrice;
    } else if (position.tradeType == TradeType.Cash) {
      position.averagePrice -= trade.fillPrice;
      position.currentPrice = position.averagePrice;
    }

    if (position.openQuantity == 0) {
      position.status = PositionStatus.Closed;
      position.exitDate = trade.purchaseDate;
    } else {
      position.status = PositionStatus.Open;
      position.exitDate = null;
    }

    position.tradeIds.splice(
      position.tradeIds.indexOf(tradeDocument.$key, 0),
      1
    );
    position.fees -= trade.fee;

    this.updateUserPortfolioUpdatedDate();
    return this.update(positionDocument);
  }

  createNewIPosition(tradeDocument: ITradeDocument): IPosition {
    const trade = tradeDocument.trade;
    const newPosition: IPosition = {
      symbol: trade.symbol,
      tradeType: trade.tradeType,
      optionType: trade.optionType,
      expiryDate: trade.expiryDate,
      strikePrice: trade.strikePrice,
      openQuantity: trade.quantity,
      closedQuantity: 0,
      averagePrice: trade.fillPrice,
      currentPrice: trade.fillPrice,
      entryDate: trade.purchaseDate,
      exitDate: null,
      status: PositionStatus.Open,
      tradeIds: [tradeDocument.$key],
      fees: trade.fee,
      postedDate: Timestamp.now()
    };
    console.log('createNewIPosition', newPosition);

    return newPosition;
  }

  async add(position: IPosition): Promise<void> {
    const ref = await this.positionsCollection.add(position);
    this.updateUserPortfolioUpdatedDate();
  }

  update(positionDocument: IPositionDocument): Promise<void> {
    return this.positionsCollection
      .doc(positionDocument.$key)
      .update({ ...positionDocument.position });
  }

  private updateUserPortfolioUpdatedDate() {
    this.authService.myUser$
      .pipe(
        tap(myUser => {
          myUser.portfolioUpdatedDate = Timestamp.now();
          this.authService.updateMyUserInfo(myUser);
        })
      )
      .subscribe();
  }
}
