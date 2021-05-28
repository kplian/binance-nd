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
import path from 'path';
import { Controller, Post, DbSettings, ReadOnly, Authentication, PxpError, __, Log } from '../../../lib/pxp';
const MTProto = require('@mtproto/core');
const { sleep } = require('@mtproto/core/src/utils/common');

class Telegram extends Controller {
    mtproto: any;
    @Post()  
    @ReadOnly(false)
    @Authentication(true) 
    async message(params: Record<string, unknown>, manager: EntityManager): Promise<any> {
        const api_id = process.env.TELEGRAM_API;
        const api_hash = process.env.TELEGRAM_KEY;
        const myPhone = '+59167500602';
        // 1. Create instance
        this.mtproto = new MTProto({
            api_id,
            api_hash,
            storageOptions: {
                path: path.resolve(__dirname, './data/1.json'),
            },
        });
        //const code = await this.sendCode(myPhone);
        //const sinIn = await this.signIn( 83583, myPhone, '563407b93eb71ea295');
        //id": 1000374200,
        //"access_hash": "13044667402389959229",
        //const res = await this.call('messages.getAllChats', { except_ids: [] });
        const inputPeer = {
            _: 'inputPeerChat',
            chat_id: 528461060
            
          };
        const res =  await this.call('messages.sendMessage', {  
            peer: inputPeer,
            message: params.message,  
            random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff)
        });

        return res;
    
    }
    async call(method: string, params: any, options = {}):Promise<any> {
        try {
          const result = await this.mtproto.call(method, params, options);
    
          return result;
        } catch (error) {
          console.log(`${method} error:`, error);
    
          const { error_code, error_message } = error;
    
          if (error_code === 420) {
            const seconds = Number(error_message.split('FLOOD_WAIT_')[1]);
            const ms = seconds * 1000;
    
            await sleep(ms);
    
            return this.call(method, params, options);
          }
    
          if (error_code === 303) {
            const [type, dcIdAsString] = error_message.split('_MIGRATE_');
    
            const dcId = Number(dcIdAsString);
    
            // If auth.sendCode call on incorrect DC need change default DC, because
            // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
            if (type === 'PHONE') {
              await this.mtproto.setDefaultDc(dcId);
            } else {
              Object.assign(options, { dcId });
            }
    
            return this.call(method, params, options);
          }
    
          return Promise.reject(error);
        }
    }

    async signIn(code:number, phone:string, phone_code_hash:string ) {
        return await this.call('auth.signIn', {
          phone_code: code,
          phone_number: phone,
          phone_code_hash: phone_code_hash,
        });
    }

    async sendCode(phone: string): Promise<any> {
        return await this.call('auth.sendCode', {
          phone_number: '+59167500602',
          settings: {
            _: 'codeSettings',
          },
        });
    }
}

export default Telegram;