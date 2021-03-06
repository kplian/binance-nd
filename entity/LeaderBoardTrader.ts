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
import LeaderBoardTraderPosition from './LeaderBoardTraderPosition';


@Entity({ name: 'tbin_leaderboard_trader' })
export default class LeaderBoardTrader extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'leaderboard_trader_id' })
  leaderboardTraderId: number;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ name: 'uuid', type: 'varchar', length: 50, nullable: false })
  uuid: string;  

  @Column({ name: 'status', type: 'varchar', length: 100, nullable: false })
  status: string;

  @Column({ name: 'auto_trade', type: 'varchar', length: 1, nullable: false, default: 'N' })
  autoTrade: string;

  @OneToMany(() => LeaderBoardTraderPosition, leaderBoardTraderPosition => leaderBoardTraderPosition.leaderBoardTrader)
  leaderBoardTraderPositions: LeaderBoardTraderPosition[];
  
}1627171054398