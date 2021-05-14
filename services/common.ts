import axios, { AxiosRequestConfig } from 'axios';
import { __ } from '../../../lib/pxp';

export class Common {

     async binanceGetMarkPrice(symbol: string): Promise<number>{
        const response = await __(axios.get(
            process.env.BINANCE_URL + '/fapi/v1/premiumIndex?symbol=' +  symbol.replace('/', ''),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).catch((error) => {
            console.log(error)
        }));

        return response.data.markPrice;

    }
}