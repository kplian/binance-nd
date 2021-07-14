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
 * Last modified  : 2020-09-18 13:47:54
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PxpEntity } from '../../../lib/pxp';
import Signal from './Signal';
import Trader from './Trader';

@Entity({ name: 'tbin_trader_signal' })
export default class TraderSignal extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'trader_signal_id' })
  traderSignalId: number;  

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: false })
  status: string; 

  @Column({ name: 'strategy', type: 'varchar', length: 50, nullable: true })
  strategy: string; 

  @Column({ name: 'broker_id', type: 'varchar', length: 100, nullable: true })
  brokerId: string;

  @Column({ name: 'broker_id2', type: 'varchar', length: 100, nullable: true })
  brokerId2: string;

  @Column({ name: 'broker_id3', type: 'varchar', length: 100, nullable: true })
  brokerId3: string;

  @Column({ name: 'broker_id4', type: 'varchar', length: 100, nullable: true })
  brokerId4: string;

  @Column({ name: 'status2', type: 'varchar', length: 50, nullable: true })
  status2: string; 

  @Column({ name: 'status3', type: 'varchar', length: 50, nullable: true })
  status3: string; 

  @Column({ name: 'status4', type: 'varchar', length: 50, nullable: true })
  status4: string; 

  @Column({ name: 'real_time_date', type: 'timestamp', nullable: true, default: () => 'clock_timestamp()'})
  realTimeDate: Date; 

  @ManyToOne(() => Signal, signal => signal.traderSignals)
  @JoinColumn({ name: 'signal_id' })
  signal: Signal;

  @ManyToOne(() => Trader, trader => trader.traderSignals, {
    eager: true
  })
  @JoinColumn({ name: 'trader_id' })
  trader: Trader;
  
}