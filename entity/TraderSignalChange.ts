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
 * Last modified  : 2021-08-28 22:21:36
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PxpEntity } from '@pxp-nd/entities';


@Entity({ name: 'tbin_trader_signal_change' })
export default class TraderSignalChange extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'trader_signal_change_id' })
  traderSignalChangeId: number;

  @Column({ name: 'trader_signal_id', type: 'integer' })
  traderSignalId: number;

  @Column({ name: 'type', type: 'varchar', length: 50, nullable: false })
  type: string;

  @Column({ name: 'amount', type: 'numeric' })
  amount: number;

}