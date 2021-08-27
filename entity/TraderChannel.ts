/**
 * Kplian Ltda 2020
 *
 * MIT
 *
 * long description for the file
 *
 * @summary short description for the file
 * @author No author
 *
 * Created at     : 2020-09-17 18:55:38
 * Last modified  : 2021-07-13 23:56:21
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PxpEntity } from '@pxp-nd/entities';
import Signal from './Signal';
import Trader from './Trader';

@Entity({ name: 'tbin_trader_channel' })
export default class TraderChannel extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'trader_channel_id' })
  traderChannelId: number;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: false })
  status: string;

  @Column({ name: 'channel', type: 'varchar', length: 50, nullable: false })
  channel: string;

  @Column({ name: 'broker', type: 'varchar', length: 50, nullable: false })
  broker: string;

  @Column({ name: 'strategy', type: 'varchar', length: 150, nullable: false })
  strategy: string;


  @ManyToOne(() => Trader, trader => trader.traderChannels, {
    eager: true
  })
  @JoinColumn({ name: 'trader_id' })
  trader: Trader;

}