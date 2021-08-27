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
 * Last modified  : 2021-07-13 23:48:19
 */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PxpEntity } from '@pxp-nd/entities';
import TraderSignal from './TraderSignal';

@Entity({ name: 'tbin_signal' })
export default class Signal extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'signal_id' })
  signalId: number;

  @Column({ name: 'foreign_id', type: 'numeric', nullable: true })
  foreignId: number;

  @Column({ name: 'message', type: 'varchar', nullable: false })
  message: string;
  // binance_spot, binance_futures
  @Column({ name: 'broker', type: 'varchar', length: 50, nullable: true })
  broker: string;

  @Column({ name: 'signal_channel', type: 'varchar', length: 50, nullable: false })
  signalChannel: string;

  @Column({ name: 'entry_price', type: 'numeric', nullable: true })
  entryPrice: number;

  @Column({ name: 'stop_loss', type: 'numeric', nullable: true })
  stopLoss: number;

  @Column({ name: 'tp1', type: 'numeric', nullable: true })
  tp1: number;

  @Column({ name: 'tp2', type: 'numeric', nullable: true })
  tp2: number;

  @Column({ name: 'tp3', type: 'numeric', nullable: true })
  tp3: number;

  @Column({ name: 'tp4', type: 'numeric', nullable: true })
  tp4: number;

  @Column({ name: 'tp5', type: 'numeric', nullable: true })
  tp5: number;

  @Column({ name: 'leverage', type: 'varchar', nullable: true })
  leverage: string;

  @Column({ name: 'buy_sell', type: 'varchar', nullable: true })
  buySell: string;

  @Column({ name: 'symbol', type: 'varchar', nullable: true })
  symbol: string;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: true })
  status: string;

  @Column({ name: 'mark_price_open', type: 'numeric', nullable: true })
  markPriceOpen: number;

  @Column({ name: 'real_time_date', type: 'timestamp', nullable: true, default: () => 'clock_timestamp()' })
  realTimeDate: Date;

  @OneToMany(() => TraderSignal, traderSignal => traderSignal.signal, { eager: true })
  traderSignals: TraderSignal[];

}