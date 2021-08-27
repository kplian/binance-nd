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
 * Last modified  : 2021-07-13 23:55:55
 */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PxpEntity } from '@pxp-nd/entities';

@Entity({ name: 'tbin_simulation' })
export default class Simulation extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'simulation_id' })
  traderId: number;

  @Column({ name: 'symbol', type: 'varchar', length: 50, nullable: false })
  symbol: string;

  @Column({ name: 'type', type: 'varchar', length: 50, nullable: false })
  type: string;

  @Column({ name: 'init_price', type: 'numeric', nullable: false })
  initPrice: number;

  @Column({ name: 'end_price', type: 'numeric', nullable: false })
  endPrice: number;

  @Column({ name: 'start_date', type: 'date', nullable: false })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: false })
  endDate: Date;

  @Column({ name: 'init_amount', type: 'numeric', nullable: false })
  initAmount: number;

  @Column({ name: 'end_amount', type: 'numeric', nullable: false })
  endAmount: number;

  @Column({ name: 'percentage_pnl', type: 'numeric', nullable: false })
  percentagePnl: number;

  @Column({ name: 'pnl', type: 'numeric', nullable: false })
  pnl: number;

}