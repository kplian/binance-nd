/**************************************************************************
 SYSTEM/MODULE  : Binance
 FILE           : Alert.ts
 DESCRIPTION    : To get data for the alerts
 ***************************************************************************
 ISSUE      DATE          AUTHOR        DESCRIPTION
            09/05/2021    RCM           File creation
 ***************************************************************************/
import { Controller, __ } from '../../../lib/pxp';
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

@Route('/alert')
class Alert extends Controller {

    @Get()
    @ReadOnly(false)
    @Authentication(false)
    @Log(false)
    async add(params: Record<string, unknown>, manager: EntityManager): Promise<any> {
        console.log('yes');
        console.log('received', params);
        const alert = new AlertModel();
        alert.type = params.type as string;
        alert.content = params.content as string;
        alert.date = new Date();
        alert.status = 'active';
        alert.createdBy = 'admin';
        alert.createdAt = new Date();
        await __(manager.save(alert));

        return alert;
    }

}

export default Alert;