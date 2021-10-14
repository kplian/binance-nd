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
 * Last modified  : 2021-07-13 23:56:11
 */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PxpEntity } from '@pxp-nd/entities';
import TraderSignal from './TraderSignal';
import TraderChannel from './TraderChannel';

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

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: true })
  status: string;

  @Column({ name: 'percentage_to_trade', type: 'numeric', nullable: true })
  percentageToTrade: number;

  @Column({ name: 'amount_to_trade', type: 'numeric', nullable: true })
  amountToTrade: number;

  @Column({ name: 'leverage', type: 'numeric', nullable: true })
  leverage: number;

  @Column({ name: 'margin_mode', type: 'varchar', length: 50, nullable: true })
  marginMode: string;

  @Column({ name: 'capital', type: 'numeric' })
  capital: number;

  @OneToMany(() => TraderSignal, traderSignal => traderSignal.trader)
  traderSignals: TraderSignal[];

  @OneToMany(() => TraderChannel, traderSignal => traderSignal.trader)
  traderChannels: TraderChannel[];

}