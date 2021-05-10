/* Kplian Ltda 2020
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
import { EntityManager, } from 'typeorm';
import { Controller, Post, DbSettings, ReadOnly, Authentication, PxpError, __, Log } from '../../../lib/pxp';
import TraderModel from '../entity/Trader';
import { NumberSchema } from '@hapi/joi';

const Binance = require('node-binance-api');



class Trader extends Controller {
    @Post()
    @ReadOnly(false)
    @Authentication(true)
    async getBalance(params: Record<string, unknown>, manager: EntityManager): Promise<any> {

        const  trader = await __(TraderModel.findOne(params.traderId as number));
        const apiSecret = process.env.NODE_ENV == 'development' ? trader.testApiSecret: trader.apiSecret;
        const apiKey = process.env.NODE_ENV == 'development' ? trader.testApiId: trader.apiId;
        const binance = new Binance().options({
            APIKEY: apiKey,
            APISECRET: apiSecret,
            test: process.env.NODE_ENV == 'development' ? true : false
        });
        const response = await binance.futuresBalance();
        return response;
    }

    @Post()
    @ReadOnly(false)
    @Authentication(true)
    async cancel(params: Record<string, unknown>, manager: EntityManager): Promise<any> {

        return { success: true }
    }
}

export default Trader;
