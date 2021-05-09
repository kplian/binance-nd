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
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PxpEntity } from '../../../lib/pxp';
import TraderSignal from './TraderSignal';

@Entity({ name: 'tbin_trader' })
export default class Trader extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'trader_id' })
  traderId: number;

  @Column({ name: 'name', type: 'varchar', length: 50, nullable: false })
  name: string;

  @Column({ name: 'api_id', type: 'varchar', nullable: false })
  apiId: string;

  @Column({ name: 'api_secret', type: 'varchar', nullable: false })
  apiSecret: string;
  
  @Column({ name: 'test_api_id', type: 'varchar', nullable: false })
  testApiId: string;
  // binance_spot, binance_futures
  @Column({ name: 'test_api_secret', type: 'varchar', nullable: true })
  testApiSecret: string;

  @Column({ name: 'strategy', type: 'varchar', length: 50, nullable: false })
  strategy: string; 

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: true })
  status: string; 

  @OneToMany(() => TraderSignal, traderSignal => traderSignal.trader)
  traderSignals: TraderSignal[];
  
}