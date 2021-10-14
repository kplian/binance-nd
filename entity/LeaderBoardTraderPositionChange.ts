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
 * Last modified  : 2021-08-28 22:41:50
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PxpEntity } from '@pxp-nd/entities';


@Entity({ name: 'tbin_leaderboard_trader_position_change' })
export default class LeaderBoardTraderPositionChange extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'leaderboard_trader_position_change_id' })
  leaderboardTraderPositionChangeId: number;

  @Column({ name: 'leaderboard_trader_position_id', type: 'integer' })
  leaderBoardTraderPositionId: number;

  @Column({ name: 'type', type: 'varchar', length: 50, nullable: false })
  type: string;

  @Column({ name: 'amount', type: 'numeric' })
  amount: number;

  @Column({ name: 'percentage', type: 'numeric' })
  percentage: number;

  @Column({ name: 'mark_price', type: 'numeric' })
  markPrice: number;

}