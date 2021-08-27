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
import LeaderBoardTraderModel from '../entity/LeaderBoardTrader';
import LeaderBoardTraderPositionModel from '../entity/LeaderBoardTraderPosition';

const Binance = require('node-binance-api');
import axios, { AxiosRequestConfig } from 'axios';
import { Common } from '../services/common';
import Telegram from './Telegram';
import Signal from './Signal';


class LeaderBoardTrader extends Controller {
    private config: AxiosRequestConfig = {
        method: 'post',
        url: 'https://www.binance.com/bapi/futures/v1/public/future/leaderboard/getOtherPosition',
        headers: { 
          'authority': 'www.binance.com', 
          'x-trace-id': 'd9a40aed-9483-4a67-b358-3a278808d8bb', 
          'csrftoken': 'd41d8cd98f00b204e9800998ecf8427e', 
          'x-ui-request-trace': 'd9a40aed-9483-4a67-b358-3a278808d8bb', 
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36', 
          'content-type': 'application/json', 
          'lang': 'en', 
          'fvideo-id': '31cef7745c35a04d811b7b2a6cb5ca22035c16a5', 
          'device-info': 'eyJzY3JlZW5fcmVzb2x1dGlvbiI6IjkwMCwxNjAwIiwiYXZhaWxhYmxlX3NjcmVlbl9yZXNvbHV0aW9uIjoiODczLDE2MDAiLCJzeXN0ZW1fdmVyc2lvbiI6IkxpbnV4IHg4Nl82NCIsImJyYW5kX21vZGVsIjoidW5rbm93biIsInN5c3RlbV9sYW5nIjoiZW4tVVMiLCJ0aW1lem9uZSI6IkdNVC00IiwidGltZXpvbmVPZmZzZXQiOjI0MCwidXNlcl9hZ2VudCI6Ik1vemlsbGEvNS4wIChYMTE7IExpbnV4IHg4Nl82NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg0LjAuNDE0Ny4xMjUgU2FmYXJpLzUzNy4zNiIsImxpc3RfcGx1Z2luIjoiQ2hyb21lIFBERiBQbHVnaW4sQ2hyb21lIFBERiBWaWV3ZXIsTmF0aXZlIENsaWVudCIsImNhbnZhc19jb2RlIjoiYzdkMDQzMDkiLCJ3ZWJnbF92ZW5kb3IiOiJJbnRlbCIsIndlYmdsX3JlbmRlcmVyIjoiTWVzYSBJbnRlbChSKSBJcmlzKFIpIFBsdXMgR3JhcGhpY3MgKElDTCBHVDIpIiwiYXVkaW8iOiIxMjQuMDQzNDQ4OTAzNTYxNTEiLCJwbGF0Zm9ybSI6IkxpbnV4IHg4Nl82NCIsIndlYl90aW1lem9uZSI6IkFtZXJpY2EvTGFfUGF6IiwiZGV2aWNlX25hbWUiOiJDaHJvbWUgVjg0LjAuNDE0Ny4xMjUgKExpbnV4KSIsImZpbmdlcnByaW50IjoiOTIzZDJlYmE2MDk5N2Q4NDUyNjY3MTk1MjExZmM1NDAiLCJkZXZpY2VfaWQiOiIiLCJyZWxhdGVkX2RldmljZV9pZHMiOiIxNjI2NTczNjMxNDIyMHVjVlhoNlY4YWFPSVhjVGlFcyJ9', 
          'bnc-uuid': 'e40cf391-cf9c-4e88-abd9-ee62e77562c7', 
          'clienttype': 'web', 
          'accept': '*/*', 
          'origin': 'https://www.binance.com', 
          'sec-fetch-site': 'same-origin', 
          'sec-fetch-mode': 'cors', 
          'sec-fetch-dest': 'empty', 
          'referer': 'https://www.binance.com/en/futures-activity/leaderboard/user?uid=26BADB788E7F76E4DFA2EF97CD58194D&tradeType=PERPETUAL', 
          'accept-language': 'en-US,en;q=0.9', 
          'cookie': 'cid=OTiVZtlC; _ga=GA1.2.588189315.1621872121; bnc-uuid=e40cf391-cf9c-4e88-abd9-ee62e77562c7; home-ui-ab=B; fiat-prefer-currency=USD; source=internal; campaign=trading_dashboard; crypto_deposit_refactor=21; userPreferredCurrency=USD_USD; _gid=GA1.2.837899453.1626450782; nft-init-compliance=true; BNC_FV_KEY=31cef7745c35a04d811b7b2a6cb5ca22035c16a5; BNC_FV_KEY_EXPIRE=1626658429132; logined=y; isAccountsLoggedIn=y; __BINANCE_USER_DEVICE_ID__={"cfd5669ea8338ff7e2082129264c0421":{"date":1626573631683,"value":"16265736314220ucVXh6V8aaOIXcTiEs"}}; logined=y; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22129609443%22%2C%22first_id%22%3A%221799f1c96d0e71-03720ae511c6fc-3970095d-1440000-1799f1c96d1113c%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E8%87%AA%E7%84%B6%E6%90%9C%E7%B4%A2%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC%22%2C%22%24latest_referrer%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%2C%22%24latest_utm_source%22%3A%22internal%22%2C%22%24latest_utm_medium%22%3A%22homepage%22%2C%22%24latest_utm_campaign%22%3A%22trading_dashboard%22%7D%2C%22%24device_id%22%3A%221799f1c96d0e71-03720ae511c6fc-3970095d-1440000-1799f1c96d1113c%22%7D; _gat=1; lang=en'
        },
        data : ''
      };
    @Post()
    @ReadOnly(false)
    @Authentication(true)
    async generatePositions(params: Record<string, unknown>, manager: EntityManager): Promise<any> {
        const traders = await LeaderBoardTraderModel.find({ status: 'active'});
        let common = new Common();
        const s = new Signal('binance');
        for (let trader of traders) {
            this.config.data = JSON.stringify({
                "encryptedUid": trader.uuid,
                "tradeType": "PERPETUAL"
            });
            const res = await axios(this.config);
            
            //CLOSE POSITIONS
            let traderPositions = await LeaderBoardTraderPositionModel.find({ status: 'open', leaderBoardTrader: trader});
            for (let position of traderPositions) {
                if (!this.exists(position, res.data.data.otherPositionRetList)) {
                    position.status = 'closed';                    
                    position.closeDate = new Date();                    
                    const marketPrice= await common.binanceGetMarkPrice(position.symbol);
                    position.closePrice = marketPrice;
                    position.roe = position.direction == 'buy' ? ((position.closePrice * 100 / position.entryPrice) - 100) : (((position.closePrice * 100 / position.entryPrice) - 100) * -1);
                    manager.save(position);
                    const m = new Telegram('binance');        
                    m.message({ message: `TYPE: Leaderboard ${trader.name}📈 \nSYMBOL: ${position.symbol}📈 \nACTION: ${position.direction} \nENTRY PRICE: ${position.entryPrice} \nCLOSE PRICE: ${position.closePrice} \nROE: ${position.roe}` }, manager); 
                    if (position.signalId) {
                        await s.closeSignalById(position.signalId, manager);
                    }
                }
            }

            //OPEN POSITIONS
            if (res.data.data.otherPositionRetList) {
                console.log(res.data.data.otherPositionRetList, trader.name);
                for (let position of res.data.data.otherPositionRetList) {
                    let direction = 'buy';
                    if (position.amount  < 0 ) {
                        direction = 'sell';
                    }
                    let traderPosition = await LeaderBoardTraderPositionModel.findOne({ status: 'open', symbol: position.symbol, direction, leaderBoardTrader: trader });
                    console.log(traderPosition);
                    if (!traderPosition && position.symbol != 'BTCUSDT_210924') {
                        
                        traderPosition = new LeaderBoardTraderPositionModel();
                        const marketPrice= await common.binanceGetMarkPrice(position.symbol);
                        traderPosition.entryPrice = marketPrice;
                        traderPosition.symbol = position.symbol;
                        traderPosition.direction = direction;
                        traderPosition.status = 'open';
                        traderPosition.leaderBoardTrader = trader;                    
                        const m = new Telegram('binance');        
                        m.message({ message: `TYPE: Leaderboard ${trader.name}📈 \nSYMBOL: ${position.symbol}📈 \nACTION: ${direction} \nPRICE: ${position.entryPrice} \n` }, manager);    
                        if (trader.autoTrade == 'Y') {
                            //if (traderPosition.direction == 'buy') {
                                const resSignal = await s.addForm({
                                    broker: "binance_futures",   
                                    status: "filled",   
                                    marketPrice: marketPrice,                    
                                    signalChannel: "kplian_leaderboard",
                                    buySell: traderPosition.direction == 'buy' ? "BUY" : 'SELL',                        
                                    symbol: position.symbol
                                }, manager);
    
                                if (resSignal.status == 'open' || resSignal.status == 'filled') {
                                    traderPosition.signalId = resSignal.signalId; 
                                }
                            //}
                            

                        }
                        manager.save(traderPosition);
                    }
                }
            }

            
            
        }
        return { success: true};
    }

    exists(positionSearch: LeaderBoardTraderPositionModel, positionsArray: any):boolean {
        if (positionsArray) {
            for (let position of positionsArray) {
                let direction = 'buy';
                if (position.amount  < 0 ) {
                    direction = 'sell';
                }
                if (position.symbol == positionSearch.symbol && direction == positionSearch.direction) {
                    return true;
                }
            }
        }
        return false;
    }

    
}

export default LeaderBoardTrader;
