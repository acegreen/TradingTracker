import { Observable, Subscription } from 'rxjs';
import { map, tap, take, filter, flatMap, first } from 'rxjs/operators';
import { Trade, ITrade } from 'app/models/trade';
import {
  AngularFirestore,
  AngularFirestoreCollection
} from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { PortfolioService, IPositionDocument } from './portfolio.service';

import * as _ from 'lodash';
import { IPosition, Position, PositionStatus } from 'app/models/position';

export interface ITradeDocument {
  $key: string;
  trade: Trade;
}

@Injectable({
  providedIn: 'root'
})
export class TradeService {
  private tradesCollection: AngularFirestoreCollection<ITrade>;
  tradeDocuments$: Observable<ITradeDocument[]>;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private portfolioService: PortfolioService
  ) {
    this.tradesCollection = firestore.collection<ITrade>(
      `users/${this.authService.userID}/trades`,
      ref => ref.orderBy('purchaseDate', 'desc')
    );
    this.listenToTradesChanges();
  }

  private listenToTradesChanges() {
    this.tradeDocuments$ = this.tradesCollection.snapshotChanges().pipe(
      map(snapshots =>
        snapshots.map(snapshot => ({
          $key: snapshot.payload.doc.id,
          trade: new Trade(snapshot.payload.doc.data() as ITrade)
        }))
      )
    );
  }

  async add(trade: ITrade): Promise<void> {
    const ref = await this.tradesCollection.add(trade);
    const newITradeDocument: ITradeDocument = {
      $key: ref.id,
      trade: new Trade(trade)
    };
    await this.digestNewTrade(newITradeDocument);
  }

  async batchAdd(tradeDocuments: ITradeDocument[]): Promise<void> {
    // const batch = this.firestore.firestore.batch()

    const promises = tradeDocuments.map(tradeDocument => {
      const trade = tradeDocument.trade;
      return this.add(trade);
    });

    await Promise.all(promises);
  }

  update(
    oldTradeDocument: ITradeDocument,
    newTradeDocument: ITradeDocument
  ): Promise<void> {
    console.log(oldTradeDocument, newTradeDocument);
    return this.getPositionForTrade(oldTradeDocument)
      .pipe(
        flatMap(positionDocuments => positionDocuments),
        flatMap(async positionDocument => {
          await this.portfolioService.removeTradeFromPosition(
            positionDocument,
            oldTradeDocument
          );
          return await this.digestNewTrade(newTradeDocument).then(() =>
            this.tradesCollection
              .doc(newTradeDocument.$key)
              .update({ ...newTradeDocument.trade })
          );
        })
      )
      .toPromise();
  }

  delete(tradeDocument: ITradeDocument): Promise<void> {
    return this.getPositionForTrade(tradeDocument)
      .pipe(
        flatMap(positionDocuments => positionDocuments),
        flatMap(async positionDocument => {
          await this.portfolioService.removeTradeFromPosition(
            positionDocument,
            tradeDocument
          );
          return await this.tradesCollection.doc(tradeDocument.$key).delete();
        })
      )
      .toPromise();
  }

  private getPositionForTrade(
    tradeDocument: ITradeDocument
  ): Observable<IPositionDocument[]> {
    return this.firestore
      .collection<IPosition>(
        `users/${this.authService.userID}/positions`,
        ref => ref.where('tradeIds', 'array-contains', tradeDocument.$key)
      )
      .get()
      .pipe(
        take(1),
        map(snapshot =>
          snapshot.docs.map(doc => ({
            $key: doc.id,
            position: new Position(doc.data() as IPosition)
          }))
        )
      );
  }

  // MARK: Position

  private async digestNewTrade(tradeDocument: ITradeDocument): Promise<void> {
    console.log('digestNewTrade', tradeDocument);
    const trade = tradeDocument.trade;
    await this.firestore
      .collection<IPosition>(
        `users/${this.authService.userID}/positions`,
        ref =>
          ref
            .where('symbol', '==', trade.symbol)
            .where('tradeType', '==', trade.tradeType)
            .where('optionType', '==', trade.optionType)
            .where('expiryDate', '==', trade.expiryDate)
            .where('strikePrice', '==', trade.strikePrice)
            .where('status', '==', PositionStatus.Open)
      )
      .get()
      .pipe(
        take(1),
        map(snapshot =>
          snapshot.docs.map(doc => ({
            $key: doc.id,
            position: new Position(doc.data() as IPosition)
          }))
        ),
        map(positionDocuments => {
          if (!_.isEmpty(positionDocuments)) {
            console.log('existingPositionDocument', positionDocuments[0]);
            return this.portfolioService.addTradeToPosition(
              positionDocuments[0],
              tradeDocument
            );
          } else {
            const newIPosition = this.portfolioService.createNewIPosition(
              tradeDocument
            );
            return this.portfolioService.add(newIPosition);
          }
        })
      )
      .toPromise();
  }
}
