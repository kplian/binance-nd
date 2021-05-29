/**************************************************************************
 SYSTEM/MODULE  : Binance
 FILE           : Alert.ts
 DESCRIPTION    : To get data for the alerts
 ***************************************************************************
 ISSUE      DATE          AUTHOR        DESCRIPTION
 09/05/2021    RCM           File creation
 ***************************************************************************/
import { Controller, __, PxpError } from '../../../lib/pxp';
import {
    Get,
    Post,
    Route,
    Authentication,
    DbSettings,
    ReadOnly,
    Model,
    Log
} from '../../../lib/pxp/Decorators';
import { EntityManager, getManager, In, IsNull } from 'typeorm';
import AlertModel from '../entity/Alert';
import { Common } from './../services/common';
import Telegram from './Telegram';
import Signal from './Signal';;
import Symbol from '../entity/Symbol';
@Route('/alert')
@Model('binance/Alert')
class Alert extends Controller {

    @Post()
    @ReadOnly(false)
    @Authentication(false)    
    @Log(false)
    async addexternal(params: any, manager: EntityManager): Promise<any> {
        //Get/set json from request
        let json = params;
        if(params.bodyText) {
            //TODO: Parse string to json
            throw new PxpError(501, 'Alerts in string format is not yet implemented');
        }

        //Find previous alert by coin and interval
        const alertPrev = await this.getLastAlert(json.ticker, json.interval, json.time);

        const lastAction = await this.getLastAction(json.ticker);
        
        //Get market price
        let common = new Common();
        let marketPrice = json.price;
        if ((params.type == 'control' && json.interval == '60') || params.type != 'control') {
            marketPrice= await common.binanceGetMarkPrice(json.ticker.replace('PERP', ''));
        }

        //Save the alert        
        const alert = new AlertModel();
        alert.type = params.type as string;
        alert.content = params as string;
        alert.date = new Date();
        alert.status = 'active';
        alert.createdBy = 'admin';
        alert.createdAt = new Date();
        //Extended fields
        alert.exchange = json.exchange;
        alert.ticker = json.ticker;
        alert.price = json.price;
        alert.volume = json.volume;
        alert.close = json.close;
        alert.open = json.open;
        alert.high = json.high;
        alert.low = json.low;
        alert.time = json.time;
        alert.timenow = json.timenow;
        alert.plot0 = json.plot_0;
        alert.plot1 = json.plot_1;
        alert.plot2 = json.plot_2;
        alert.plot3 = json.plot_3;
        alert.plot4 = json.plot_4;
        alert.plot5 = json.plot_5;
        alert.plot6 = json.plot_6;
        alert.interval = json.interval;
        alert.previousAlertIdFk = alertPrev ? alertPrev.alert_id : null;
        alert.marketPrice = marketPrice;
        if (json.plot_1) {
            alert.signalType = 'long';
        }

        if (json.plot_3) {
            alert.signalType = 'short';
        }

        if (json.plot_5 && json.plot_6) {
            if (json.plot_5 > json.plot_6) {
                alert.trend = 'green';
            } else if ( json.plot_6 > json.plot_5) {
                alert.trend = 'red';
            }
        }
        alert.isTouching = 'N';
        if (alert.trend == 'green') { 
    		if (alert.high >= alert.plot6 && alert.low <= alert.plot5) { 
    			alert.isTouching = 'Y'; 	
            }
        }
    
    	if (alert.trend == 'red') {
    		if (alert.high >= alert.plot5 && alert.low <= alert.plot6) { 
    			alert.isTouching = 'Y'; 	
            }
    	}

        if (json.plot_4 && alertPrev) {
            if (alertPrev.plot_4) {
                alert.tracing = json.plot_4 / alertPrev.plot_4 * 100;
            }            
        }

        alert.action = 'nothing';        
        if (alert.type == 'control' && alertPrev && alertPrev.is_touching == 'Y' && alert.isTouching == 'N' && alert.interval == '60') {
            
            if (alert.low > alert.plot5) {
                alert.action = 'buy';
            }
		    	
            if (alert.high < alert.plot5) {
                alert.action = 'sell';
            }
            if (lastAction && alert.action == lastAction.action) {
                alert.action = 'nothing';
            }
        }

        if (alert.type == 'control' && alert.interval == '60' && lastAction) {            
            if (lastAction.action == 'buy' && (alert.isTouching == 'Y' ||  alert.plot6 / alert.plot5 < 0.98)  ) { 
                alert.actionPreviousPrice = lastAction.market_price;
                alert.action = 'stop_buy';	
                alert.pnlPercentage = (alert.marketPrice * 100 / alert.actionPreviousPrice) - 100;
            }
        
            if (lastAction.action == 'sell'  && (alert.isTouching == 'Y' ||  alert.plot5 / alert.plot6 < 0.98) ) { 
                alert.actionPreviousPrice = lastAction.market_price;
                alert.action = 'stop_sell';	 
                alert.pnlPercentage = ((alert.marketPrice * 100 / alert.actionPreviousPrice) - 100) * -1;
            }
        }

        if (alert.type != 'control' && lastAction) {            
            if (lastAction.action == 'buy') { 
                alert.actionPreviousPrice = lastAction.market_price;
                alert.action = 'stop_buy';	
                alert.pnlPercentage = (alert.marketPrice * 100 / alert.actionPreviousPrice) - 100;
            }
        
            if (lastAction.action == 'sell') { 
                alert.actionPreviousPrice = lastAction.market_price;
                alert.action = 'stop_sell';	 
                alert.pnlPercentage = ((alert.marketPrice * 100 / alert.actionPreviousPrice) - 100) * -1;
            }
        }

        if (alert.action != 'nothing') {
            const m = new Telegram('binance');
            m.message({ message: `SYMBOL: ${alert.ticker}📈 \nACTION: ${alert.action} \nPRICE: ${alert.marketPrice} \nPREVIOUS PRICE: ${alert.actionPreviousPrice}` }, manager);    
            const s = new Signal('binance');
            if (alert.action == 'stop_sell' || alert.action == 'stop_buy') {
                await s.closeSignal(alert.ticker.slice(0, -4), alert.action, manager);
            } else {
                const mySymbol = await Symbol.findOne({code: alert.ticker.slice(0, -4), autoTrade: 'Y'});
                if (mySymbol) {
                    await s.addForm({
                        broker: "binance_futures",    
                        signalChannel: "kplian_alert",
                        buySell: alert.action == 'buy' ? "BUY" : 'SELL',                        
                        symbol: alert.ticker.slice(0, -4)
                    }, manager);
                }                
            }
        }
        
        await __(manager.save(alert));

        //Response
        return alert;
    }

