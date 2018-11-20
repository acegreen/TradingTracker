import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Observable } from 'rxjs';
import { TradeService, ITradeDocument } from '../services/trade.service';
import {
  ITrade,
  TradeType,
  TradeAction,
  Trade,
  OptionType
} from 'app/models/trade';
import 'bootstrap-datepicker';
import { FormGroup, FormControl, Validators, NgForm } from '@angular/forms';
import * as moment from 'moment';
import { firestore } from 'firebase';
import Timestamp = firestore.Timestamp;
import { Papa } from 'ngx-papaparse';

declare var $: any;

@Component({
  selector: 'trades-cmp',
  moduleId: module.id,
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.css']
})
export class TradeComponent implements OnInit, AfterViewChecked {
  tradeTypeOptions = [TradeType.Stock, TradeType.Option, TradeType.Cash];
  optionTypeOptions = [OptionType.Call, OptionType.Put];
  allTradeActionOptions = [
    [
      TradeAction.BuyToOpen,
      TradeAction.BuyToClose,
      TradeAction.SellToOpen,
      TradeAction.SellToClose
    ],
    [
      TradeAction.BuyToOpen,
      TradeAction.BuyToClose,
      TradeAction.SellToOpen,
      TradeAction.SellToClose
    ],
    [TradeAction.Deposit, TradeAction.Withdraw]
  ];
  tradeActionOptions = [
    TradeAction.BuyToOpen,
    TradeAction.BuyToClose,
    TradeAction.SellToOpen,
    TradeAction.SellToClose
  ];

  headers = [
    'Symbol',
    'Type',
    'Option',
    'Option Expiry',
    'Option Strike',
    'Quantity',
    'Fill Price',
    'Trade Value',
    'Action',
    'Date',
    'Fee',
    'Action'
  ];

  tradeDocuments$: Observable<ITradeDocument[]>;
  addTradeForm: FormGroup;
  symbol: FormControl;
  tradeType: FormControl;
  optionType: FormControl;
  expiryDate: FormControl;
  strikePrice: FormControl;
  quantity: FormControl;
  action: FormControl;
  fillPrice: FormControl;
  date: FormControl;
  fee: FormControl;

  editingTrade: ITradeDocument;

  constructor(private tradeService: TradeService, private papa: Papa) {
    this.tradeDocuments$ = tradeService.tradeDocuments$;
  }

  ngOnInit() {
    this.createFormControls();
    this.createForm();
  }

  ngAfterViewChecked() {
    // Jquery functionality
    var that = this;
    const expiryDatePicker: any = $('#expiryDatePicker .input-group.date');
    expiryDatePicker.datepicker({
      language: 'en',
      format: 'mm/dd/yyyy',
      orientation: 'bottom auto',
      // immediateUpdates: "true",
      autoclose: 'true',
      todayHighlight: 'true'
    });
    expiryDatePicker.datepicker().on('changeDate', function(e) {
      that.expiryDate.setValue(moment(e.date).format('MM/DD/YYYY'));
    });

    const tradeDatePicker: any = $('#tradeDatePicker .input-group.date');
    tradeDatePicker.datepicker({
      language: 'en',
      format: 'mm/dd/yyyy',
      orientation: 'bottom auto',
      // immediateUpdates: "true",
      autoclose: 'true',
      todayHighlight: 'true'
    });
    tradeDatePicker.datepicker().on('changeDate', function(e) {
      that.date.setValue(moment(e.date).format('MM/DD/YYYY'));
    });
  }

  private createFormControls() {
    this.symbol = new FormControl('', [
      Validators.required,
      Validators.pattern('[A-Za-z]{1,5}')
    ]);
    this.tradeType = new FormControl('', [Validators.required]);
    this.optionType = new FormControl('', [Validators.required]);
    this.expiryDate = new FormControl('', [Validators.required]);
    this.strikePrice = new FormControl('', [
      Validators.required,
      Validators.pattern('^[0-9]+(.[0-9]{1,4})?$')
    ]);
    this.quantity = new FormControl('', [
      Validators.required,
      Validators.pattern('^[0-9]+(.[0-9]{1,4})?$')
    ]);
    this.action = new FormControl('', [Validators.required]);
    this.fillPrice = new FormControl('', [
      Validators.required,
      Validators.pattern('^-?[[0-9]+(.[0-9]{1,4})?$')
    ]);
    this.date = new FormControl('', [Validators.required]);
    this.fee = new FormControl('', [
      Validators.required,
      Validators.pattern('^-?[[0-9]+(.[0-9]{1,4})?$')
    ]);
  }

