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
 * Last modified  : 2021-07-14 00:02:39
 */
import { EntityManager, getManager, In } from 'typeorm';
import { Controller, Post, DbSettings, ReadOnly, Authentication, PxpError, __, Log, Model } from '@pxp-nd/core';
import SignalModel from '../entity/Signal';
import TraderModel from '../entity/Trader';
import SymbolModel from '../entity/Symbol';
import axios, { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import TraderSignal from '../entity/TraderSignal';
import TraderChannel from '../entity/TraderChannel';
import { Common } from './../services/common';
const Binance = require('node-binance-api');


@Model('binance/Signal')

class Signal extends Controller {
  @Post()
  @ReadOnly(false)
  @Authentication(true)
  @Log(false)
  async add(params: Record<string, unknown>, manager: EntityManager): Promise<any> {
    const existing = await __(SignalModel.findOne({ where: { foreignId: params.foreignId as number, signalChannel: params.signalChannel } }));
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
                                                      WHERE symbol = '${messageRead.symbol}' and status in ('open', 'filled')`);

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

      return { ...sResult, ...{ new: true } };
    }
    return { ...existing, ...{ new: false } };

  }

  @Post()
  @ReadOnly(false)
  @Authentication(true)
  async addForm(params: Record<string, unknown>, manager: EntityManager): Promise<any> {

    let markPrice = 0;
    let status = 'not_identified';
    if (params.symbol) {
      status = 'open';
      markPrice = params.marketPrice ? params.marketPrice : await __(this.binanceGetMarkPrice(params.symbol as string));
      status = this.validateData(params, markPrice);
      if (params.status && status == 'open') {
        status = params.status as string;
      }
    }

    if (status != 'open' && status != 'filled') {
      throw new PxpError(400, 'this error happened:' + status);
    }

    //check duplicates
    const duplicatesCount = await manager.query(` SELECT count(*) 
                                                  FROM tbin_signal 
                                                  WHERE symbol = '${params.symbol}' and status in ('open', 'filled')`);

    if (duplicatesCount[0].count != '0') {
      status = 'duplicate signal';
    }

    const s = new SignalModel();
    s.broker = params.broker as string;
    s.message = '' as string;
    s.signalChannel = params.signalChannel as string;
    s.foreignId = 0 as number;
    s.buySell = params.buySell as string;
    s.entryPrice = (params.entryPrice || markPrice) as number;
    s.symbol = params.symbol as string;
    s.stopLoss = params.stopLoss as number;
    s.tp1 = params.tp1 as number;
    s.tp2 = params.tp2 as number;
    s.tp3 = params.tp3 as number;
    s.tp4 = params.tp4 as number;
    s.tp5 = params.tp5 as number;
    s.status = status;
    s.markPriceOpen = markPrice;
    const sResult = await __(manager.save(s));

    if (status == 'open' || status == 'filled') {
      await __(this.binanceOpenSignal(params, markPrice, sResult, manager));
      console.log('here we should open a position');
    }
    return sResult;


  }

  @Post()
  @ReadOnly(false)
  @Authentication(true)
  @Log(false)
  async checkSignals(params: Record<string, unknown>, manager: EntityManager): Promise<any> {

    const openSignals = await __(SignalModel.find({
      status: In(["open"])
    }));
    /*LOOP FOR STATUS OPEN SIGNALS*/
    for (const signal of openSignals) {

      const symbol = await __(SymbolModel.findOne({
        code: signal.symbol
      }));


      for (const traderSignal of signal.traderSignals) {
        if (traderSignal.status == 'PENDING') {
          if (!traderSignal.brokerId) {
            traderSignal.status = 'ERROR';
            const sResult = await __(manager.save(traderSignal));
          } else {
            const binance = this.initBinance(traderSignal.trader);
            const res = await binance.futuresOrderStatus(signal.symbol, { orderId: traderSignal.brokerId });

            if (['CANCELED', 'FILLED', 'EXPIRED'].includes(res.status)) {
              traderSignal.status = res.status;
              await __(manager.save(traderSignal));
              if (res.status == 'FILLED') {
                const resStrategy = await this.applyStrategyPost(traderSignal, symbol, signal, res, binance, manager);
                if (resStrategy.orderId) {
                  traderSignal.brokerId2 = resStrategy.orderId;
                  traderSignal.status2 = 'PENDING';
                } else {
                  traderSignal.status2 = 'ERROR';
                }
                await __(manager.save(traderSignal));
              }
            }
          }

        }
      }
      await this.checkSignalStatus(signal, 'filled', manager);
    }

    /*UPDATE ALL DEPENDENT STATUS*/
    const filledSignals = await __(SignalModel.find({
      status: In(["filled"])
    }));

    for (const signal of filledSignals) {
      for (const traderSignal of signal.traderSignals) {
        const binance = this.initBinance(traderSignal.trader);
        if (traderSignal.status2 == 'PENDING') {
          const res = await binance.futuresOrderStatus(signal.symbol, { orderId: traderSignal.brokerId2 });
          if (['CANCELED', 'FILLED', 'EXPIRED'].includes(res.status)) {
            traderSignal.status2 = res.status;
            await __(manager.save(traderSignal));
          }
        }
        if (traderSignal.status3 == 'PENDING') {
          const res = await binance.futuresOrderStatus(signal.symbol, { orderId: traderSignal.brokerId3 });
          if (['CANCELED', 'FILLED', 'EXPIRED'].includes(res.status)) {
            traderSignal.status3 = res.status;
            await __(manager.save(traderSignal));
          }
        }
        if (traderSignal.status4 == 'PENDING') {
          const res = await binance.futuresOrderStatus(signal.symbol, { orderId: traderSignal.brokerId4 });
          if (['CANCELED', 'FILLED', 'EXPIRED'].includes(res.status)) {
            traderSignal.status4 = res.status;
            await __(manager.save(traderSignal));
          }
        }

        if (traderSignal.status2 == 'FILLED' || traderSignal.status3 == 'FILLED' || traderSignal.status4 == 'FILLED') {

          if (traderSignal.status2 == 'PENDING') {
            const res = await binance.futuresCancel(signal.symbol, { orderId: traderSignal.brokerId2 });
          }
          if (traderSignal.status3 == 'PENDING') {
            const res = await binance.futuresCancel(signal.symbol, { orderId: traderSignal.brokerId3 });
          }
          if (traderSignal.status4 == 'PENDING') {
            const res = await binance.futuresCancel(signal.symbol, { orderId: traderSignal.brokerId4 });
          }
          traderSignal.status2 = traderSignal.status2 == 'PENDING' ? 'CANCELED' : traderSignal.status2;
          traderSignal.status3 = traderSignal.status3 == 'PENDING' ? 'CANCELED' : traderSignal.status3;
          traderSignal.status4 = traderSignal.status4 == 'PENDING' ? 'CANCELED' : traderSignal.status4;
          await __(manager.save(traderSignal));
        }
      }
      await this.checkSignalStatus(signal, 'closed', manager);
    }


    return { message: 'success' };

  }

  async binanceGetMarkPrice(symbol: string): Promise<number> {
    let common = new Common();
    const marketPrice = await common.binanceGetMarkPrice(symbol);
    return marketPrice;

  }

  async checkSignalStatus(signal: SignalModel, type: string, manager: EntityManager): Promise<string> {
    let query = '';
    if (type == 'filled') {
      query = `
        select count(*) 
        from tbin_trader_signal 
        where signal_id = ${signal.signalId} and status = 'PENDING'`;
    } else {
      query = `
      select count(*) 
      from tbin_trader_signal 
      where signal_id = ${signal.signalId} and (status2 = 'PENDING' or status3 = 'PENDING' or status4 = 'PENDING')`;
    }
    const resQuery = await getManager().query(query);

    if (resQuery[0]['count'] == '0') {
      signal.status = type;
      await __(manager.save(signal));

    }
    return 'exito';

  }

  initBinance(trader: TraderModel): any {
    const apiSecret = process.env.NODE_ENV == 'development' ? trader.testApiSecret : trader.apiSecret;
    const apiKey = process.env.NODE_ENV == 'development' ? trader.testApiId : trader.apiId;
    const binance = new Binance().options({
      APIKEY: apiKey,
      APISECRET: apiSecret,
      test: process.env.NODE_ENV == 'development' ? true : false
    });
    return binance;
  }

  async checkServerTime(): Promise<number> {
    const response = await __(axios.get(
      process.env.BINANCE_URL + '/fapi/v1/time',
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }));


    return response.data.serverTime;

  }

  async getBalance(broker: string, binance: any): Promise<any> {
    let response;
    if (broker == 'binance_futures') {
      response = await binance.futuresBalance();
    } else if (broker == 'binance_spot') {
      response = await binance.balance();
    }
    console.log(response);
    let balanceUsdt = {};
    response.forEach((account: any) => {
      if (account.asset == 'USDT') {
        balanceUsdt = account;
      }
    });
    return balanceUsdt;
  }

  async binanceOpenSignal(message: Record<string, unknown>, markPrice: number, signal: SignalModel, manager: EntityManager): Promise<number> {
    const tradersChannel = await __(TraderChannel.find({
      status: 'active',
      channel: signal.signalChannel,
      broker: signal.broker
    }));
    const symbol = await __(SymbolModel.findOne({
      code: message.symbol as string
    }));
    for (const traderChannel of tradersChannel) {

      const binance = this.initBinance(traderChannel.trader);
      const balance = await this.getBalance(traderChannel.broker, binance);
      const tradeAmount = traderChannel.trader.amountToTrade == 0 ? balance.balance * traderChannel.trader.percentageToTrade / 100 : traderChannel.trader.amountToTrade;
      console.log('gtradeamount', tradeAmount);
      let orderId = 'BALANCE';
      let quantity = 0;
      if (balance.availableBalance > tradeAmount && (tradeAmount * traderChannel.trader.leverage) > 5) {
        const usdtToSpend = tradeAmount * traderChannel.trader.leverage;
        const exponent = Math.pow(10, symbol.quantityPrecision)
        quantity = Math.round(usdtToSpend / (signal.entryPrice as number) * exponent) / exponent;
        const d = new Date();
        const ts = d.getTime();

        if (traderChannel.broker == 'binance_futures') {
          console.info(binance.futuresLeverage(message.symbol, traderChannel.trader.leverage));
          console.info(binance.futuresMarginType(message.symbol, traderChannel.trader.marginMode));
        }

        let res;
        if (quantity > 0) {
          res = await this.applyStrategyPre(traderChannel, message, quantity, binance, manager);
          if (res.orderId) {
            orderId = res.orderId;
          } else {
            orderId = 'ERROR';
            console.log('ERROR OPENING SIGNAL:', res);
          }
        }

      }
      let status = '';
      if (orderId == 'BALANCE') {
        status = 'NO_BALANCE';
      } else if (orderId == 'ERROR') {
        status = 'ERROR';
      } else if (quantity == 0) {
        status = 'LOW_QUANTITY';
      } else {
        status = 'PENDING';
      }
      const td = new TraderSignal();
      td.signal = signal;
      td.trader = traderChannel.trader;
      if (status == 'PENDING') {
        td.brokerId = orderId;
      }
      td.status = 'FILLED';
      td.strategy = traderChannel.strategy;
      const sResult = await __(manager.save(td));
    }
    return 1;
  }

  easyCryptoRead(message: string): Record<string, unknown> {
    const messageArray = message.split("\n");
    const resObject: Record<string, unknown> = this.initMessageRead();
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
  initMessageRead(): Record<string, unknown> {
    return {
      broker: null,
      buySell: null,
      entryPrice: null,
      stopLoss: null,
      leverage: null,
      symbol: null,
      tp1: null,
      tp2: null,
      tp3: null,
      tp4: null,
      tp5: null,
    };
  }

  addLeadingZeros(message: Record<string, unknown>, price: number): Record<string, unknown> {
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
  validateData(message: Record<string, unknown>, markPrice: number): string {
    let status = 'open';
    if (message.tp1) {
      if ((message.tp1 as number) < markPrice && message.buySell == 'BUY') {
        status = 'incongruent_datatp1';
      }

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
        status = 'incongruent_datatp2';
      }

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
        status = 'incongruent_datatp3';
      }

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
        status = 'incongruent_data';
      }

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
        status = 'incongruent_data';
      }

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
  async applyStrategyPost(trader: TraderSignal, symbol: SymbolModel, signal: SignalModel, order: any, binance: any, manager: EntityManager): Promise<any> {
    // E1 creates a trailing stop loss between tp1 and tp2
    let res;
    if (trader.strategy == 'kplian_fut_1') {


      if (signal.buySell == 'BUY') {
        console.log('before', symbol);
        const activatePrice = this.myRound(signal.entryPrice * 1.01, symbol.pricePrecision);
        res = await binance.futuresMarketSell(signal.symbol, order.executedQty, { workingType: 'MARK_PRICE', type: 'TRAILING_STOP_MARKET', activationPrice: activatePrice, priceProtect: true, callbackRate: 1, reduceOnly: true });

      } else {
        const activatePrice = this.myRound(signal.entryPrice * 0.99, symbol.pricePrecision);
        res = await binance.futuresMarketBuy(signal.symbol, order.executedQty, { workingType: 'MARK_PRICE', type: 'TRAILING_STOP_MARKET', activationPrice: activatePrice, priceProtect: true, callbackRate: 1, reduceOnly: true });
      }
    } else if (trader.strategy == 'easy_fut_1') {
      if (signal.buySell == 'BUY') {
        console.log('before', symbol);
        const activatePrice = this.myRound(((signal.tp2 - signal.tp1) / 2 as number) + Number(signal.tp1), symbol.pricePrecision);
        res = await binance.futuresMarketSell(signal.symbol, order.executedQty, { workingType: 'MARK_PRICE', type: 'TRAILING_STOP_MARKET', activationPrice: activatePrice, priceProtect: true, callbackRate: 1, reduceOnly: true });

      } else {
        const activatePrice = this.myRound(((signal.tp1 - signal.tp2) / 2) + Number(signal.tp2), symbol.pricePrecision);
        res = await binance.futuresMarketBuy(signal.symbol, order.executedQty, { workingType: 'MARK_PRICE', type: 'TRAILING_STOP_MARKET', activationPrice: activatePrice, priceProtect: true, callbackRate: 1, reduceOnly: true });
      }
    } else if (trader.strategy == 'kplian_fut_2') {
      if (signal.buySell == 'BUY') {
        const activatePrice = this.myRound(signal.entryPrice * 1.01, symbol.pricePrecision);
        res = await binance.futuresMarketSell(signal.symbol, order.executedQty, { workingType: 'MARK_PRICE', type: 'TAKE_PROFIT_MARKET', stopPrice: activatePrice, priceProtect: true, reduceOnly: true });

      } else {
        const activatePrice = this.myRound(signal.entryPrice * 0.99, symbol.pricePrecision);
        res = await binance.futuresMarketBuy(signal.symbol, order.executedQty, { workingType: 'MARK_PRICE', type: 'TAKE_PROFIT_MARKET', stopPrice: activatePrice, priceProtect: true, reduceOnly: true });
      }
    }/* else if (trader.strategy == 'kplian_fut_alert_1') {
      if (signal.buySell == 'BUY') {        
        const activatePrice = this.myRound(signal.entryPrice * 1.015, symbol.pricePrecision);
        res = await binance.futuresMarketSell( signal.symbol, order.executedQty, {workingType: 'MARK_PRICE', type: 'TAKE_PROFIT_MARKET', stopPrice: activatePrice, priceProtect: true, reduceOnly: true});

      } else {
        const activatePrice = this.myRound(signal.entryPrice * 0.985, symbol.pricePrecision);
        res = await binance.futuresMarketBuy( signal.symbol, order.executedQty, {workingType: 'MARK_PRICE', type: 'TAKE_PROFIT_MARKET', stopPrice: activatePrice, priceProtect: true,  reduceOnly: true});
      }
    }*/
    return res;
  }

  async applyStrategyPre(trader: TraderChannel, message: Record<string, unknown>, quantity: number, binance: any, manager: EntityManager): Promise<any> {

    let res = {};
    // E1 create a market stop without sl and tf
    if (trader.strategy == 'easy_fut_1') {
      if (message.buySell == 'BUY') {
        res = await binance.futuresMarketBuy(message.symbol, quantity, { workingType: 'MARK_PRICE', type: 'STOP_MARKET', stopPrice: message.entryPrice });
      } else {
        res = await binance.futuresMarketSell(message.symbol, quantity, { workingType: 'MARK_PRICE', type: 'STOP_MARKET', stopPrice: message.entryPrice });
      }
    } else if (trader.strategy == 'kplian_fut_1' || trader.strategy == 'kplian_fut_2') {

      if (message.buySell == 'BUY') {
        res = await binance.futuresMarketBuy(message.symbol, quantity, { workingType: 'MARK_PRICE', type: 'STOP_MARKET', stopPrice: message.entryPrice });
      } else {
        res = await binance.futuresMarketSell(message.symbol, quantity, { workingType: 'MARK_PRICE', type: 'STOP_MARKET', stopPrice: message.entryPrice });
      }
    } else if (trader.strategy == 'kplian_fut_alert_1') {
      if (message.buySell == 'BUY') {
        res = await binance.futuresMarketBuy(message.symbol, quantity, { type: 'MARKET' });
      } else {
        res = await binance.futuresMarketSell(message.symbol, quantity, { type: 'MARKET' });
      }
    }
    return res;
  }

  async closeSignal(symbol: string, action: string, manager: EntityManager): Promise<string> {

    const openSignals = await __(SignalModel.find({
      status: In(["filled"]),
      symbol: symbol
    }));
    let res: any;
    /*LOOP FOR STATUS OPEN SIGNALS*/
    for (const signal of openSignals) {
      for (const traderSignal of signal.traderSignals) {
        if (traderSignal.status == 'FILLED' && traderSignal.brokerId) {
          const binance = this.initBinance(traderSignal.trader);
          const order = await binance.futuresOrderStatus(signal.symbol, { orderId: traderSignal.brokerId });
          if (action == 'stop_sell') {
            binance.futuresMarketBuy(symbol, order.executedQty, { type: 'MARKET', reduceOnly: true });
          } else if (action == 'stop_buy') {
            binance.futuresMarketSell(symbol, order.executedQty, { type: 'MARKET', reduceOnly: true });
          }

          traderSignal.status3 = 'PENDING';
          traderSignal.brokerId3 = 1;

          binance.futuresCancelAll(signal.symbol);
          await manager.save(traderSignal);
        }
      }
      signal.status = 'closed';
      await manager.save(signal);


    }
    return 'success';
  }
  myRound(x: number, decimals: number): number {
    console.log('decimals', decimals);
    const exponent = Math.pow(10, decimals)
    const res = Math.round(x * exponent) / exponent;
    return res;
  }
}

export default Signal;
