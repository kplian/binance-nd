/**************************************************************************
 SYSTEM/MODULE  : Binance
 FILE           : Alert.ts
 DESCRIPTION    : Alert entity
 ***************************************************************************
 ISSUE      DATE          AUTHOR        DESCRIPTION
 10/05/2021    RCM           File creation
 ***************************************************************************/
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PxpEntity } from '../../../lib/pxp';

@Entity({ name: 'tbin_alert' })
export default class Alert extends PxpEntity {

    @PrimaryGeneratedColumn({ name: 'alert_id' })
    alertId: number;

    @Column({ name: 'type', type: 'varchar', length: 15, nullable: true })
    type: string;

    @Column({ name: 'content', type: 'text', nullable: true })
    content: string;

    @Column({ name: 'date', type: 'date', nullable: false })
    date: Date;

    @Column({ name: 'status', type: 'varchar', length: 15, nullable: true })
    status: string;

    //Since here the columns correspond to the index
    @Column({ name: 'exchange', type: 'varchar', length: 100, nullable: true })
    exchange: string;

    @Column({ name: 'ticker', type: 'varchar', length: 100, nullable: true })
    ticker: string;

    @Column({ name: 'price', type: 'numeric', nullable: true })
    price: number;

    @Column({ name: 'volume', type: 'numeric', nullable: true })
    volume: number;

    @Column({ name: 'close', type: 'numeric', nullable: true })
    close: number;

    @Column({ name: 'open', type: 'numeric', nullable: true })
    open: number;

    @Column({ name: 'high', type: 'numeric', nullable: true })
    high: number;

    @Column({ name: 'low', type: 'numeric', nullable: true })
    low: number;

    @Column({ name: 'time', type: 'varchar', nullable: true })
    time: string;

    @Column({ name: 'timenow', type: 'varchar', nullable: true })
    timenow: string;

    @Column({ name: 'plot_0', type: 'numeric', nullable: true })
    plot0: number;

    @Column({ name: 'plot_1', type: 'numeric', nullable: true })
    plot1: number;

    @Column({ name: 'plot_2', type: 'numeric', nullable: true })
    plot2: number;

    @Column({ name: 'plot_3', type: 'numeric', nullable: true })
    plot3: number;

    @Column({ name: 'plot_4', type: 'numeric', nullable: true })
    plot4: number;

    @Column({ name: 'plot_5', type: 'numeric', nullable: true })
    plot5: number;

    @Column({ name: 'plot_6', type: 'numeric', nullable: true })
    plot6: number;

    @Column({ name: 'interval', type: 'varchar', nullable: true })
    interval: string;

    @Column({ name: 'previous_alert_id_fk', type: 'numeric', nullable: true })
    previousAlertIdFk: number;

    @Column({ name: 'market_price', type: 'numeric', nullable: true })
    marketPrice: number;

}