  private createForm() {
    this.addTradeForm = new FormGroup({
      symbol: this.symbol,
      tradeType: this.tradeType,
      quantity: this.quantity,
      action: this.action,
      fillPrice: this.fillPrice,
      date: this.date,
      fee: this.fee
    });
  }

  private updateFormControls() {
    if (this.tradeType.value == TradeType.Option) {
      this.addTradeForm.addControl('symbol', this.symbol);
      this.addTradeForm.addControl('quantity', this.quantity);
      this.addTradeForm.addControl('optionType', this.optionType);
      this.addTradeForm.addControl('expiryDate', this.expiryDate);
      this.addTradeForm.addControl('strikePrice', this.strikePrice);
    } else if (this.tradeType.value == TradeType.Stock) {
      this.addTradeForm.addControl('symbol', this.symbol);
      this.addTradeForm.addControl('quantity', this.quantity);
      this.addTradeForm.removeControl('optionType');
      this.addTradeForm.removeControl('expiryDate');
      this.addTradeForm.removeControl('strikePrice');
    } else if (this.tradeType.value == TradeType.Cash) {
      this.addTradeForm.removeControl('symbol');
      this.addTradeForm.removeControl('quantity');
      this.addTradeForm.removeControl('optionType');
      this.addTradeForm.removeControl('expiryDate');
      this.addTradeForm.removeControl('strikePrice');
    }
  }

  onAddTradeTypeChange(input: HTMLSelectElement) {
    this.tradeActionOptions = this.allTradeActionOptions[input.selectedIndex];
    this.action.setValue(this.tradeActionOptions[0]);
    this.updateFormControls();
  }

  onAddTradeFormSubmit(ngForm) {
    if (!this.addTradeForm.valid) {
      this.showNotification(
        'Some fields are missing inputs',
        'danger',
        'top',
        'center'
      );
      return;
    } else {
      if (this.editingTrade) {
        this.updateTrade().then(() => {
          this.showNotification(
            'Your trade has been edited',
            'success',
            'top',
            'center'
          );
        });
      } else {
        this.addTrade().then(() => {
          this.showNotification(
            'Your trade has been added',
            'success',
            'top',
            'center'
          );
        });
      }

      $('#addTradeModal').modal('hide');
      this.resetForm(ngForm);
    }
  }

  onBatchUploadFileSelect(input: HTMLInputElement) {
    let options = {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results, file) => {
        const data = results.data;
        this.verifyAndPushTrades(data as ITrade[]);
        input.value = '';
      }
    };

