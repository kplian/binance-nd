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

}