    @Post()
    @ReadOnly(false)
    @Authentication(false)
    async test(params: any, manager: EntityManager): Promise<any> {
        console.log('test binance', params);
        let json = params;
        if(json.bodyText) {
            console.log('body body',json.bodyText);
            //let re = /\\":\\;
            const parse = json.bodyText.split('\\n',100);
            let re = new RegExp("\d\\d");
            parse.map((pos: any) => {
                console.log('pos', pos)
                return pos.replace(re, "");
            });
            console.log('FIN', parse);
            json = JSON.parse(json.bodyText)
        }

        return json;
    }

    async getLastAlert(coin: any, interval: any, time: string):Promise<any> {
        const resQuery = await getManager().query(`
            select * 
            from tbin_alert ta 
            where ta.interval = '${interval}' and ta.type='control' and ta.ticker  = '${coin}'  and left(ta.timenow, 16) = left('${time}', 16)            
            order by ta.alert_id desc
            limit 1 offset 0 `);
        if (resQuery.length > 0) {
            return resQuery[0];
        }
        return null;        
    }

    async getLastAction(coin: any):Promise<any> {
        const resQuery = await getManager().query(`
            select * 
            from tbin_alert a 
            where a.ticker = '${coin}' and a.action in ('sell', 'buy', 'stop_sell', 'stop_buy') 
                and ((a.type = 'control' and a.interval = '60') or a.type != 'control')
            order by a.alert_id desc limit 1`);
        if (resQuery.length > 0) {
            return resQuery[0];
        }
        return null;        
    }

    async getLastTouching(coin: any):Promise<any> {
        const resQuery = await getManager().query(`
            select * 
            from tbin_alert a 
            where a.ticker = '${coin}' and a.is_touching = 'Y'
                and a.type = 'control' and a.interval = '60'
            order by a.alert_id desc limit 1`);
        if (resQuery.length > 0) {
            return resQuery[0];
        }
        return null;        
    }

    @Post()
    @ReadOnly(false)
    @Authentication(false)
    async restoreexternal(params: any, manager: EntityManager): Promise<any> {
        console.log('restore', params);


        const alerts = await AlertModel.find({
            where: {
                exchange: IsNull()
            }
        });

        alerts.map(async (alert) => {
            //Extended fields
            const content = JSON.parse(alert.content);
            //console.log('it', content.exchange)
            alert.exchange = content.exchange;
            alert.ticker = content.ticker;
            alert.price = content.price;
            alert.volume = content.volume;
            alert.close = content.close;
            alert.open = content.open;
            alert.high = content.high;
            alert.low = content.low;
            alert.time = content.time;
            alert.timenow = content.timenow;
            alert.plot0 = content.plot_0;
            alert.plot1 = content.plot_1;
            alert.plot2 = content.plot_2;
            alert.plot3 = content.plot_3;
            alert.plot4 = content.plot_4;
            alert.plot5 = content.plot_5;
            alert.plot6 = content.plot_6;
            alert.interval = content.interval;
            alert.marketPrice = content.price;
            alert.type = 'fixed';
            await __(manager.save(alert));
            console.log('it: ',alert.alertId);
        })

        return 'done';

        //Get/set json from request
        let json = params;
        if(params.bodyText) {
            //TODO: Parse string to json
            throw new PxpError(501, 'Alerts in string format is not yet implemented');
        }

        //Find previous alert by coin and interval
        const alertPrev = await this.getLastAlert(json.ticker, json.interval, json.time);

        //Get market price
        let common = new Common();
        const marketPrice= await common.binanceGetMarkPrice(json.ticker.replace('PERP', ''));

        //Save the alert
        console.log('vvvvv', json)
        const alert = new AlertModel();
        alert.type = params.type as string;
        alert.content = params as string;
        alert.date = new Date();
        alert.status = 'active';
        alert.createdBy = 'admin';
        alert.createdAt = new Date();
        //Extended fields
        alert.exchange = json.exchange;
        alert.ticker = json.ticker;
        alert.price = json.price;
        alert.volume = json.volume;
        alert.close = json.close;
        alert.open = json.open;
        alert.high = json.high;
        alert.low = json.low;
        alert.time = json.time;
        alert.timenow = json.timenow;
        alert.plot0 = json.plot_0;
        alert.plot1 = json.plot_1;
        alert.plot2 = json.plot_2;
        alert.plot3 = json.plot_3;
        alert.plot4 = json.plot_4;
        alert.plot5 = json.plot_5;
        alert.plot6 = json.plot_6;
        alert.interval = json.interval;
        alert.previousAlertIdFk = alertPrev.alertId;
        alert.marketPrice = marketPrice;
        await __(manager.save(alert));

        //Response
        return alert;
    }

}

export default Alert;