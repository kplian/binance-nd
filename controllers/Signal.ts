/**
 * Kplian Ltda 2020
 *
 * MIT
 *
 * Person Controller
 *
 * @summary Person Controller
 * @author Jaime Rivera
 *
 * Created at     : 2020-09-17 18:55:38
 * Last modified  : 2020-11-02 11:58:05
 */
import { EntityManager, getManager, In } from 'typeorm';
import { Controller, Post, DbSettings, ReadOnly, Authentication, PxpError, __, Log } from '../../../lib/pxp';
import SignalModel from '../entity/Signal';
import TraderModel from '../entity/Trader';
import SymbolModel from '../entity/Symbol';
import axios, { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import TraderSignal from '../entity/TraderSignal';
const Binance = require('node-binance-api');



class Signal extends Controller {
  @Post()  
  @ReadOnly(false)
  @Authentication(true)  
  @Log(false)
  async add(params: Record<string, unknown>, manager: EntityManager): Promise<any> {
    const  existing = await __(SignalModel.findOne({ where: { foreignId: params.foreignId as number, signalChannel: params.signalChannel } }));
    if (!existing) {
        let markPrice = 0;
        const message = params.message as string;
        let messageRead = this.initMessageRead();
        if (params.signalChannel == 'easy_crypto') {
            messageRead = this.easyCryptoRead(message);
        }
        
        
        let status = 'not_identified';
        
        if (messageRead.symbol) {
            status = 'open';            
            markPrice = await __(this.binanceGetMarkPrice(messageRead.symbol as string));            
            messageRead = this.addLeadingZeros(messageRead, markPrice);
            status = this.validateData(messageRead, markPrice);
        }

        //check duplicates
        const duplicatesCount = await manager.query(` SELECT count(*) 
                                                      FROM tbin_signal 
                                                      WHERE symbol = '${messageRead.symbol}' and created_at::date = now()::date and status in ('open', 'closed')`);

        if (duplicatesCount[0].count != '0') {
          status = 'duplicate'; 
        }              
            
        const s = new SignalModel();
        s.broker = messageRead.broker as string;
        s.message = params.message as string;
        s.signalChannel = params.signalChannel as string;
        s.foreignId = params.foreignId as number;
        s.buySell = messageRead.buySell as string;
        s.entryPrice = messageRead.entryPrice as number;
        s.leverage = messageRead.leverage as string;
        s.symbol = messageRead.symbol as string;
        s.stopLoss = messageRead.stopLoss as number;
        s.tp1 = messageRead.tp1 as number;
        s.tp2 = messageRead.tp2 as number;
        s.tp3 = messageRead.tp3 as number;
        s.tp4 = messageRead.tp4 as number;  
        s.tp5 = messageRead.tp5 as number;   
        s.status = status;    
        s.markPriceOpen = markPrice;
        const sResult = await __(manager.save(s));
        

        if (status == 'open') {
          await __(this.binanceOpenSignal(messageRead, markPrice, sResult, manager));
          console.log('here we should open a position');
        }
        
        return {...sResult, ...{ new: true }};
    }
    return {...existing, ...{ new: false }};   
    
  }

  @Post()  
  @ReadOnly(false)
  @Authentication(true) 
  @Log(false) 
  async checkSignals(params: Record<string, unknown>, manager: EntityManager): Promise<any> {
    
    const  openSignals = await __(SignalModel.find({
      status:In(["open"])
    })); 
    
    for (const signal of openSignals) {
      
      const markPrice = await __(this.binanceGetMarkPrice(signal.symbol as string));

      const  symbol = await __(SymbolModel.findOne({
        code: signal.symbol
      })); 
      let completed = 0;
      for (const traderSignal of signal.traderSignals) {
        if (traderSignal.status == 'PENDING') {
          if (!traderSignal.brokerId) {
            traderSignal.status = 'ERROR';
            const sResult = await __(manager.save(traderSignal));
          } else {
            const binance = this.initBinance(traderSignal.trader);        
            const res = await binance.futuresOrderStatus( signal.symbol, {orderId: traderSignal.brokerId} );
            
            if (['CANCELED', 'FILLED', 'EXPIRED'].includes(res.status)) {
              completed++;
              traderSignal.status = res.status;
              const sResult = await __(manager.save(traderSignal));
              if (res.status == 'FILLED') {              
                await this.applyStrategy(traderSignal, symbol, signal, res, binance, manager);
              }
            }
          }
          
        }
        
      }
      if (completed == signal.traderSignals.length) {
        signal.status = 'closed'
        const sResult = await __(manager.save(signal));
      }
    }
    return {message: 'success'};
       
  }

  async binanceGetMarkPrice(symbol: string): Promise<number>{    
    const response = await __(axios.get(
        process.env.BINANCE_URL + '/fapi/v1/premiumIndex?symbol=' +  symbol.replace('/', ''),
        {           
            headers: { 
                'Content-Type': 'application/json'
              }
        }));
    
    
    return response.data.markPrice;

  }

  initBinance(trader:TraderModel):any {
    const apiSecret = process.env.NODE_ENV == 'development' ? trader.testApiSecret: trader.apiSecret;
    const apiKey = process.env.NODE_ENV == 'development' ? trader.testApiId: trader.apiId;
    const binance = new Binance().options({
          APIKEY: apiKey,
          APISECRET: apiSecret,
          test: process.env.NODE_ENV == 'development' ? true : false
    });
    return binance;    
  }

  async checkServerTime(): Promise<number>{    
    const response = await __(axios.get(
        process.env.BINANCE_URL + '/fapi/v1/time',
        {           
            headers: { 
                'Content-Type': 'application/json'
              }
        }));
    
    
    return response.data.serverTime;

  }

  async getBalance(binance: any): Promise<number>{    
    const response = await binance.futuresBalance();
    console.log(response);
    console.log('response', response);
    let balanceUsdt = 0;
    response.forEach((account:any) => {
      if (account.asset == 'USDT') {
        balanceUsdt = account.balance;
      }
    });   
    return balanceUsdt as number;
  }

  async binanceOpenSignal(message: Record<string, unknown>, markPrice: number, signal: SignalModel, manager: EntityManager): Promise<number>{
    const  traders = await __(TraderModel.find({
      status: 'active'
    }));         
    const  symbol = await __(SymbolModel.findOne({
      code: message.symbol as string
    }));  
    for (const trader of traders) {      

      const binance = this.initBinance(trader);      
      const balance = await this.getBalance(binance);
      if (balance > 0) {
        const leverage = 6;/*(message.leverage as string).substring(0,2)*/
        const usdtToSpend = balance * 0.15 * leverage;        
        const exponent = Math.pow(10, symbol.quantityPrecision)
        const quantity = Math.round(usdtToSpend / (message.entryPrice as number) * exponent) / exponent;
        const d = new Date();
        const ts = d.getTime();  
          
        
        console.info( await binance.futuresLeverage( message.symbol, leverage) );
        console.info( await binance.futuresMarginType( message.symbol, 'ISOLATED' ) );
        let res;
        if (message.buySell == 'BUY') {
          res = await binance.futuresMarketBuy( message.symbol, quantity, {workingType: 'MARK_PRICE', type: 'STOP_MARKET', stopPrice: message.entryPrice});
        } else {
          res = await binance.futuresMarketSell( message.symbol, quantity, {workingType: 'MARK_PRICE', type: 'STOP_MARKET', stopPrice: message.entryPrice});
        }
        console.log(message.symbol, quantity, message.entryPrice);
        console.log(res);
        const td = new TraderSignal();
        td.signal = signal;
        td.trader = trader;
        td.brokerId = res.orderId;
        td.status = quantity == 0 ? 'LOW_QUANTITY' : 'PENDING';
        td.strategy = trader.strategy;   
        const sResult = await __(manager.save(td));           
       
      }   
    }  
    return 1;
  }  

  easyCryptoRead(message:string): Record<string, unknown> {
    const messageArray = message.split("\n");
    const resObject : Record<string, unknown> = this.initMessageRead();
    if (messageArray.length > 1 && messageArray[1].includes("Pending")) {
        resObject.broker = 'binance_futures' as string;
        if (messageArray[1].includes("BUY")) {
            resObject.buySell = 'BUY' as string;
        } else {
            resObject.buySell = 'SELL' as string;
        }        
        resObject.symbol = messageArray[0].slice(0, -2).replace('/', '').trim();
        resObject.entryPrice = messageArray[1].split(' ')[2];
        resObject.tp1 = messageArray[3].split('-')[1].trim();
        resObject.tp2 = messageArray[4].split('-')[1].trim();
        resObject.tp3 = messageArray[5].split('-')[1].trim();
        resObject.stopLoss = messageArray[6].slice(5);
        resObject.leverage = messageArray[8].slice(11);
    }  
    
    return resObject;
  }
  initMessageRead (): Record<string, unknown> {
    return {
        broker: null,
        buySell:null,
        entryPrice:null,
        stopLoss:null,
        leverage:null,
        symbol:null,
        tp1:null,
        tp2:null,
        tp3:null,
        tp4:null,
        tp5:null,
    };
  }

  addLeadingZeros (message: Record<string, unknown>, price: number): Record<string, unknown> {
    const res = message;
    let priceString = price.toString();
    if (priceString.startsWith('0.') && !(message.entryPrice as string).includes(".")) {
        priceString = priceString.replace('0.', '');
        const count = (priceString.match(/^0+/) || [''])[0].length;

        let stringToAdd = '0.' + priceString.substr(0, count);        
        res.entryPrice = parseFloat(stringToAdd + (message.entryPrice as number).toString());
        res.tp1 = parseFloat(stringToAdd + (message.tp1 as number).toString());
        res.tp2 = parseFloat(stringToAdd + (message.tp2 as number).toString());
        res.tp3 = parseFloat(stringToAdd + (message.tp3 as number).toString());
        //res.tp4 = parseFloat(stringToAdd + (message.tp4 as number).toString());
        //res.tp5 = parseFloat(stringToAdd + (message.tp5 as number).toString());
        res.stopLoss = parseFloat(stringToAdd + (message.stopLoss as number).toString());

    }
    return res;


  }
  validateData(message: Record<string, unknown>, markPrice: number):string {
    let status = 'open';
    if (message.tp1) {
      if ((message.tp1 as number) < markPrice && message.buySell == 'BUY') {
        status = 'incongruent_datatp1';      }

      if ((message.tp1 as number) > markPrice && message.buySell == 'SELL') {
        status = 'incongruent_datatp1';
      }
      if ((message.tp1 as number) > (markPrice * 2) && message.buySell == 'BUY') {
        status = 'incongruent_datatp1';
      }
      if ((message.tp1 as number) < (markPrice * 0.6) && message.buySell == 'SELL') {
        status = 'incongruent_datatp1';
      }
    }

    if (message.tp2) {
      if ((message.tp2 as number) < markPrice && message.buySell == 'BUY') {
        status = 'incongruent_datatp2';      }

      if ((message.tp2 as number) > markPrice && message.buySell == 'SELL') {
        status = 'incongruent_datatp2';
      }
      if ((message.tp2 as number) > (markPrice * 2) && message.buySell == 'BUY') {
        status = 'incongruent_datatp2';
      }
      if ((message.tp2 as number) < (markPrice * 0.6) && message.buySell == 'SELL') {
        status = 'incongruent_datatp2';
      }
    }

    if (message.tp3) {
      if ((message.t3 as number) < markPrice && message.buySell == 'BUY') {
        status = 'incongruent_datatp3';      }

      if ((message.tp3 as number) > markPrice && message.buySell == 'SELL') {
        status = 'incongruent_datatp3';
      }
      if ((message.tp3 as number) > (markPrice * 2) && message.buySell == 'BUY') {
        status = 'incongruent_datatp3';
      }
      if ((message.tp3 as number) < (markPrice * 0.6) && message.buySell == 'SELL') {
        status = 'incongruent_datatp3';
      }
    }

    if (message.tp4) {
      if ((message.t4 as number) < markPrice && message.buySell == 'BUY') {
        status = 'incongruent_data';      }

      if ((message.tp4 as number) > markPrice && message.buySell == 'SELL') {
        status = 'incongruent_data';
      }
      if ((message.tp4 as number) > (markPrice * 2) && message.buySell == 'BUY') {
        status = 'incongruent_data';
      }
      if ((message.tp4 as number) < (markPrice * 0.6) && message.buySell == 'SELL') {
        status = 'incongruent_data';
      }
    }

    if (message.tp5) {
      if ((message.t5 as number) < markPrice && message.buySell == 'BUY') {
        status = 'incongruent_data';      }

      if ((message.tp5 as number) > markPrice && message.buySell == 'SELL') {
        status = 'incongruent_data';
      }
      if ((message.tp5 as number) > (markPrice * 2) && message.buySell == 'BUY') {
        status = 'incongruent_data';
      }
      if ((message.tp5 as number) < (markPrice * 0.6) && message.buySell == 'SELL') {
        status = 'incongruent_data';
      }
    }

    if (message.stopLoss) {
      if ((message.stopLoss as number) > (message.tp1 as number) && message.buySell == 'BUY') {
        status = 'incongruent_datasl';
      }
      if ((message.stopLoss as number) < (message.tp1 as number) && message.buySell == 'SELL') {
        status = 'incongruent_datasl';
      }
      
      if ((message.stopLoss as number) < (markPrice * 0.6) && message.buySell == 'BUY') {
        status = 'incongruent_datasl';
      }

      if ((message.stopLoss as number) > (markPrice * 2) && message.buySell == 'SELL') {
        status = 'incongruent_datasl';
      }
    }
    
    if (message.entryPrice) {      
      if ((message.entryPrice as number) < markPrice && message.buySell == 'BUY') {        
        status = 'late_signal';
      }
      if ((message.entryPrice as number) > markPrice && message.buySell == 'SELL') {
        status = 'late_signal';
      }

      if ((message.entryPrice as number) > (markPrice * 2) && message.buySell == 'BUY') {        
        status = 'incongruent_dataep';
      }
      if ((message.entryPrice as number) < (markPrice * 0.6) && message.buySell == 'SELL') {
        status = 'incongruent_dataep';
      }
    }
    
    return status;
  }
  async applyStrategy(trader: TraderModel, symbol: SymbolModel , signal: SignalModel, order: any, binance: any,  manager: EntityManager): Promise<string>{    
    // E1 creates a trailing stop loss between tp1 and tp2
    if (trader.strategy == 'E1') {
      let res;
      
      if (signal.buySell == 'BUY') {
        console.log('before', symbol);
        const activatePrice = this.myRound(((signal.tp2 - signal.tp1) / 2 as number) + Number(signal.tp1), symbol.pricePrecision);
        res = await binance.futuresMarketSell( signal.symbol, order.executedQty, {workingType: 'MARK_PRICE', type: 'TRAILING_STOP_MARKET', activationPrice: activatePrice, priceProtect: true, callbackRate: 1, reduceOnly: true});
        
      } else {
        const activatePrice = this.myRound(((signal.tp1 - signal.tp2) / 2) + Number(signal.tp2), symbol.pricePrecision);
        res = await binance.futuresMarketBuy( signal.symbol, order.executedQty, {workingType: 'MARK_PRICE', type: 'TRAILING_STOP_MARKET', activationPrice: activatePrice, priceProtect: true, callbackRate: 1, reduceOnly: true});
      }      
    }
    return 'exito'; 
  }
  myRound(x:number, decimals: number) : number {
    console.log('decimals', decimals);
    const exponent = Math.pow(10, decimals)
    const res = Math.round(x * exponent) / exponent;
    return res;
  }
}

export default Signal;
