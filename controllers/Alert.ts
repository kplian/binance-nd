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
import { EntityManager, getManager, In } from 'typeorm';
import AlertModel from '../entity/Alert';
import { Common } from './../services/common';

@Route('/alert')
@Model('binance/Alert')
class Alert extends Controller {

    @Post()
    @ReadOnly(false)
    @Authentication(false)    
    async addexternal(params: any, manager: EntityManager): Promise<any> {
        console.log('add alert received', params);

        //Get/set json from request
        let json = params;
        if(params.bodyText) {
            //TODO: Parse string to json
            throw new PxpError(501, 'Alerts in string format is not yet implemented');
        }

        //Find previous alert by coin and interval
        const alertPrev = await this.getLastAlert(json.ticker, json.interval);

        //Get market price
        let common = new Common();
        const marketPrice= await common.binanceGetMarkPrice(json.ticker.replace('PERP', ''));

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
        alert.previousAlertIdFk = alertPrev.alertId;
        alert.marketPrice = marketPrice;
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

    async getLastAlert(coin: any, interval: any):Promise<any> {
        const query = await getManager().createQueryBuilder(AlertModel, "alert");
        query.select("MAX(alert.alert_id)", "alertId");
        query.where("alert.ticker = :ticker", { ticker: coin });
        query.andWhere("alert.interval = :interval", { interval: interval });
        return query.getRawOne();
    }

}

export default Alert;