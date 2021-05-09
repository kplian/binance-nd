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
import SymbolModel from '../entity/Symbol';

const Binance = require('node-binance-api');



class Symbol extends Controller {
    @Post()  
    @ReadOnly(false)
    @Authentication(true) 
    async updateSymbols(params: Record<string, unknown>, manager: EntityManager): Promise<any> {
        const binance = new Binance().options({            
            test: true
          });    
        
        const res = await binance. futuresExchangeInfo( ) ;   
        for (const symbol of res.symbols) {
            let  s = await __(SymbolModel.findOne({
                code: symbol.symbol
            }));  
            console.log(s);
            if (s) {
                s.quantityPrecision = symbol.quantityPrecision;
                s.pricePrecision = symbol.pricePrecision;
                const sResult = await __(manager.save(s));
            } else {
                s = new SymbolModel();
                s.code = symbol.symbol;
                s.quantityPrecision = symbol.quantityPrecision;
                s.pricePrecision = symbol.pricePrecision;
                const sResult = await __(manager.save(s));
            }
            
        }
        return res;
    
    }
}

    export default Symbol;