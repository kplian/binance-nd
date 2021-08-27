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
 * Last modified  : 2021-07-13 23:56:02
 */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { PxpEntity } from '@pxp-nd/entities';

@Entity({ name: 'tbin_symbol' })
export default class Symbol extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'symbol_id' })
  symbolId: number;

  @Column({ name: 'code', type: 'varchar', length: 50, nullable: false })
  code: string;

  @Column({ name: 'quantity_precision', type: 'numeric' })
  quantityPrecision: number;

  @Column({ name: 'price_precision', type: 'numeric', nullable: true })
  pricePrecision: number;

  @Column({ name: 'auto_trade', type: 'varchar', nullable: true })
  autoTrade: string;

}