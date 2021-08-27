import axios, { AxiosRequestConfig } from 'axios';
import { __ } from '@pxp-nd/core';

export class Common {

  async binanceGetMarkPrice(symbol: string): Promise<number> {
    const response = await __(axios.get(
      process.env.BINANCE_URL + '/fapi/v1/premiumIndex?symbol=' + symbol.replace('/', ''),
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 2000
      }).catch((error) => {
        console.log(error)
      }));

    return response.data.markPrice;

  }
}