    this.papa.parse(input.files[0], options);
  }

  private addTrade(): Promise<void> {
    const newTrade = this.createTradeFromForm();
    return this.tradeService.add(newTrade);
  }

  private updateTrade(): Promise<void> {
    const updatedTrade = this.createTradeFromForm();

    const oldTradeDocument = this.editingTrade;
    const newTradeDocument = { ...this.editingTrade };
    newTradeDocument.trade = new Trade(updatedTrade);
    return this.tradeService.update(oldTradeDocument, newTradeDocument);
  }

  private deleteTrade(tradeDocument: ITradeDocument): Promise<void> {
    return this.tradeService.delete(tradeDocument);
  }

  private prefillEditTrade(tradeDocument: ITradeDocument) {
    this.editingTrade = tradeDocument;
    const trade = tradeDocument.trade;
    this.tradeActionOptions = this.allTradeActionOptions[
      this.tradeTypeOptions.indexOf(trade.tradeType)
    ];

    if (trade.tradeType == TradeType.Option) {
      this.symbol.setValue(trade.symbol);
      this.tradeType.setValue(trade.tradeType);
      this.optionType.setValue(trade.optionType);
      this.expiryDate.setValue(
        moment(trade.expiryDate.toDate()).format('MM/DD/YYYY')
      );
      this.strikePrice.setValue(trade.strikePrice);
      this.quantity.setValue(trade.quantity);
      this.action.setValue(trade.action);
      this.fillPrice.setValue(trade.fillPrice);
      this.fee.setValue(trade.fee);
      this.date.setValue(
        moment(trade.purchaseDate.toDate()).format('MM/DD/YYYY')
      );
    } else if (trade.tradeType == TradeType.Stock) {
      this.symbol.setValue(trade.symbol);
      this.tradeType.setValue(trade.tradeType);
      this.quantity.setValue(trade.quantity);
      this.action.setValue(trade.action);
      this.fillPrice.setValue(trade.fillPrice);
      this.fee.setValue(trade.fee);
      this.date.setValue(
        moment(trade.purchaseDate.toDate()).format('MM/DD/YYYY')
      );
    } else if (trade.tradeType == TradeType.Cash) {
      this.tradeType.setValue(trade.tradeType);
      this.quantity.setValue(trade.quantity);
      this.action.setValue(trade.action);
      this.fillPrice.setValue(trade.fillPrice);
      this.fee.setValue(trade.fee);
      this.date.setValue(
        moment(trade.purchaseDate.toDate()).format('MM/DD/YYYY')
      );
    }
    this.updateFormControls();
  }

  private createTradeFromForm(): ITrade {
    return {
      symbol: this.addTradeForm.get('symbol')
        ? this.addTradeForm.controls.symbol.value.toUpperCase()
        : null,
      tradeType: this.addTradeForm.controls.tradeType.value,
      optionType: this.addTradeForm.get('optionType')
        ? this.addTradeForm.controls.optionType.value
        : null,
      expiryDate: this.addTradeForm.get('expiryDate')
        ? Timestamp.fromDate(
            new Date(this.addTradeForm.controls.expiryDate.value)
          )
        : null,
      strikePrice: this.addTradeForm.get('strikePrice')
        ? this.addTradeForm.controls.strikePrice.value
        : null,
      quantity: this.addTradeForm.get('quantity')
        ? this.addTradeForm.controls.quantity.value
        : 1,
      action: this.addTradeForm.get('action')
        ? this.addTradeForm.controls.action.value
        : null,
      fillPrice: this.addTradeForm.controls.fillPrice.value,
      fee: this.addTradeForm.controls.fee.value,
      purchaseDate: Timestamp.fromDate(
        new Date(this.addTradeForm.controls.date.value)
      ),
      postedDate: Timestamp.fromDate(new Date())
    };
  }

  private verifyAndPushTrades(trades: ITrade[]) {
    trades.forEach(trade => {
      // trade.expiryDate = Timestamp.fromDate()
      if (
        trade.tradeType === TradeType.Stock &&
        typeof trade.symbol === 'string' &&
        (Object as any).values(TradeType).includes(trade.tradeType) &&
        typeof trade.quantity === 'number' &&
        (Object as any).values(TradeAction).includes(trade.action) &&
        typeof trade.fillPrice === 'number' &&
        typeof trade.fee === 'number' &&
        new Date(trade.purchaseDate as any)
      ) {
        this.patchTrade(trade);
        this.tradeService.add(trade);
      } else if (
        trade.tradeType === TradeType.Option &&
        typeof trade.symbol === 'string' &&
        (Object as any).values(TradeType).includes(trade.tradeType) &&
        new Date(trade.expiryDate as any) &&
        typeof trade.strikePrice === 'number' &&
        typeof trade.quantity === 'number' &&
        (Object as any).values(TradeAction).includes(trade.action) &&
        typeof trade.fillPrice === 'number' &&
        typeof trade.fee === 'number' &&
        new Date(trade.purchaseDate as any)
      ) {
        this.patchTrade(trade);
        this.tradeService.add(trade);
      } else if (
        trade.tradeType === TradeType.Cash &&
        (Object as any).values(TradeType).includes(trade.tradeType) &&
        typeof trade.quantity === 'number' &&
        (Object as any).values(TradeAction).includes(trade.action) &&
        typeof trade.fillPrice === 'number' &&
        typeof trade.fee === 'number' &&
        new Date(trade.purchaseDate as any)
      ) {
        this.patchTrade(trade);
        this.tradeService.add(trade);
      } else {
        this.showNotification(
          'Some trades may have not been added correctly',
          'danger',
          'top',
          'center'
        );
      }
    });
  }

  private patchTrade(trade: ITrade) {
    if (trade.expiryDate != null) {
      trade.expiryDate = Timestamp.fromDate(new Date(trade.expiryDate as any));
    }
    trade.purchaseDate = Timestamp.fromDate(
      new Date(trade.purchaseDate as any)
    );
    trade.postedDate = Timestamp.now();
  }

  private formatAsCurrencyWithTwoDecimal(value, decimalPoints): string {
    return Trade.formatAsCurrencyWithTwoDecimal(value, decimalPoints);
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

  private userReadableActionString(action: string | null): string {
    return Trade.userReadableActionString(action);
  }

  private userReadableDateString(date): string {
    return Trade.userReadableDateString(date);
  }

  resetForm(ngForm: NgForm) {
    if (ngForm) {
      // setTimeout(() => ngForm.resetForm(), 0);
      ngForm.resetForm();
    }
    this.addTradeForm.reset();
    this.tradeType.setValue(this.tradeTypeOptions[0]);
    this.action.setValue(this.tradeActionOptions[0]);

    // make as not editing trade as default
    this.editingTrade = null;
  }

  private showNotification(message, type, from, align) {
    $.notify(
      { icon: 'ti-bell', message: message },
      { type: type, timer: 250, placement: { from: from, align: align } }
    );
  }
}
